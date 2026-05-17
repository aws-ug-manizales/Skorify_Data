/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.raw(`
        ALTER TABLE matches 
        DROP CONSTRAINT IF EXISTS matches_status_check;
    `);

    await knex.raw(`
        ALTER TABLE matches 
        ADD CONSTRAINT matches_status_check 
        CHECK (status IN ('scheduled','in_progress','finished','draft'));
    `);

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
  // 1. evitar valores inválidos
  await knex.raw(`
    UPDATE matches 
    SET status = 'scheduled' 
    WHERE status = 'draft';
  `);

  // 2. eliminar constraint solo si existe
  await knex.raw(`
    ALTER TABLE matches 
    DROP CONSTRAINT IF EXISTS matches_status_check;
  `);

  // 3. restaurar constraint original
  await knex.raw(`
    ALTER TABLE matches 
    ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('scheduled','in_progress','finished'));
  `);

  // 4. restaurar columna position si no existe
  const hasPos = await knex.schema.hasColumn('leaderboard', 'position');
  if (!hasPos) {
    await knex.schema.alterTable('leaderboard', (t) => {
      t.integer('position').nullable();
    });
  }
};
