---
name: create-migration
description: Create a Knex migration file from entity changes between the current branch and main. Use when asked to create a migration, generate a migration from entity changes, or scaffold a migration file for schema changes.
---

Knex migrations live in `migrations/`. They are plain JS files with `exports.up` and `exports.down`. All commands run from the repo root (`Skorify_Data/`).

## Step 1 — Read the entity diff

```bash
git diff main...HEAD -- entities/
```

If the diff is empty, there are no entity changes. Ask the user what they want to migrate before continuing.

## Step 2 — Derive a migration name

If the user already provided a name, use it verbatim (snake_case).

Otherwise, derive one from the diff following these rules:
- **snake_case only** — no camelCase, no dashes
- **≤ 3 words** — short, factual
- **Describes the schema change**, not the entity name alone

Common patterns:

| Change seen in diff | Name example |
|---|---|
| New `@Column` added | `add_{column}_{table}` or `add_{column}` |
| Column removed | `remove_{column}_{table}` |
| Column type or constraint changed | `update_{column}_{table}` |
| New `@Entity` class | `create_{table}_table` |
| `@Column` enum values changed | `extend_{column}_enum` |
| Multiple columns on same table | `alter_{table}_columns` |
| Foreign key added | `add_{fk}_fkey` |

## Step 3 — Create the file

Run from repo root:

```bash
npx knex --knexfile knexfile.js migrate:make <name>
```

This creates `migrations/<timestamp>_<name>.js` with empty `up`/`down` stubs.

## Step 4 — Fill in `up` and `down`

Open the generated file and implement both functions. **`down` must be the exact inverse of `up`** — every change in `up` must be revertible by `down`.

### TypeORM → Knex column type mapping

| TypeORM `@Column` type | Knex builder method |
|---|---|
| `uuid` | `t.uuid('col')` |
| `varchar` / `text` | `t.string('col')` / `t.text('col')` |
| `int` / `integer` | `t.integer('col')` |
| `boolean` | `t.boolean('col')` |
| `date` | `t.date('col')` |
| `timestamptz` | `t.timestamp('col', { useTz: true })` |
| `enum` | use `knex.raw()` — see below |

### Enum pattern (PostgreSQL)

Knex's `.enu()` does **not** create a named Postgres `TYPE`. Use raw SQL to stay consistent with existing migrations:

```js
exports.up = async function(knex) {
  await knex.raw(`CREATE TYPE my_status AS ENUM ('a', 'b', 'c')`);
  await knex.raw(`ALTER TABLE my_table ADD COLUMN status my_status NOT NULL DEFAULT 'a'`);
};

exports.down = async function(knex) {
  await knex.raw('ALTER TABLE my_table DROP COLUMN status');
  await knex.raw('DROP TYPE IF EXISTS my_status CASCADE');
};
```

### Adding a column

```js
exports.up = async function(knex) {
  await knex.schema.alterTable('table_name', (t) => {
    t.string('new_column').notNullable().defaultTo('value');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('table_name', (t) => {
    t.dropColumn('new_column');
  });
};
```

### Adding a NOT NULL column to an existing table

Add with a temporary default, then drop it if needed:

```js
exports.up = async function(knex) {
  await knex.raw(`ALTER TABLE my_table ADD COLUMN new_col varchar NOT NULL DEFAULT ''`);
  await knex.raw(`ALTER TABLE my_table ALTER COLUMN new_col DROP DEFAULT`);
};
```

### Changing a column constraint

```js
exports.up = async function(knex) {
  await knex.raw('ALTER TABLE my_table ALTER COLUMN col SET NOT NULL');
};

exports.down = async function(knex) {
  await knex.raw('ALTER TABLE my_table ALTER COLUMN col DROP NOT NULL');
};
```

### Creating a new table

Mirror the entity's `@Column` decorators exactly. Include the same nullable/default/unique flags:

```js
exports.up = async function(knex) {
  await knex.schema.createTable('my_table', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name').notNullable();
    t.uuid('parent_id').notNullable().references('id').inTable('parents').onDelete('CASCADE');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).defaultTo(null);
    t.timestamp('deleted_at', { useTz: true }).defaultTo(null);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('my_table');
};
```

## Step 5 — Verify locally

```bash
# start DB
pnpm run db:up

# apply
DB_HOST=localhost DB_PORT=5432 DB_NAME=polla_mundial DB_USER=postgres DB_PASSWORD=password \
  npx knex --knexfile knexfile.js migrate:latest

# verify status — should show no pending
DB_HOST=localhost DB_PORT=5432 DB_NAME=polla_mundial DB_USER=postgres DB_PASSWORD=password \
  npx knex --knexfile knexfile.js migrate:status

# test rollback
DB_HOST=localhost DB_PORT=5432 DB_NAME=polla_mundial DB_USER=postgres DB_PASSWORD=password \
  npx knex --knexfile knexfile.js migrate:rollback
```

## Gotchas

- **`pnpm run migrate` fails in Docker** — use `npx knex --knexfile knexfile.js` directly with the env vars above. See the `run-db-stack` skill for why.
- **Enums must use `knex.raw()`** — `.enu()` skips Postgres type creation and breaks rollback. All existing migrations use raw SQL for enums; match that pattern.
- **`down` must be complete** — an incomplete `down` (missing a `DROP TYPE`, forgetting to restore old constraints) will cause `migrate:rollback` to fail or leave the DB in a broken state.
- **Column name is the DB name, not the TS property name** — TypeORM entities use `snake_case` column names directly (no decorator aliasing in this codebase), so the diff column name equals the DB column name.
- **The entity `@Entity("table_name")` decorator gives the exact table name** — always check it, don't guess from the class name.
