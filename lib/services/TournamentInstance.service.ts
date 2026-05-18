import { Repository } from "typeorm";
import { TournamentInstance } from "../../entities/TournamentInstance";
import { BaseDataService } from "./base.service";

export class TournamentInstanceService extends BaseDataService<TournamentInstance> {
    constructor(repository: Repository<TournamentInstance>) {
        super(TournamentInstance, repository);
    }

    async create(data: Partial<TournamentInstance>): Promise<TournamentInstance> {
        await this.validateSchema(data);
        const tournamentInstance = this.repository.create(data);
        return await this.repository.save(tournamentInstance);
    }

    async findById(id: string): Promise<TournamentInstance | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findAll(): Promise<TournamentInstance[]> {
        return await this.repository.find();
    }
}
