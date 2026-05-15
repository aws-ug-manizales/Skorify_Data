import { IsNull, Repository } from "typeorm";
import { Group } from "../../entities/Group";
import { BaseDataService } from "./base.service";

export class GroupService extends BaseDataService<Group> {
    constructor(repository: Repository<Group>) {
        super(Group, repository);
    }

    async getById(id: string): Promise<Group | null> {
        return await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    }

    async findByTournamentId(tournament_id: string): Promise<Group[]> {
        return await this.repository.find({ where: { tournament_id, deleted_at: IsNull() } });
    }

    async deleteById(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }
}
