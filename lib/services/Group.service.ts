import { IsNull, Repository } from "typeorm";
import { Group } from "../../entities/Group";
import { BaseDataService } from "./base.service";

export class GroupService extends BaseDataService<Group> {
    constructor(private readonly repository: Repository<Group>) {
        super(Group);
    }

    async create(data: Partial<Group>): Promise<Group> {
        await this.validateSchema(data);
        const group = this.repository.create(data);
        return await this.repository.save(group);
    }

    async findById(id: string): Promise<Group | null> {
        return await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    }

    async findByTournamentId(tournament_id: string): Promise<Group[]> {
        return await this.repository.find({ where: { tournament_id, deleted_at: IsNull() } });
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }
}
