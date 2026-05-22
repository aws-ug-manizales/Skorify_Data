import { Repository } from "typeorm";
import { Tournament } from "../../entities/Tournament";
import { BaseDataService } from "./base.service";
import { TournamentEntity } from "@skorify/domain/tournament";
import { TournamentMapper } from "../mappers/tournament.mapper";

export class TournamentService extends BaseDataService<
  Tournament,
  TournamentEntity
> {
  constructor(repository: Repository<Tournament>, mapper: TournamentMapper) {
    super(Tournament, repository, mapper);
  }
}
