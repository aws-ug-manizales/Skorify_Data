import { Repository } from "typeorm";
import { Leaderboard } from "../../entities/Leaderboard";
import { BaseDataService } from "./base.service";

export class LeaderboardService extends BaseDataService<Leaderboard> {
    constructor(repository: Repository<Leaderboard>) {
        super(Leaderboard, repository);
    }

    async findByTournamentId(tournament_id: string): Promise<Leaderboard[]> {
        return await this.repository.find({
            where: { tournament_id },
            order: { position: "ASC" },
        });
    }

    async findByUserId(user_id: string): Promise<Leaderboard[]> {
        return await this.repository.find({ where: { user_id } });
    }

    async updatePoints(id: string, data: Partial<Pick<Leaderboard, 'total_points' | 'exact_hits' | 'outcome_hits' | 'position'>>): Promise<void> {
        await this.repository.update(id, data);
    }
}
