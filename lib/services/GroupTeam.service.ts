import { Repository } from "typeorm";
import { GroupTeam } from "../../entities/GroupTeam";
import { BaseDataService } from "./base.service";

export class GroupTeamService extends BaseDataService<GroupTeam> {
    constructor(private readonly repository: Repository<GroupTeam>) {
        super(GroupTeam);
    }

    async create(data: Partial<GroupTeam>): Promise<GroupTeam> {
        await this.validateSchema(data);
        const groupTeam = this.repository.create(data);
        return await this.repository.save(groupTeam);
    }

    async findByGroupId(group_id: string): Promise<GroupTeam[]> {
        return await this.repository.find({ where: { group_id } });
    }

    async findByTeamId(team_id: string): Promise<GroupTeam[]> {
        return await this.repository.find({ where: { team_id } });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
