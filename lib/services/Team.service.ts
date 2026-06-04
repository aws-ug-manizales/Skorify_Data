import { IsNull, Repository } from "typeorm";
import { Team } from "../../entities/Team";
import { BaseDataService } from "./base.service";
import { TeamEntity } from "@skorify/domain/team";
import { TeamMapper } from "../mappers/team.mapper";

export class TeamService extends BaseDataService<Team, TeamEntity> {
  constructor(repository: Repository<Team>, mapper: TeamMapper) {
    super(Team, repository, mapper);
  }
}
