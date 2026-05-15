import { IsNull, Repository } from "typeorm";
import { Instance } from "../../entities/Instance";
import { BaseDataService } from "./base.service";

export class InstanceService extends BaseDataService<Instance> {
    constructor(repository: Repository<Instance>) {
        super(Instance, repository);
    }

    async getById(id: string): Promise<Instance | null> {
        return await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    }

    async findByTournamentId(tournament_id: string): Promise<Instance[]> {
        return await this.repository.find({ where: { tournament_id, deleted_at: IsNull() } });
    }

    async findByOwnerId(owner_user_id: string): Promise<Instance[]> {
        return await this.repository.find({ where: { owner_user_id, deleted_at: IsNull() } });
    }

    async updateState(id: string, state: 'approved' | 'pending' | 'denied'): Promise<void> {
        await this.repository.update(id, { state });
    }

    async deleteById(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }
}
