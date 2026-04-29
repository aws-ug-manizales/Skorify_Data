/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('predictions', 'is_exact_hit');
  if (!exists) {
    await knex.schema.alterTable('predictions', (table) => {
      table.boolean('is_exact_hit').notNullable().defaultTo(false);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('predictions', 'is_exact_hit');
  if (exists) {
    await knex.schema.alterTable('predictions', (table) => {
      table.dropColumn('is_exact_hit');
    });
  }
};
