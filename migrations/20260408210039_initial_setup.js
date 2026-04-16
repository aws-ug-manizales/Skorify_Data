/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // ── Users ──
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.string('avatar_url');
    t.string('role');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
  });

  // ── Tournaments ──
  await knex.schema.createTable('tournaments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name').notNullable();
    t.date('start_date');
    t.date('end_date');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  // ── Teams ──
  await knex.schema.createTable('teams', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name').notNullable();
    t.string('code').notNullable().unique();
    t.string('shield_url');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
  });

  // ── Tournament Teams (pivot) ──
  await knex.schema.createTable('tournament_teams', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.unique(['team_id', 'tournament_id']);
  });

  // ── Groups ──
  await knex.schema.createTable('groups', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.string('group_name').notNullable();
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
    t.unique(['tournament_id', 'group_name']);
  });

  // ── Group Teams (pivot) ──
  await knex.schema.createTable('group_teams', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    t.uuid('group_id').notNullable().references('id').inTable('groups').onDelete('CASCADE');
    t.unique(['team_id', 'group_id']);
  });

  // ── Matches ──
  await knex.schema.createTable('matches', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('home_team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    t.uuid('away_team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.timestamp('kick_off').notNullable();
    t.integer('home_goals');
    t.integer('away_goals');
    t.enu('status', ['scheduled', 'in_progress', 'finished']).notNullable().defaultTo('scheduled');
    t.enu('stage', ['group', 'finals']).notNullable().defaultTo('group');
    t.string('venue');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
  });

  // ── Rules ──
  await knex.schema.createTable('rules', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name').notNullable();
    t.string('description');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  // ── Instances (pollas / pools) ──
  await knex.schema.createTable('instances', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.uuid('owner_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('validator_user_id').references('id').inTable('users').onDelete('SET NULL');
    t.enu('state', ['approved', 'pending', 'denied']).notNullable().defaultTo('pending');
    t.string('name').notNullable();
    t.integer('price').notNullable().defaultTo(0);
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
  });

  // ── Instance Users (players in a polla) ──
  await knex.schema.createTable('instance_users', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('player_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('instance_id').notNullable().references('id').inTable('instances').onDelete('CASCADE');
    t.timestamp("joined_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.unique(['player_id', 'instance_id']);
  });

  // ── Instance Rules (pivot) ──
  await knex.schema.createTable('instance_rules', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('instance_id').notNullable().references('id').inTable('instances').onDelete('CASCADE');
    t.uuid('rule_id').notNullable().references('id').inTable('rules').onDelete('CASCADE');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.unique(['instance_id', 'rule_id']);
  });

  // ── Predictions ──
  await knex.schema.createTable('predictions', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('instance_player_id').notNullable().references('id').inTable('instance_users').onDelete('CASCADE');
    t.uuid('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
    t.integer('pred_home_goals').notNullable();
    t.integer('pred_away_goals').notNullable();
    t.integer('earned_points').defaultTo(0);
    t.unique(['instance_player_id', 'match_id']);
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
  });

  // ── Payments ──
  await knex.schema.createTable('payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.enu('state_pay', ['failed', 'pending', 'paid']).notNullable().defaultTo('pending');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.unique(['user_id', 'tournament_id']);
  });

  // ── Leaderboard ──
  await knex.schema.createTable('leaderboard', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.integer('position');
    t.integer('total_points').defaultTo(0);
    t.integer('exact_hits').defaultTo(0);
    t.integer('outcome_hits').defaultTo(0);
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
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('predictions');
  await knex.schema.dropTableIfExists('instance_rules');
  await knex.schema.dropTableIfExists('instance_users');
  await knex.schema.dropTableIfExists('instances');
  await knex.schema.dropTableIfExists('rules');
  await knex.schema.dropTableIfExists('matches');
  await knex.schema.dropTableIfExists('group_teams');
  await knex.schema.dropTableIfExists('groups');
  await knex.schema.dropTableIfExists('tournament_teams');
  await knex.schema.dropTableIfExists('tournaments');
  await knex.schema.dropTableIfExists('teams');
  await knex.schema.dropTableIfExists('users');
};
