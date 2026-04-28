import { Repository } from "typeorm";
import { TournamentTeam } from "../../entities/TournamentTeam";
import { BaseDataService } from "./base.service";

export class TournamentTeamService extends BaseDataService<TournamentTeam> {
    constructor(private readonly repository: Repository<TournamentTeam>) {
        super(TournamentTeam);
    }

    async create(data: Partial<TournamentTeam>): Promise<TournamentTeam> {
        await this.validateSchema(data);
        const tournamentTeam = this.repository.create(data);
        return await this.repository.save(tournamentTeam);
    }

    async findByTournamentId(tournament_id: string): Promise<TournamentTeam[]> {
        return await this.repository.find({ where: { tournament_id } });
    }

    async findByTeamId(team_id: string): Promise<TournamentTeam[]> {
        return await this.repository.find({ where: { team_id } });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
