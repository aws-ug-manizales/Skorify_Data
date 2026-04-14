import { Repository } from "typeorm";
import { UserEntity } from "../entities/User.entity";
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
            where: { isActive: true }
        });
    }

    /**
     * Busca por ID
     */
    async findById(id: string): Promise<UserEntity | null> {
        return await this.repository.findOneBy({ id } as any);
    }

    /**
     * Eliminación lógica (Soft Delete)
     */
    async softDelete(id: string): Promise<void> {
        await this.repository.softDelete(id);
    }
}