const knex = require('knex');
const config = require('../knexfile');

const db = knex(config);

/**
 * @typedef {Object} TournamentInput
 * @property {string}  [name]
 * @property {string}  [start_date]  - formato YYYY-MM-DD
 * @property {string}  [end_date]    - formato YYYY-MM-DD
 */

const TABLE = 'tournaments';

let counter = 0;

/**
 * Builds default tournament attributes merged with overrides.
 * @param {TournamentInput} [overrides={}]
 * @returns {TournamentInput}
 */
function build(overrides = {}) {
  counter++;
  return {
    name: `Tournament ${counter}`,
    start_date: '2026-06-11',
    end_date: '2026-07-19',
    ...overrides,
  };
}

/**
 * Inserts a tournament into the database and returns it.
 * @param {TournamentInput} [overrides={}]
 * @returns {Promise<Object>}
 */
async function create(overrides = {}) {
  const [tournament] = await db(TABLE).insert(build(overrides)).returning('*');
  return tournament;
}

/**
 * Inserts multiple tournaments into the database.
 * @param {number} count
 * @param {TournamentInput} [overrides={}]
 * @returns {Promise<Object[]>}
 */
async function createMany(count, overrides = {}) {
  const items = Array.from({ length: count }, () => build(overrides));
  return db(TABLE).insert(items).returning('*');
}

/**
 * Resets the internal counter (useful between test suites).
 */
function resetCounter() {
  counter = 0;
}

module.exports = { build, create, createMany, resetCounter, db };
