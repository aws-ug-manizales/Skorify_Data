/**
 * Backfill `is_calculated` for predictions that already existed before the flag
 * was introduced (migration 20260605000000 added the column defaulting to false).
 *
 * Only predictions with EVIDENCE of having been scored are marked true. The
 * predictions skipped by the old global-lock bug (never scored, in non-winning
 * tournament instances) are intentionally left `is_calculated = false` so the
 * post-deploy healing (recomputeEnrollment) can still find and fix them.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    UPDATE predictions p
       SET is_calculated = true
      FROM matches m
     WHERE p.match_id = m.id
       AND p.deleted_at IS NULL
       AND m.status = 'finished'
       AND (p.earned_points <> 0 OR p.has_exact_result = true)
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Non-destructive backfill; nothing to revert. Dropping the column is handled
  // by the migration that created it (20260605000000).
};
