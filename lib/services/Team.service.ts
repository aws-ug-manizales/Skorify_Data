import { IsNull, Repository } from "typeorm";
import { Team } from "../../entities/Team";
import { BaseDataService } from "./base.service";

export class TeamService extends BaseDataService<Team> {
    constructor(private readonly repository: Repository<Team>) {
        super(Team);
    }

    async create(data: Partial<Team>): Promise<Team> {
        await this.validateSchema(data);
        const team = this.repository.create(data);
        return await this.repository.save(team);
    }

    async findById(id: string): Promise<Team | null> {
        return await this.repository.findOne({ where: { id, deleted_at: IsNull() } });
    }

    async findByCode(code: string): Promise<Team | null> {
        return await this.repository.findOne({ where: { code, deleted_at: IsNull() } });
    }

    async findAllActive(): Promise<Team[]> {
        return await this.repository.find({ where: { deleted_at: IsNull() } });
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.update(id, { deleted_at: new Date() });
    }
}
