const { TeamFactory } = require("../factories");

const run = async (knex) => {
  console.log('Seeding teams...\n');

    // Create 5 teams
    const teams = await TeamFactory.createMany(5);
    console.log(`Created ${teams.length} teams:`);
    teams.forEach((t) => console.log(`   - ${t.name} (${t.code})`));

  console.log('\nSeeding complete!');
};

const destroy = async () => {
  await TeamFactory.db.destroy();
};

module.exports = { run, destroy };