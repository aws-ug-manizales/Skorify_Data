import { validateOrReject, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";

export abstract class BaseDataService<T extends object> {
    constructor(private entityClass: new () => T) {}

    /**
     * Validates that incoming data matches class-validator rules.
     * Throws a detailed error when validation fails.
     */
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