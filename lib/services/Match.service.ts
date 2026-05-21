import { Repository } from "typeorm";
import { Match as MatchEntity } from "../../entities/Match";
import { BaseDataService } from "./base.service";

export class MatchService extends BaseDataService<MatchEntity> {
    constructor(repository: Repository<MatchEntity>) {
        super(MatchEntity, repository);
    }

    async findAllSchedule(): Promise<MatchEntity[]> {
        return await this.repository.find({
            where: { status: "scheduled" }
        });
    }

    async finish(id: string): Promise<void> {
        await this.repository.update(id, { status: "finished" });
    }
}