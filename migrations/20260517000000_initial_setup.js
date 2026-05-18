/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // ── Users ──────────────────────────────────────────────────────────────────
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('avatar_url');
    t.enu('role', ['general', 'admin']).notNullable().defaultTo('general');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(null);
    t.timestamp('deleted_at', { useTz: true }).defaultTo(null);
  });

  // ── Tournaments ────────────────────────────────────────────────────────────
  await knex.schema.createTable('tournaments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name').notNullable();
    t.string('token').notNullable();
    t.date('start_date');
    t.date('end_date');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // ── Teams ──────────────────────────────────────────────────────────────────
  await knex.schema.createTable('teams', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.string('name').notNullable();
    t.string('shield_url');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(null);
    t.timestamp('deleted_at', { useTz: true }).defaultTo(null);
  });

  // ── Tournament Instances (pollas / pools) ──────────────────────────────────
  await knex.schema.createTable('tournament_instances', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.uuid('owner_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enu('state', ['approved', 'pending', 'denied']).notNullable().defaultTo('pending');
    t.string('name').notNullable();
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(null);
    t.timestamp('deleted_at', { useTz: true }).defaultTo(null);
  });

  // ── Matches ────────────────────────────────────────────────────────────────
  await knex.schema.createTable('matches', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('home_team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    t.uuid('away_team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.timestamp('kick_off', { useTz: true }).notNullable();
    t.integer('home_score');
    t.integer('away_score');
    t.enu('status', ['scheduled', 'in_progress', 'finished', 'draft']).notNullable().defaultTo('scheduled');
    t.enu('stage', ['group', 'finals']).notNullable().defaultTo('group');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(null);
  });

  // ── User Enrollments (players in a pool) ───────────────────────────────────
  await knex.schema.createTable('user_enrollments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('player_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('tournament_instance_id').notNullable().references('id').inTable('tournament_instances').onDelete('CASCADE');
    t.integer('last_position');
    t.integer('current_position');
    t.integer('current_score').notNullable().defaultTo(0);
    t.integer('exact_hits').notNullable().defaultTo(0);
    t.integer('streak').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(null);
    t.timestamp('joined_at', { useTz: true }).defaultTo(null);
    t.unique(['player_id', 'tournament_instance_id']);
  });

  // ── Predictions ────────────────────────────────────────────────────────────
  await knex.schema.createTable('predictions', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_enrollment_id').notNullable().references('id').inTable('user_enrollments').onDelete('CASCADE');
    t.uuid('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
    t.integer('pred_home_goals').notNullable();
    t.integer('pred_away_goals').notNullable();
    t.integer('earned_points').notNullable().defaultTo(0);
    t.boolean('has_exact_result').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(null);
    t.timestamp('deleted_at', { useTz: true }).defaultTo(null);
    t.unique(['user_enrollment_id', 'match_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('predictions');
  await knex.schema.dropTableIfExists('user_enrollments');
  await knex.schema.dropTableIfExists('matches');
  await knex.schema.dropTableIfExists('tournament_instances');
  await knex.schema.dropTableIfExists('teams');
  await knex.schema.dropTableIfExists('tournaments');
  await knex.schema.dropTableIfExists('users');
};
