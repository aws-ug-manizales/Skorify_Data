/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // ── users: rename avatar_url → image, add is_active & notification_token ──
  await knex.schema.alterTable('users', (t) => {
    t.renameColumn('avatar_url', 'image');
  });
  await knex.schema.alterTable('users', (t) => {
    t.boolean('is_active').notNullable().defaultTo(true);
    t.string('notification_token').nullable().defaultTo(null);
  });

  // ── tournaments: add updated_at, deleted_at, match_type ───────────────────
  await knex.schema.alterTable('tournaments', (t) => {
    t.timestamp('updated_at', { useTz: true }).defaultTo(null);
    t.timestamp('deleted_at', { useTz: true }).defaultTo(null);
    t.string('match_type').nullable().defaultTo(null);
  });

  // ── tournament_instances: rename owner_user_id → owner_id ─────────────────
  await knex.schema.alterTable('tournament_instances', (t) => {
    t.renameColumn('owner_user_id', 'owner_id');
  });

  // Drop old state column (backed by the knex-generated enum type)
  await knex.schema.alterTable('tournament_instances', (t) => {
    t.dropColumn('state');
  });

  // Drop leftover enum type from initial migration (knex names it <table>_<col>)
  await knex.raw('DROP TYPE IF EXISTS tournament_instances_state CASCADE');

  // Create the canonical tournament_instance_state type and restore the column
  await knex.raw(`
    CREATE TYPE tournament_instance_state AS ENUM (
      'active',
      'inactive',
      'suspended',
      'terminated'
    )
  `);
  await knex.raw(`
    ALTER TABLE tournament_instances
    ADD COLUMN state tournament_instance_state NOT NULL DEFAULT 'active'
  `);

  // Add invite_code
  await knex.schema.alterTable('tournament_instances', (t) => {
    t.string('invite_code').nullable().defaultTo(null);
  });

  // ── matches: add deleted_at, venue ────────────────────────────────────────
  await knex.schema.alterTable('matches', (t) => {
    t.timestamp('deleted_at', { useTz: true }).defaultTo(null);
    t.string('venue').nullable().defaultTo(null);
  });

  // ── user_enrollments: rename player_id → user_id, update unique, add cols ─
  await knex.schema.alterTable('user_enrollments', (t) => {
    t.dropUnique(['player_id', 'tournament_instance_id']);
  });
  await knex.schema.alterTable('user_enrollments', (t) => {
    t.renameColumn('player_id', 'user_id');
  });
  await knex.schema.alterTable('user_enrollments', (t) => {
    t.unique(['user_id', 'tournament_instance_id']);
    t.uuid('tournament_id').nullable().defaultTo(null);
    t.integer('max_streak').notNullable().defaultTo(0);
    t.timestamp('deleted_at', { useTz: true }).defaultTo(null);
  });

  // ── predictions: rename score cols, add user_id & tournament_instance_id ──
  await knex.schema.alterTable('predictions', (t) => {
    t.renameColumn('pred_home_goals', 'home_score');
    t.renameColumn('pred_away_goals', 'away_score');
  });
  await knex.schema.alterTable('predictions', (t) => {
    t.uuid('user_id').nullable().defaultTo(null);
    t.uuid('tournament_instance_id').nullable().defaultTo(null);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // ── predictions: revert ───────────────────────────────────────────────────
  await knex.schema.alterTable('predictions', (t) => {
    t.dropColumn('tournament_instance_id');
    t.dropColumn('user_id');
  });
  await knex.schema.alterTable('predictions', (t) => {
    t.renameColumn('home_score', 'pred_home_goals');
    t.renameColumn('away_score', 'pred_away_goals');
  });

  // ── user_enrollments: revert ──────────────────────────────────────────────
  await knex.schema.alterTable('user_enrollments', (t) => {
    t.dropColumn('deleted_at');
    t.dropColumn('max_streak');
    t.dropColumn('tournament_id');
    t.dropUnique(['user_id', 'tournament_instance_id']);
  });
  await knex.schema.alterTable('user_enrollments', (t) => {
    t.renameColumn('user_id', 'player_id');
  });
  await knex.schema.alterTable('user_enrollments', (t) => {
    t.unique(['player_id', 'tournament_instance_id']);
  });

  // ── matches: revert ───────────────────────────────────────────────────────
  await knex.schema.alterTable('matches', (t) => {
    t.dropColumn('venue');
    t.dropColumn('deleted_at');
  });

  // ── tournament_instances: revert invite_code and state enum ───────────────
  await knex.schema.alterTable('tournament_instances', (t) => {
    t.dropColumn('invite_code');
  });
  await knex.raw('ALTER TABLE tournament_instances DROP COLUMN state');
  await knex.raw('DROP TYPE IF EXISTS tournament_instance_state CASCADE');
  await knex.schema.alterTable('tournament_instances', (t) => {
    t.enu('state', ['approved', 'pending', 'denied']).notNullable().defaultTo('pending');
    t.renameColumn('owner_id', 'owner_user_id');
  });

  // ── tournaments: revert ───────────────────────────────────────────────────
  await knex.schema.alterTable('tournaments', (t) => {
    t.dropColumn('match_type');
    t.dropColumn('deleted_at');
    t.dropColumn('updated_at');
  });

  // ── users: revert ─────────────────────────────────────────────────────────
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('notification_token');
    t.dropColumn('is_active');
  });
  await knex.schema.alterTable('users', (t) => {
    t.renameColumn('image', 'avatar_url');
  });
};
