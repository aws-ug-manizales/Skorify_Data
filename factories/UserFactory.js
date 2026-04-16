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

const TABLE = 'users';

let counter = 0;

const ROLES = ['general', 'global', 'instance'];

/**
 * Builds default user attributes merged with overrides.
 * @param {UserInput} [overrides={}]
 * @returns {UserInput}
 */
function build(overrides = {}) {
  counter++;
  return {
    name: `User ${counter}`,
    email: `user${counter}@test.com`,
    password_hash: 'hashed_password',
    avatar_url: null,
    role: ROLES[Math.floor(Math.random() * ROLES.length)],
    ...overrides,
  };
}

/**
 * Inserts a user into the database and returns it.
 * @param {UserInput} [overrides={}]
 * @returns {Promise<Object>}
 */
async function create(overrides = {}) {
  const [user] = await db(TABLE).insert(build(overrides)).returning('*');
  return user;
}

/**
 * Inserts multiple users into the database.
 * @param {number} count
 * @param {UserInput} [overrides={}]
 * @returns {Promise<Object[]>}
 */
async function createMany(count, overrides = {}) {
  const users = Array.from({ length: count }, (_, i) =>
    build({ ...overrides, email: overrides.email || `user${counter + i + 1}@test.com` })
  );
  // fix counter after batch build
  counter += count;
  return db(TABLE).insert(users).returning('*');
}

/**
 * Resets the internal counter (useful between test suites).
 */
function resetCounter() {
  counter = 0;
}

module.exports = { build, create, createMany, resetCounter, db };
