const knex = require('knex');
const config = require('../knexfile');

const db = knex(config);

/**
 * @typedef {Object} UserInput
 * @property {string}  [name]
 * @property {string}  [email]
 * @property {string}  [password_hash]
 * @property {string}  [avatar_url]
 * @property {string}  [role]            - general | global | instance
 */

const TABLE = 'matches';

let counter = 0;

const STATUS = ['scheduled', 'in_progress', 'finished'];

/**
 * Builds default user attributes merged with overrides.
 * @param {UserInput} [overrides={}]
 * @returns {UserInput}
 */
function build(overrides = {}) {
  counter++;
  return {
    home_team_id: null,
    away_team_id: null,
    tournament_id: null,
    kick_off: new Date(),
    home_goals: null,
    away_goals: null,
    status: STATUS[Math.floor(Math.random() * STATUS.length)],
    ...overrides,
  };
}

/**
 * Inserts a user into the database and returns it.
 * @param {UserInput} [overrides={}]
 * @returns {Promise<Object>}
 */
async function create(overrides = {}) {
  const [match] = await db(TABLE).insert(build(overrides)).returning('*');
  return match;
}

/**
 * Inserts multiple users into the database.
 * @param {number} count
 * @param {UserInput} [overrides={}]
 * @returns {Promise<Object[]>}
 */
async function createMany(count, overrides = {}) {
  const matches = Array.from({ length: count }, (_, i) =>
    build({ ...overrides })
  );
  // fix counter after batch build
  counter += count;
  return db(TABLE).insert(matches).returning('*');
}

/**
 * Resets the internal counter (useful between test suites).
 */
function resetCounter() {
  counter = 0;
}

module.exports = { build, create, createMany, resetCounter, db };
