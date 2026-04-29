import { Repository } from "typeorm";
import { InstanceUser } from "../../entities/InstanceUser";
import { BaseDataService } from "./base.service";

export class InstanceUserService extends BaseDataService<InstanceUser> {
    constructor(repository: Repository<InstanceUser>) {
        super(InstanceUser, repository);
    }

    async findByInstanceId(instance_id: string): Promise<InstanceUser[]> {
        return await this.repository.find({ where: { instance_id } });
    }

    async findByPlayerId(player_id: string): Promise<InstanceUser[]> {
        return await this.repository.find({ where: { player_id } });
    }
}
