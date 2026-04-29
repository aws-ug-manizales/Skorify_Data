/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Eliminar constraint actual
  await knex.raw(`
    ALTER TABLE matches DROP CONSTRAINT matches_status_check;
  `);

  // 2. Crear nuevo constraint con draft
  await knex.raw(`
    ALTER TABLE matches ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('scheduled','in_progress','finished','draft'));
  `);

  // 3. eliminar columna position
  const hasPos = await knex.schema.hasColumn('leaderboard', 'position');
  if (hasPos) {
    await knex.schema.alterTable('leaderboard', (t) => {
      t.dropColumn('position');
    });
  }
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // 1. restaurar columna
  const hasPos = await knex.schema.hasColumn('leaderboard', 'position');
  if (!hasPos) {
    await knex.schema.alterTable('leaderboard', (t) => {
      t.integer('position').nullable();
    });
  }

  // 2. evitar valores inválidos
  await knex.raw(`
    UPDATE matches SET status = 'scheduled' WHERE status = 'draft';
  `);

  // 3. revertir constraint
  await knex.raw(`
    ALTER TABLE matches DROP CONSTRAINT matches_status_check;
  `);

  await knex.raw(`
    ALTER TABLE matches ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('scheduled','in_progress','finished'));
  `);
};
