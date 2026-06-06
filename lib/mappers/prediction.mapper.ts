import { DomainEvent } from "@skorify/domain/core";
import {
  PredictionAttributes,
  PredictionEntity,
} from "@skorify/domain/prediction";
import { BaseMapper } from "./base.mapper";

export class PredictionMapper extends BaseMapper {
  fromJson(json: Record<string, any>): DomainEvent {
    return PredictionEntity.build({
      id: json.id,
      userEnrollmentId: json.user_enrollment_id,
      userId: json.user_id,
      tournamentInstanceId: json.tournament_instance_id,
      matchId: json.match_id,
      awayScore: json.away_score,
      homeScore: json.home_score,
      earnedPoints: json.earned_points ?? 0,
      hasExactResult: json.has_exact_result ?? false,
      isCalculated: json.is_calculated ?? false,
      createdAt: json.created_at,
    });
  }

  toJson(entity: PredictionEntity): any {
    return {
      id: entity.id,
      user_id: entity.userId,
      tournament_instance_id: entity.tournamentInstanceId,
      match_id: entity.matchId,
      away_score: entity.awayScore,
      home_score: entity.homeScore,
      earned_points: entity.earnedPoints,
      has_exact_result: entity.hasExactResult,
      is_calculated: entity.isCalculated,
      user_enrollment_id: entity.userEnrollmentId,
      created_at: entity.createdAt,
    };
  }
}
