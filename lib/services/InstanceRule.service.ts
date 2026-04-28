import { Repository } from "typeorm";
import { InstanceRule } from "../../entities/InstanceRule";
import { BaseDataService } from "./base.service";

export class InstanceRuleService extends BaseDataService<InstanceRule> {
    constructor(private readonly repository: Repository<InstanceRule>) {
        super(InstanceRule);
    }

    async create(data: Partial<InstanceRule>): Promise<InstanceRule> {
        await this.validateSchema(data);
        const instanceRule = this.repository.create(data);
        return await this.repository.save(instanceRule);
    }

    async findByInstanceId(instance_id: string): Promise<InstanceRule[]> {
        return await this.repository.find({ where: { instance_id } });
    }

    async findByRuleId(rule_id: string): Promise<InstanceRule[]> {
        return await this.repository.find({ where: { rule_id } });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
