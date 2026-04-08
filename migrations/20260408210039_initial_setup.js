/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // ── Users ──
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('avatar_url');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
  });

  // ── Teams ──
  await knex.schema.createTable('teams', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable().unique();
    t.string('code', 3).notNullable().unique(); // e.g. COL, BRA, ARG
    t.string('flag_url');
    t.string('group', 1);                        // e.g. A, B, C …
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  // ── Tournaments ──
  await knex.schema.createTable('tournaments', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();              // e.g. "Mundial 2026"
    t.date('start_date');
    t.date('end_date');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  // ── Matches ──
  await knex.schema.createTable('matches', (t) => {
    t.increments('id').primary();
    t.integer('tournament_id').unsigned().references('id').inTable('tournaments').onDelete('CASCADE');
    t.integer('home_team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
    t.integer('away_team_id').unsigned().references('id').inTable('teams').onDelete('CASCADE');
    t.timestamp('match_date').notNullable();
    t.string('stage').defaultTo('group');        // group, round_of_16, quarter, semi, final
    t.string('venue');
    t.integer('home_score');
    t.integer('away_score');
    t.enu('status', ['scheduled', 'in_progress', 'finished']).defaultTo('scheduled');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  // ── Predictions (la polla) ──
  await knex.schema.createTable('predictions', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    t.integer('match_id').unsigned().references('id').inTable('matches').onDelete('CASCADE');
    t.integer('home_score').notNullable();
    t.integer('away_score').notNullable();
    t.integer('points_earned').defaultTo(0);
    t.unique(['user_id', 'match_id']); // one prediction per user per match
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
  });


  // TODO :: review this part or using redis
  // ── Leaderboard (cache of aggregated points) ──
  await knex.schema.createTable('leaderboard', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    t.integer('tournament_id').unsigned().references('id').inTable('tournaments').onDelete('CASCADE');
    t.integer('total_points').defaultTo(0);
    t.integer('exact_hits').defaultTo(0);       // predicted exact score
    t.integer('outcome_hits').defaultTo(0);     // predicted winner only
    t.unique(['user_id', 'tournament_id']);
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('leaderboard');
  await knex.schema.dropTableIfExists('predictions');
  await knex.schema.dropTableIfExists('matches');
  await knex.schema.dropTableIfExists('tournaments');
  await knex.schema.dropTableIfExists('teams');
  await knex.schema.dropTableIfExists('users');
};
