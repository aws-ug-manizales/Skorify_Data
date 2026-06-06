import { validateOrReject, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOptionsWhere,
  In,
  IsNull,
  Repository,
  Equal,
  LessThan,
  Like,
  MoreThan,
} from "typeorm";

import { BaseMapper } from "../mappers/base.mapper";
import { BuiltEntityDomainEvent, Entity } from "@skorify/domain/core";

type OperatorType = "like" | "moreThan" | "in" | "lessThan" | "equals";

type FilterOperator =
  | {
      type: OperatorType;
      value: any;
    }
  | any;

export abstract class BaseDataService<
  IE extends { id: string },
  DE extends Entity,
> {
  constructor(
    private entityClass: new () => IE,
    protected readonly repository: Repository<IE>,
    protected mapper: BaseMapper,
  ) {}

  async getById(id: string): Promise<DE | null> {
    const temp = await this.repository.findOne({
      where: { id, deleted_at: IsNull() } as unknown as FindOptionsWhere<IE>,
    });

    if (temp) {
      const domainEvent = this.mapper.fromJson(temp);
      if (domainEvent.is(BuiltEntityDomainEvent)) {
        return domainEvent.payload as DE;
      }
    }
    return null;
  }

  async save(data: DE): Promise<DE> {
    const json = this.mapper.toJson(data);
    await this.validateData(json);
    await this.validateRules(json);
    const newEntity = this.repository.create(json as DeepPartial<IE>);
    console.log(newEntity);
    await this.repository.save(newEntity);
    return data;
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, {});
  }

  async modify(data: DE): Promise<DE> {
    const json = this.mapper.toJson(data);
    await this.validateData(json);
    await this.validateRules(json);

    await this.repository.update(json.id, json as any);
    const updated = await this.getById(data.id);
    if (!updated) throw new Error(`Entity with id ${data.id} not found`);
    return updated;
  }

  async runInTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.repository.manager.transaction(work);
  }

  async getAll(): Promise<DE[]> {
    const total = await this.repository.find();
    const parsed = total.map((item) => this.mapper.fromJson(item));
    return parsed.map((event) => event.payload);
  }

  async getByIDs(ids: string[]): Promise<DE[]> {
    const total = await this.repository.find({
      where: { id: In(ids) } as FindOptionsWhere<IE>,
    });
    const parsed = total.map((item) => this.mapper.fromJson(item));
    return parsed.map((event) => event.payload);
  }

  async filter(filters: FindManyOptions<IE>): Promise<DE[]> {
    if (!filters.take) filters.take = 200; // Default limit
    filters.where = this.applyBoundaries(filters.where);
    const total = await this.repository.find(filters);
    const parsed = total.map((item) => this.mapper.fromJson(item));
    return parsed.map((event) => event.payload);
  }

  protected applyBoundaries(
    where?: FindOptionsWhere<IE> | FindOptionsWhere<IE>[],
  ): FindOptionsWhere<IE> | FindOptionsWhere<IE>[] {
    const camelToSnake = (value: string): string =>
      value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

    const parseOperator = (operator: FilterOperator) => {
      if (
        operator &&
        typeof operator === "object" &&
        "type" in operator &&
        "value" in operator
      ) {
        switch (operator.type) {
          case "like":
            return Like(operator.value);

          case "moreThan":
            return MoreThan(operator.value);

          case "lessThan":
            return LessThan(operator.value);

          case "in":
            return In(operator.value);

          case "equals":
            return Equal(operator.value);

          default:
            return operator.value;
        }
      }

      return operator;
    };

    const parseWhere = (obj: any) => {
      const keys = Object.keys(obj ?? {});

      return keys.reduce((acc: any, curr) => {
        const parsedKey = camelToSnake(curr);

        acc[parsedKey] = parseOperator(obj[curr]);

        return acc;
      }, {});
    };

    if (Array.isArray(where)) {
      return where.map(parseWhere);
    }

    return parseWhere(where);
  }
  protected async validateData(data: IE): Promise<void> {
    await this.validateSchema(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async validateRules(_data: DE): Promise<void> {}

  protected async validateSchema(data: IE): Promise<void> {
    const entityInstance = plainToInstance(this.entityClass, data);

    try {
      await validateOrReject(entityInstance, {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false,
      });
    } catch (errors) {
      const messages = this.formatErrors(errors as ValidationError[]);
      throw new Error(`Data Validation Failed: ${messages.join(", ")}`, { cause: errors });
    }
  }

  private formatErrors(errors: ValidationError[]): string[] {
    return errors.map((err) => Object.values(err.constraints || {}).join(", "));
  }
}
