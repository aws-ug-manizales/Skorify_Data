const { MatchFactory } = require('../factories');

const run = async (knex) => {
  console.log('Seeding matches...\n');

  // Get all teams
    const teams = await knex('teams').select('*');

    const tournament = await knex('tournaments').first('*');
    if (teams.length < 2) {
      console.error('Not enough teams to create matches. Please seed teams first.');
      return;
    }

    // Create 10 matches with random teams
    const matches = [];
    for (let i = 0; i < 10; i++) {
      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam;
      do {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      } while (awayTeam.id === homeTeam.id); // Ensure different teams

      const match = await MatchFactory.create({
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        tournament_id: tournament.id, // You can set this to an actual tournament ID if needed
        kick_off: new Date(Date.now() + Math.floor(Math.random() * 1000000000)), // Random future date
        home_goals: null,
        away_goals: null,
        status: 'scheduled',
      });
      matches.push(match);
    }

    console.log(`Created ${matches.length} matches:`);
    matches.forEach((m) => console.log(`   - Match ${m.id}: Team ${m.home_team_id} vs Team ${m.away_team_id} (status: ${m.status})`));

  console.log('\nSeeding complete!');
};

const destroy = async () => {
  await MatchFactory.db.destroy();
};

module.exports = { run, destroy };