import { validateOrReject, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import { DeepPartial, FindOptionsWhere, In, Repository } from "typeorm";

export abstract class BaseDataService<T extends { id: string }> {
    constructor(
        private entityClass: new () => T,
        protected readonly repository: Repository<T>
    ) {}

    async create(data: Partial<T>): Promise<T> {
        await this.validateData(data);
        await this.validateRules(data);
        const newEntity = this.repository.create(data as DeepPartial<T>);
        return await this.repository.save(newEntity);
    }

    async getById(id: string): Promise<T | null> {
        return await this.repository.findOne({
            where: { id } as FindOptionsWhere<T>,
        });
    }

    async getAll(): Promise<T[]> {
        return await this.repository.find();
    }

    async getByIDs(ids: string[]): Promise<T[]> {
        return await this.repository.find({
            where: { id: In(ids) } as FindOptionsWhere<T>,
        });
    }

    async modifyById(id: string, data: Partial<T>): Promise<T> {
        await this.validateData(data);
        await this.validateRules(data);
        await this.repository.update(id, data as any);
        const updated = await this.getById(id);
        if (!updated) throw new Error(`Entity with id ${id} not found`);
        return updated;
    }

    async deleteById(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    protected async validateData(data: Partial<T>): Promise<void> {
        await this.validateSchema(data);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async validateRules(_data: Partial<T>): Promise<void> {}

    protected async validateSchema(data: Partial<T>): Promise<void> {
        const entityInstance = plainToInstance(this.entityClass, data);

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
        return errors.map((err) =>
            Object.values(err.constraints || {}).join(", ")
        );
    }
}