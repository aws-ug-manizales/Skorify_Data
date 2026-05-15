import { Repository } from "typeorm";
import { TournamentTeam } from "../../entities/TournamentTeam";
import { BaseDataService } from "./base.service";

export class TournamentTeamService extends BaseDataService<TournamentTeam> {
    constructor(repository: Repository<TournamentTeam>) {
        super(TournamentTeam, repository);
    }

    async findByTournamentId(tournament_id: string): Promise<TournamentTeam[]> {
        return await this.repository.find({ where: { tournament_id } });
    }

    async findByTeamId(team_id: string): Promise<TournamentTeam[]> {
        return await this.repository.find({ where: { team_id } });
    }
}
