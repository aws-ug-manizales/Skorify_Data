/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // ── users: add sub (OIDC subject claim from identity provider) ───────────
  await knex.schema.alterTable('users', (t) => {
    t.string('sub').nullable().unique().defaultTo(null);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('sub');
  });
};
