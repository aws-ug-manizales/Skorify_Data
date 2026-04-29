import { Repository } from "typeorm";
import { Rule } from "../../entities/Rule";
import { BaseDataService } from "./base.service";

export class RuleService extends BaseDataService<Rule> {
    constructor(repository: Repository<Rule>) {
        super(Rule, repository);
    }
}
