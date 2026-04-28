import { Repository } from "typeorm";
import { Rule } from "../../entities/Rule";
import { BaseDataService } from "./base.service";

export class RuleService extends BaseDataService<Rule> {
    constructor(private readonly repository: Repository<Rule>) {
        super(Rule);
    }

    async create(data: Partial<Rule>): Promise<Rule> {
        await this.validateSchema(data);
        const rule = this.repository.create(data);
        return await this.repository.save(rule);
    }

    async findById(id: string): Promise<Rule | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findAll(): Promise<Rule[]> {
        return await this.repository.find();
    }
}
