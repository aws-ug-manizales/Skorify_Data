import { validateOrReject, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";

export abstract class BaseDataService<T extends object> {
    // Definimos el esquema (clase) para poder instanciarlo y validarlo
    constructor(private entityClass: new () => T) {}

    /**
     * Valida que los datos cumplan con las reglas de class-validator.
     * Si falla, lanza un error detallado.
     */
    protected async validateSchema(data: Partial<T>): Promise<void> {
        // Transformamos el objeto plano a una instancia de la clase de la entidad
        const entityInstance = plainToInstance(this.entityClass, data);

        try {
            // validateOrReject lanza una excepción si hay errores
            await validateOrReject(entityInstance, {
                whitelist: true, // Elimina propiedades que no estén en la entidad
                forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
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