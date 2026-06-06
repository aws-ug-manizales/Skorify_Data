import {
  UserEnrollmentEntity,
  scoreEnrollmentTimeline,
  streakBonusRules,
} from "@skorify/domain/user-enrollment";
import { PredictionScoreRuleset } from "@skorify/domain/prediction";
import { Repository } from "typeorm";
import { UserEnrollment } from "../../entities/UserEnrollment";
import { UserEnrollmentMapper } from "../mappers/user-enrollment.mappert";
import { BaseDataService } from "./base.service";

interface TimelineRow {
  prediction_id: string | null;
  p_away: number | null;
  p_home: number | null;
  m_away: number;
  m_home: number;
}

export class UserEnrollmentService extends BaseDataService<
  UserEnrollment,
  UserEnrollmentEntity
> {
  constructor(
    repository: Repository<UserEnrollment>,
    mapper: UserEnrollmentMapper,
  ) {
    super(UserEnrollment, repository, mapper);
  }

  async recomputeEnrollment(enrollmentId: string): Promise<void> {
    await this.runInTransaction(async (manager) => {
      // Lock the enrollment so a concurrent live scorePrediction cannot be
      // overwritten by this absolute recompute (and vice versa).
      await manager.query(
        `SELECT id FROM user_enrollments WHERE id = $1 FOR UPDATE`,
        [enrollmentId],
      );

      const rows: TimelineRow[] = await manager.query(
        `SELECT p.id AS prediction_id, p.away_score AS p_away, p.home_score AS p_home,
                m.away_score AS m_away, m.home_score AS m_home
           FROM matches m
           LEFT JOIN predictions p
             ON p.match_id = m.id
            AND p.user_enrollment_id = $1
            AND p.deleted_at IS NULL
          WHERE m.tournament_id = (SELECT tournament_id FROM user_enrollments WHERE id = $1)
            AND m.status = 'finished'
            AND m.deleted_at IS NULL
          ORDER BY m.kick_off ASC, m.id ASC`,
        [enrollmentId],
      );

      const { perEntry, total, streak, maxStreak } = scoreEnrollmentTimeline(
        rows.map((row) => ({
          prediction:
            row.prediction_id === null
              ? null
              : { awayScore: row.p_away as number, homeScore: row.p_home as number },
          match: { awayScore: row.m_away, homeScore: row.m_home },
        })),
      );

      const writes = rows.map((row, i) => ({
        predictionId: row.prediction_id,
        scored: perEntry[i],
      }));

      for (const { predictionId, scored } of writes) {
        if (predictionId === null || !scored) continue;

        await manager.query(
          `UPDATE predictions
              SET earned_points = $2, has_exact_result = $3,
                  is_calculated = true, updated_at = now()
            WHERE id = $1`,
          [predictionId, scored.earned, scored.isExact],
        );
      }

      await manager.query(
        `UPDATE user_enrollments
            SET current_score = $2, streak = $3, max_streak = $4, updated_at = now()
          WHERE id = $1`,
        [enrollmentId, total, streak, maxStreak],
      );
    });
  }

  /**
   * Atomically scores a single prediction and applies it to its enrollment.
   * Idempotent via the prediction's `is_calculated` flag, and serialized per
   * enrollment with `SELECT ... FOR UPDATE` to prevent lost updates when two
   * matches for the same enrollment are calculated concurrently.
   */
  async scorePrediction(
    predictionId: string,
    matchAwayScore: number,
    matchHomeScore: number,
  ): Promise<{ earned: number; skipped: boolean }> {
    return this.runInTransaction(async (manager) => {
      // 1. Read the prediction; cheap idempotency guard before taking the lock.
      const predRows = await manager.query(
        `SELECT id, user_enrollment_id, away_score, home_score, is_calculated
           FROM predictions
          WHERE id = $1 AND deleted_at IS NULL`,
        [predictionId],
      );
      const pred = predRows[0];
      if (!pred || pred.is_calculated === true) {
        return { earned: 0, skipped: true };
      }

      // 2. Lock the enrollment row (serializes concurrent matches for it).
      const enrRows = await manager.query(
        `SELECT id, current_score, streak, max_streak
           FROM user_enrollments
          WHERE id = $1 AND deleted_at IS NULL
          FOR UPDATE`,
        [pred.user_enrollment_id],
      );
      const enr = enrRows[0];
      if (!enr) {
        return { earned: 0, skipped: true };
      }

      // 3. Re-check the flag now that we hold the lock: a concurrent tx for the
      //    SAME prediction could have committed between step 1 and the lock.
      const recheck = await manager.query(
        `SELECT is_calculated FROM predictions WHERE id = $1`,
        [predictionId],
      );
      if (recheck[0]?.is_calculated === true) {
        return { earned: 0, skipped: true };
      }

      // 4. Base score via the domain ruleset + exactness.
      const { total: base } = PredictionScoreRuleset.default().calculateWithBreakdown({
        prediction: { awayScore: pred.away_score, homeScore: pred.home_score },
        match: { awayScore: matchAwayScore, homeScore: matchHomeScore },
      });
      const isExact =
        pred.away_score === matchAwayScore && pred.home_score === matchHomeScore;

      // 5. Streak bonus uses the locked, PRE-increment streak (matches
      //    scoreEnrollmentTimeline so live and heal agree).
      const bonus = isExact ? streakBonusRules.get(enr.streak) ?? 0 : 0;
      const earned = base + bonus;
      const newStreak = isExact ? enr.streak + 1 : 0;
      const newMaxStreak = Math.max(enr.max_streak, newStreak);

      // 6. Persist prediction (mark calculated) + enrollment, both under lock.
      await manager.query(
        `UPDATE predictions
            SET earned_points = $2, has_exact_result = $3,
                is_calculated = true, updated_at = now()
          WHERE id = $1`,
        [predictionId, earned, isExact],
      );
      await manager.query(
        `UPDATE user_enrollments
            SET current_score = current_score + $2,
                streak = $3, max_streak = $4, updated_at = now()
          WHERE id = $1`,
        [enr.id, earned, newStreak, newMaxStreak],
      );

      return { earned, skipped: false };
    });
  }

  /**
   * Resets the streak of an enrollment that did NOT predict the given match.
   * Locked and idempotent: a no-op if the enrollment actually has a prediction
   * for that match. Does not fix chronological streak order (known debt).
   */
  async resetStreakForMatch(
    enrollmentId: string,
    matchId: string,
  ): Promise<void> {
    await this.runInTransaction(async (manager) => {
      const enrRows = await manager.query(
        `SELECT id FROM user_enrollments
          WHERE id = $1 AND deleted_at IS NULL
          FOR UPDATE`,
        [enrollmentId],
      );
      if (enrRows.length === 0) return;

      const predRows = await manager.query(
        `SELECT 1 FROM predictions
          WHERE user_enrollment_id = $1 AND match_id = $2 AND deleted_at IS NULL`,
        [enrollmentId, matchId],
      );
      if (predRows.length > 0) return; // user did predict -> not "missing"

      await manager.query(
        `UPDATE user_enrollments SET streak = 0, updated_at = now() WHERE id = $1`,
        [enrollmentId],
      );
    });
  }
}
