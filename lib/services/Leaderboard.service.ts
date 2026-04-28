import { Repository } from "typeorm";
import { Leaderboard } from "../../entities/Leaderboard";
import { BaseDataService } from "./base.service";

export class LeaderboardService extends BaseDataService<Leaderboard> {
    constructor(private readonly repository: Repository<Leaderboard>) {
        super(Leaderboard);
    }

    async create(data: Partial<Leaderboard>): Promise<Leaderboard> {
        await this.validateSchema(data);
        const entry = this.repository.create(data);
        return await this.repository.save(entry);
    }

    async findById(id: string): Promise<Leaderboard | null> {
        return await this.repository.findOne({ where: { id } });
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
