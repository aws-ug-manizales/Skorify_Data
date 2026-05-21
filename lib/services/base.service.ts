import { validateOrReject, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import {
  DeepPartial,
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

  async save(data: DE): Promise<IE> {
    await this.validateData(data);
    await this.validateRules(data);
    const json = this.mapper.toJson(data);
    const newEntity = this.repository.create(json as DeepPartial<IE>);
    return await this.repository.save(newEntity);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.update(id, {});
  }

  async modifyById(id: string, data: DE): Promise<DE> {
    await this.validateData(data);
    await this.validateRules(data);
    await this.repository.update(id, data as any);
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Entity with id ${id} not found`);
    return updated;
  }

  async getAll(): Promise<IE[]> {
    return await this.repository.find();
  }

  async getByIDs(ids: string[]): Promise<IE[]> {
    return await this.repository.find({
      where: { id: In(ids) } as FindOptionsWhere<IE>,
    });
  }

  async filter(filters: FindManyOptions<IE>): Promise<IE[]> {
    if (!filters.take) filters.take = 100; // Default limit
    console.log(filters);
    filters.where = this.applyBoundaries(filters.where);
    console.log(filters);

    return await this.repository.find(filters);
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
  protected async validateData(data: DE): Promise<void> {
    await this.validateSchema(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async validateRules(_data: DE): Promise<void> {}

  protected async validateSchema(data: DE): Promise<void> {
    const json = this.mapper.toJson(data);

    const entityInstance = plainToInstance(this.entityClass, json);

    try {
      await validateOrReject(entityInstance, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
    } catch (errors) {
      const messages = this.formatErrors(errors as ValidationError[]);
      throw new Error(`Data Validation Failed: ${messages.join(", ")}`);
    }
  }

  private formatErrors(errors: ValidationError[]): string[] {
    return errors.map((err) => Object.values(err.constraints || {}).join(", "));
  }
}
