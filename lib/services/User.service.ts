import { IsNull, Repository } from "typeorm";
import { User as UserEntity } from "../../entities/User";
import { BaseDataService } from "./base.service";

export class UserService extends BaseDataService<UserEntity> {
    constructor(private readonly repository: Repository<UserEntity>) {
        // Pasamos la clase UserEntity al constructor padre para las validaciones
        super(UserEntity);
    }

    /**
     * Crea un nuevo usuario con validación previa
     */
    async create(data: Partial<UserEntity>): Promise<UserEntity> {
        // 1. Validar lógica de esquema (campos obligatorios, formatos, etc.)
        await this.validateSchema(data);

        // 2. Crear instancia y persistir
        const newUser = this.repository.create(data);
        return await this.repository.save(newUser);
    }

    /**
     * Busca todos los usuarios activos (evita traer los borrados lógicamente)
     */
    async findAllActive(): Promise<UserEntity[]> {
        return await this.repository.find({
            where: { deleted_at: IsNull() }
        });
    }

    /**
     * Busca por ID
     */
    async findById(id: string): Promise<UserEntity | null> {
        return await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    }

    /**
     * Eliminación lógica (Soft Delete)
     */
    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }
}