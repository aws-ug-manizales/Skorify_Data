/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Create the named enum type with all values (existing + new ones).
  await knex.raw(`
    CREATE TYPE match_status AS ENUM (
      'scheduled',
      'in_progress',
      'finished',
      'draft',
      'calculated',
      'cancelled'
    )
  `);

  // Drop the text default before changing the type — PostgreSQL cannot
  // cast a string literal default automatically to the new enum type.
  await knex.raw(`ALTER TABLE matches ALTER COLUMN status DROP DEFAULT`);

  // Convert the existing text+CHECK column to the new named enum in-place.
  // USING casts the current text values — no data is lost.
  await knex.raw(`
    ALTER TABLE matches
    ALTER COLUMN status TYPE match_status
    USING status::text::match_status
  `);

  // Restore the default, now typed as match_status.
  await knex.raw(`ALTER TABLE matches ALTER COLUMN status SET DEFAULT 'scheduled'::match_status`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Rows with the new values have no equivalent in the original set — move
  // them to the closest safe fallback before narrowing the type.
  await knex('matches')
    .where('status', 'calculated')
    .update({ status: 'finished' });

  await knex('matches')
    .where('status', 'cancelled')
    .update({ status: 'draft' });

  // Convert back to plain text, then restore the original CHECK constraint.
  await knex.raw(`
    ALTER TABLE matches
    ALTER COLUMN status TYPE text
    USING status::text
  `);

  await knex.raw(`DROP TYPE IF EXISTS match_status CASCADE`);

  await knex.raw(`
    ALTER TABLE matches
    ADD CONSTRAINT matches_status_check
    CHECK (status IN ('scheduled', 'in_progress', 'finished', 'draft'))
  `);
};
