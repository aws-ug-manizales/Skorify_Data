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
- Validation rules live on the entity class using `class-validator` decorators. `create` and `modifyById` run `validateSchema` automatically.
- Do not inject the repository anywhere other than the constructor — always pass it to `super`.
