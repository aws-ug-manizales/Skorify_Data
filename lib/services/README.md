# Services

All services extend `BaseDataService<T>`, which provides common CRUD operations out of the box.

## BaseDataService — inherited methods

| Method | Signature | Description |
|---|---|---|
| `create` | `(data: Partial<T>) => Promise<T>` | Validates against class-validator rules, then inserts |
| `getById` | `(id: string) => Promise<T \| null>` | Finds one row by primary key |
| `getAll` | `() => Promise<T[]>` | Returns every row |
| `getByIDs` | `(ids: string[]) => Promise<T[]>` | Bulk lookup via `IN (...)` |
| `modifyById` | `(id: string, data: Partial<T>) => Promise<T>` | Updates then returns the refreshed entity |
| `deleteById` | `(id: string) => Promise<void>` | Hard-deletes by primary key |

`protected repository` and `protected validateSchema` are also available inside the subclass.

## Lifecycle hooks

`create` and `modifyById` call two hooks before writing to the database. Both are no-ops by default and can be overridden independently.

| Hook | Default behaviour | When to override |
|---|---|---|
| `validateData(data)` | Runs `validateSchema` (class-validator) | Replace or extend schema validation |
| `validateRule(data)` | No-op | Enforce business rules (e.g. uniqueness, state machines, cross-entity constraints) |

Call order: `validateData` → `validateRule` → write.

```ts
export class MatchService extends BaseDataService<MatchEntity> {
    constructor(repository: Repository<MatchEntity>) {
        super(MatchEntity, repository);
    }

    // Extend schema validation — still runs class-validator, then adds a custom check
    protected async validateData(data: Partial<MatchEntity>): Promise<void> {
        await super.validateData(data);
        if (data.start_date && data.end_date && data.start_date >= data.end_date) {
            throw new Error("start_date must be before end_date");
        }
    }

    // Pure business rule — no schema involved
    protected async validateRule(data: Partial<MatchEntity>): Promise<void> {
        const conflict = await this.repository.findOne({
            where: { home_team_id: data.home_team_id, status: "scheduled" },
        });
        if (conflict) throw new Error("Team already has a scheduled match");
    }
}
```

---

## Creating a new service

### 1. Create the file

`lib/services/MyEntity.service.ts`

### 2. Extend BaseDataService

```ts
import { Repository } from "typeorm";
import { MyEntity } from "../../entities/MyEntity";
import { BaseDataService } from "./base.service";

export class MyEntityService extends BaseDataService<MyEntity> {
    constructor(repository: Repository<MyEntity>) {
        super(MyEntity, repository);
    }
}
```

That's enough to get all six base methods working.

### 3. Add domain-specific methods (optional)

Use `this.repository` directly for queries that go beyond the base interface.

```ts
export class MyEntityService extends BaseDataService<MyEntity> {
    constructor(repository: Repository<MyEntity>) {
        super(MyEntity, repository);
    }

    // Override a base method when the entity needs extra filters
    async getById(id: string): Promise<MyEntity | null> {
        return await this.repository.findOne({
            where: { id, deleted_at: IsNull() },
        });
    }

    // Add entity-specific queries
    async findByStatus(status: string): Promise<MyEntity[]> {
        return await this.repository.find({ where: { status } });
    }
}
```

---

## Real examples

### Soft-delete (UserService)

`deleteById` is overridden to stamp `deleted_at` instead of removing the row. `getById` and `findAllActive` also filter on `deleted_at: IsNull()`.

### Status transition (MatchService)

`finish` calls `repository.update` to set `status: "finished"`. `findAllSchedule` queries only rows with `status: "scheduled"`.

---

## Rules

- Every entity must have `id: string` (`@PrimaryGeneratedColumn('uuid')`) — this is enforced by the `T extends { id: string }` constraint on the base class.
- Schema validation lives on the entity class via `class-validator` decorators and runs automatically through `validateData`. Business rules belong in `validateRule`.
- Do not inject the repository anywhere other than the constructor — always pass it to `super`.
