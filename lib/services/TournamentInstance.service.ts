import { Repository } from "typeorm";
import { TournamentInstance } from "../../entities/TournamentInstance";
import { BaseDataService } from "./base.service";
import { TournamentInstanceEntity } from "@skorify/domain/tournament-instance";
import { TournamentInstanceMapper } from "../mappers/tournament-instance.mapper";

export class TournamentInstanceService extends BaseDataService<
  TournamentInstance,
  TournamentInstanceEntity
> {
  constructor(
    repository: Repository<TournamentInstance>,
    mapper: TournamentInstanceMapper,
  ) {
    super(TournamentInstance, repository, mapper);
  }
}
