const knex = require('knex');
const config = require('../knexfile');

const db = knex(config);

/**
 * @typedef {Object} InstanceUserInput
 * @property {string}  [player_id]
 * @property {string}  [instance_id]
 */

const TABLE = 'instance_users';

/**
 * Builds default instance-user attributes merged with overrides.
 * @param {InstanceUserInput} [overrides={}]
 * @returns {InstanceUserInput}
 */
function build(overrides = {}) {
  return {
    ...overrides,
  };
}

/**
 * Inserts an instance_user into the database and returns it.
 * @param {InstanceUserInput} [overrides={}]
 * @returns {Promise<Object>}
 */
async function create(overrides = {}) {
  const [row] = await db(TABLE).insert(build(overrides)).returning('*');
  return row;
}

/**
 * Inserts multiple instance_users into the database.
 * @param {number} count
 * @param {InstanceUserInput} [overrides={}]
 * @returns {Promise<Object[]>}
 */
async function createMany(count, overrides = {}) {
  const items = Array.from({ length: count }, () => build(overrides));
  return db(TABLE).insert(items).returning('*');
}

module.exports = { build, create, createMany, db };
