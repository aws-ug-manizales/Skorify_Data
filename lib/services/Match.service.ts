import { IsNull, Repository } from "typeorm";
import { Match as MatchEntity } from "../../entities/Match";
import { BaseDataService } from "./base.service";

export class MatchService extends BaseDataService<MatchEntity> {
    constructor(private readonly repository: Repository<MatchEntity>) {
        super(MatchEntity);
    }

    /**
     * Creates a new match after schema validation.
     */
    async create(data: Partial<MatchEntity>): Promise<MatchEntity> {
        const allData = {
            ...data,
        }
        console.log("Creating match with data:", allData);
        await this.validateSchema(allData);

        const newMatch = this.repository.create(allData);
        return await this.repository.save(newMatch);
    }

    /**
     * Returns all active matches (excluding soft-deleted rows).
     */
    async findAllActive(): Promise<MatchEntity[]> {
        return await this.repository.find({
            where: { status: "scheduled" }
        });
    }

    /**
     * Finds an active match by id.
     */
    async findById(id: string): Promise<MatchEntity | null> {
        return await this.repository.findOne({ where: { id } });
    }

    /**
     * Soft-deletes a match by id.
     */
    async finish(id: string): Promise<void> {
        await this.repository.update(id, { status: "finished" });
    }
}