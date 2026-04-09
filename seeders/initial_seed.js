const knex = require('knex');
const config = require('../knexfile');
const { UserFactory, TournamentFactory } = require('../factories');

const db = knex(config);

async function run() {
  console.log('Seeding users and tournament...\n');

  // Create 5 users
  const users = await UserFactory.createMany(5);
  console.log(`Created ${users.length} users:`);
  users.forEach((u) => console.log(`   - ${u.name} (${u.email})`));

  // Create 1 tournament
  const tournament = await TournamentFactory.create({
    name: 'Mundial 2026',
    start_date: '2026-06-11',
    end_date: '2026-07-19',
  });
  console.log(`Created tournament: ${tournament.name} (${tournament.start_date} → ${tournament.end_date})`);

  console.log('Seeding complete!');
}

run()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => {
    db.destroy();
    UserFactory.db.destroy();
    TournamentFactory.db.destroy();
  });
