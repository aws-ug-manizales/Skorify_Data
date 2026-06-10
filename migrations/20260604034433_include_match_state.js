/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('matches', (t) => {
    t.dropColumn('status');
  });

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

  await knex.raw(`
    ALTER TABLE matches
    ADD COLUMN status match_status NOT NULL DEFAULT 'scheduled'
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw('ALTER TABLE matches DROP COLUMN status');
  await knex.raw('DROP TYPE IF EXISTS match_status CASCADE');

  await knex.schema.alterTable('matches', (t) => {
    t.enu('status', ['scheduled', 'in_progress', 'finished', 'draft'])
      .notNullable()
      .defaultTo('scheduled');
  });
};
