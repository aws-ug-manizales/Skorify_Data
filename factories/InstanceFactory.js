const knex = require('knex');
const config = require('../knexfile');

const db = knex(config);

/**
 * @typedef {Object} InstanceInput
 * @property {string}  [tournament_id]
 * @property {string}  [owner_user_id]
 * @property {string}  [validator_user_id]
 * @property {string}  [state]           - approved | pending | denied
 * @property {string}  [name]
 * @property {number}  [price]
 */

const TABLE = 'instances';

let counter = 0;

/**
 * Builds default instance attributes merged with overrides.
 * @param {InstanceInput} [overrides={}]
 * @returns {InstanceInput}
 */
function build(overrides = {}) {
  counter++;
  return {
    name: `Polla ${counter}`,
    state: 'pending',
    price: 10000,
    ...overrides,
  };
}

/**
 * Inserts an instance into the database and returns it.
 * @param {InstanceInput} [overrides={}]
 * @returns {Promise<Object>}
 */
async function create(overrides = {}) {
  const [instance] = await db(TABLE).insert(build(overrides)).returning('*');
  return instance;
}

/**
 * Inserts multiple instances into the database.
 * @param {number} count
 * @param {InstanceInput} [overrides={}]
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
