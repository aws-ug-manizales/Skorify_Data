import { Repository } from "typeorm";
import { InstanceRule } from "../../entities/InstanceRule";
import { BaseDataService } from "./base.service";

export class InstanceRuleService extends BaseDataService<InstanceRule> {
    constructor(repository: Repository<InstanceRule>) {
        super(InstanceRule, repository);
    }

    async findByInstanceId(instance_id: string): Promise<InstanceRule[]> {
        return await this.repository.find({ where: { instance_id } });
    }

    async findByRuleId(rule_id: string): Promise<InstanceRule[]> {
        return await this.repository.find({ where: { rule_id } });
    }
}
