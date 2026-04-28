import { Repository } from "typeorm";
import { InstanceUser } from "../../entities/InstanceUser";
import { BaseDataService } from "./base.service";

export class InstanceUserService extends BaseDataService<InstanceUser> {
    constructor(private readonly repository: Repository<InstanceUser>) {
        super(InstanceUser);
    }

    async create(data: Partial<InstanceUser>): Promise<InstanceUser> {
        await this.validateSchema(data);
        const instanceUser = this.repository.create(data);
        return await this.repository.save(instanceUser);
    }

    async findByInstanceId(instance_id: string): Promise<InstanceUser[]> {
        return await this.repository.find({ where: { instance_id } });
    }

    async findByPlayerId(player_id: string): Promise<InstanceUser[]> {
        return await this.repository.find({ where: { player_id } });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
