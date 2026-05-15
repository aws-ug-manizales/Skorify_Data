import { Repository } from "typeorm";
import { GroupTeam } from "../../entities/GroupTeam";
import { BaseDataService } from "./base.service";

export class GroupTeamService extends BaseDataService<GroupTeam> {
    constructor(repository: Repository<GroupTeam>) {
        super(GroupTeam, repository);
    }

    async findByGroupId(group_id: string): Promise<GroupTeam[]> {
        return await this.repository.find({ where: { group_id } });
    }

    async findByTeamId(team_id: string): Promise<GroupTeam[]> {
        return await this.repository.find({ where: { team_id } });
    }
}
