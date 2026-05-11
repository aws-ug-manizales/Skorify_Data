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
    t.string('avatar_url');
    t.enu('role', ['general', 'admin']).notNullable().defaultTo('general');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
  });

  // ── Tournaments ──
  await knex.schema.createTable('tournaments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name').notNullable();
    t.string('token').notNullable();
    t.date('start_date');
    t.date('end_date');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
  });

  // ── Teams ──
  await knex.schema.createTable('teams', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name').notNullable();
    t.string('shield_url');
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
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
    t.enu('status', ['scheduled', 'in_progress', 'finished','draft']).notNullable().defaultTo('scheduled');
    t.enu('stage', ['group', 'finals']).notNullable().defaultTo('group');
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
  });


  // ── TournamentInstances (pollas / pools) ──
  await knex.schema.createTable('tournament_instances', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('tournament_id').notNullable().references('id').inTable('tournaments').onDelete('CASCADE');
    t.uuid('owner_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enu('state', ['approved', 'pending', 'denied']).notNullable().defaultTo('pending');
    t.string('name').notNullable();
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
  });

  // ── UserEnrollments (players in a polla) ──
  await knex.schema.createTable('user_enrollments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('player_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('instance_id').notNullable().references('id').inTable('tournament_instances').onDelete('CASCADE');
    t.integer('current_position');
    t.integer('last_position');
    t.integer('current_score').defaultTo(0);
    t.integer('streak').defaultTo(0);
    t.timestamp("joined_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.unique(['player_id', 'instance_id']);
  });

  // ── Predictions ──
  await knex.schema.createTable('predictions', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('instance_player_id').notNullable().references('id').inTable('user_enrollments').onDelete('CASCADE');
    t.uuid('match_id').notNullable().references('id').inTable('matches').onDelete('CASCADE');
    t.integer('pred_home_goals').notNullable();
    t.integer('pred_away_goals').notNullable();
    t.integer('earned_points').defaultTo(0);
    t.boolean('has_exact_result').defaultTo(false);
    t.unique(['instance_player_id', 'match_id']);
    t.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true }).defaultTo(null);
    t.timestamp("deleted_at", { useTz: true }).defaultTo(null);
  });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('predictions');
  await knex.schema.dropTableIfExists('user_enrollments');
  await knex.schema.dropTableIfExists('tournament_instances');
  await knex.schema.dropTableIfExists('matches');
  await knex.schema.dropTableIfExists('teams');
  await knex.schema.dropTableIfExists('tournaments');
  await knex.schema.dropTableIfExists('users');
};
