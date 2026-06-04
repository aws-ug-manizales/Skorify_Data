import { Repository } from "typeorm";
import { Match } from "../../entities/Match";
import { BaseDataService } from "./base.service";
import { MatchEntity } from "@skorify/domain/match";
import { MatchMapper } from "../mappers/match.mapper";

export class MatchService extends BaseDataService<Match, MatchEntity> {
  constructor(repository: Repository<Match>, mapper: MatchMapper) {
    super(Match, repository, mapper);
  }
}
