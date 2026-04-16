import { IsNull, Repository } from "typeorm";
import { User as UserEntity } from "../../entities/User";
import { BaseDataService } from "./base.service";

export class UserService extends BaseDataService<UserEntity> {
    constructor(private readonly repository: Repository<UserEntity>) {
        super(UserEntity);
    }

    /**
     * Creates a new user after schema validation.
     */
    async create(data: Partial<UserEntity>): Promise<UserEntity> {
        await this.validateSchema(data);

        const newUser = this.repository.create(data);
        return await this.repository.save(newUser);
    }

    /**
     * Returns all active users (excluding soft-deleted rows).
     */
    async findAllActive(): Promise<UserEntity[]> {
        return await this.repository.find({
            where: { deleted_at: IsNull() }
        });
    }

    /**
     * Finds an active user by id.
     */
    async findById(id: string): Promise<UserEntity | null> {
        return await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    }

    /**
     * Soft-deletes a user by id.
     */
    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }
}