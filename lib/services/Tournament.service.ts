import { Repository } from "typeorm";
import { Tournament } from "../../entities/Tournament";
import { BaseDataService } from "./base.service";

export class TournamentService extends BaseDataService<Tournament> {
    constructor(repository: Repository<Tournament>) {
        super(Tournament, repository);
    }

    async create(data: Partial<Tournament>): Promise<Tournament> {
        await this.validateSchema(data);
        const tournament = this.repository.create(data);
        return await this.repository.save(tournament);
    }

    async findById(id: string): Promise<Tournament | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findAll(): Promise<Tournament[]> {
        return await this.repository.find();
    }
}
