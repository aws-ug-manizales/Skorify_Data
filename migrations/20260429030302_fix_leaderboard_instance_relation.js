/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('leaderboard', (t) => {
    t.uuid('instance_id');
  });

  await knex.raw(`
    ALTER TABLE leaderboard 
    DROP CONSTRAINT IF EXISTS leaderboard_user_id_tournament_id_unique;
  `);

  await knex.raw(`
    ALTER TABLE leaderboard 
    DROP CONSTRAINT IF EXISTS leaderboard_tournament_id_foreign;
  `);

  await knex.schema.alterTable('leaderboard', (t) => {
    t.dropColumn('tournament_id');
  });

  await knex.schema.alterTable('leaderboard', (t) => {
    t.foreign('instance_id')
      .references('id')
      .inTable('instances')
      .onDelete('CASCADE');
  });

  await knex.schema.alterTable('leaderboard', (t) => {
    t.unique(['user_id', 'instance_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('leaderboard', (t) => {
    t.uuid('tournament_id');
  });

  await knex.raw(`
    ALTER TABLE leaderboard 
    DROP CONSTRAINT IF EXISTS leaderboard_user_id_instance_id_unique;
  `);

  await knex.raw(`
    ALTER TABLE leaderboard 
    DROP CONSTRAINT IF EXISTS leaderboard_instance_id_foreign;
  `);

  await knex.schema.alterTable('leaderboard', (t) => {
    t.dropColumn('instance_id');
  });

  await knex.schema.alterTable('leaderboard', (t) => {
    t.foreign('tournament_id')
      .references('id')
      .inTable('tournaments')
      .onDelete('CASCADE');
  });

  await knex.schema.alterTable('leaderboard', (t) => {
    t.unique(['user_id', 'tournament_id']);
  });
};
