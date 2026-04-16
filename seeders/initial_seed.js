const knex = require('knex');
const config = require('../knexfile');
const { UserFactory, TournamentFactory, InstanceFactory, InstanceUserFactory } = require('../factories');

const db = knex(config);

async function run() {
  console.log('Seeding users, tournament, instance and players...\n');

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

  // Create 1 instance (polla) owned by first user
  const instance = await InstanceFactory.create({
    tournament_id: tournament.id,
    owner_user_id: users[0].id,
    name: 'Polla Manizales',
    state: 'approved',
    price: 20000,
  });
  console.log(`Created instance: ${instance.name} (state: ${instance.state}, price: ${instance.price})`);

  // Add all users as players of the instance
  for (const user of users) {
    await InstanceUserFactory.create({
      player_id: user.id,
      instance_id: instance.id,
    });
  }
  console.log(`Added ${users.length} players to instance "${instance.name}"`);

  console.log('\nSeeding complete!');
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
    InstanceFactory.db.destroy();
    InstanceUserFactory.db.destroy();
  });
