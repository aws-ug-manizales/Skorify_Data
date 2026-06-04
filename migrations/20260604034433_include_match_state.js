/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // ── matches: extend status enum with 'calculated' and 'cancelled' ─────────
  // PostgreSQL allows adding values to an existing enum without dropping it.
  await knex.raw(`ALTER TYPE matches_status ADD VALUE IF NOT EXISTS 'calculated'`);
  await knex.raw(`ALTER TYPE matches_status ADD VALUE IF NOT EXISTS 'cancelled'`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // PostgreSQL cannot remove individual enum values — must drop and recreate.
  // Coerce rows that use the new values to a safe fallback before dropping.
  await knex('matches')
    .whereIn('status', ['calculated', 'cancelled'])
    .update({ status: 'finished' });

  await knex.raw('ALTER TABLE matches DROP COLUMN status');
  await knex.raw('DROP TYPE IF EXISTS matches_status CASCADE');
  await knex.raw(`
    CREATE TYPE matches_status AS ENUM (
      'scheduled',
      'in_progress',
      'finished',
      'draft'
    )
  `);
  await knex.raw(`
    ALTER TABLE matches
    ADD COLUMN status matches_status NOT NULL DEFAULT 'scheduled'
  `);
};
