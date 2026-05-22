import { IsNull, Repository } from "typeorm";
import { Prediction } from "../../entities/Prediction";
import { BaseDataService } from "./base.service";
import { PredictionMapper } from "../mappers/prediction.mapper";
import { PredictionEntity } from "@skorify/domain/prediction";

export class PredictionService extends BaseDataService<Prediction, PredictionEntity> {
  constructor(repository: Repository<Prediction>, mapper: PredictionMapper) {
    super(Prediction, repository, mapper);
  }
}
