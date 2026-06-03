/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    CREATE TYPE tournament_status AS ENUM ('active', 'inactive', 'terminated')
  `);

  await knex.raw(`
    ALTER TABLE tournaments
    ADD COLUMN status tournament_status NOT NULL DEFAULT 'active'
  `);

  await knex.raw(`
    ALTER TABLE tournaments
    ALTER COLUMN start_date SET NOT NULL,
    ALTER COLUMN end_date SET NOT NULL
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw('ALTER TABLE tournaments DROP COLUMN status');
  await knex.raw('DROP TYPE IF EXISTS tournament_status CASCADE');

  await knex.raw(`
    ALTER TABLE tournaments
    ALTER COLUMN start_date DROP NOT NULL,
    ALTER COLUMN end_date DROP NOT NULL
  `);
};
