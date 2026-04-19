const knex = require('knex');
const config = require('../knexfile');
const { UserFactory, TournamentFactory, InstanceFactory, InstanceUserFactory } = require('../factories');

const db = knex(config);

async function run() {
  console.log('Seeding users, tournament, instance and players...\n');

  // Create 1 global user
  const globalUser = await UserFactory.create({ role: 'global' });
  console.log(`Created global user: ${globalUser.name} (${globalUser.email})`);

  // Create 2 instance users
  const instanceUsers = await UserFactory.createMany(2, { role: 'instance' });
  console.log(`Created ${instanceUsers.length} instance users:`);
  instanceUsers.forEach((u) => console.log(`   - ${u.name} (${u.email}) [${u.role}]`));

  // Create 10 general users
  const generalUsers = await UserFactory.createMany(10, { role: 'general' });
  console.log(`Created ${generalUsers.length} general users:`);
  generalUsers.forEach((u) => console.log(`   - ${u.name} (${u.email}) [${u.role}]`));

  // Create 1 tournament
  const tournament = await TournamentFactory.create({
    name: 'Mundial 2026',
    start_date: '2026-06-11',
    end_date: '2026-07-19',
  });
  console.log(`\nCreated tournament: ${tournament.name} (${tournament.start_date} → ${tournament.end_date})`);

  // Create 1 instance (polla) owned by first instance user
  const instance = await InstanceFactory.create({
    tournament_id: tournament.id,
    owner_user_id: instanceUsers[0].id,
    name: 'Polla AWS USER GROUP Manizales',
    state: 'approved',
    price: 20000,
  });
  console.log(`Created instance: ${instance.name} (state: ${instance.state}, price: ${instance.price})`);

  // Shuffle general users and add random subset to the instance
  const shuffled = generalUsers.sort(() => Math.random() - 0.5);
  const playersToAdd = shuffled.slice(0, Math.floor(Math.random() * generalUsers.length) + 1);

  for (const user of playersToAdd) {
    await InstanceUserFactory.create({
      player_id: user.id,
      instance_id: instance.id,
    });
  }
  console.log(`Added ${playersToAdd.length} of ${generalUsers.length} general players to instance "${instance.name}":`);
  playersToAdd.forEach((u) => console.log(`   - ${u.name} (${u.email})`));

  console.log('\nSeeding complete!');
}

/*run()
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
  });*/

exports.seed = run;