import { IsNull, Repository } from "typeorm";
import { Prediction } from "../../entities/Prediction";
import { BaseDataService } from "./base.service";

export class PredictionService extends BaseDataService<Prediction> {
    constructor(repository: Repository<Prediction>) {
        super(Prediction, repository);
    }

    async getById(id: string): Promise<Prediction | null> {
        return await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    }

    async findByMatchId(match_id: string): Promise<Prediction[]> {
        return await this.repository.find({ where: { match_id, deleted_at: IsNull() } });
    }

    async findByInstancePlayerId(instance_player_id: string): Promise<Prediction[]> {
        return await this.repository.find({ where: { instance_player_id, deleted_at: IsNull() } });
    }

    async updateEarnedPoints(id: string, earned_points: number): Promise<void> {
        await this.repository.update(id, { earned_points });
    }

    async deleteById(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }
}
