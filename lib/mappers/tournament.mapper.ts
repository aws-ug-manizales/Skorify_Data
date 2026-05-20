import { DomainEvent } from "@skorify/domain/core";
import { TournamentEntity } from "@skorify/domain/tournament";
import { BaseMapper } from "./base.mapper";

export class TournamentMapper extends BaseMapper {
  fromJson(json: Record<string, any>): DomainEvent {
    return TournamentEntity.build({
      id: json.id,
      name: json.name,
      startDate: new Date(json.start_date),
      endDate: new Date(json.end_date),
      matchType: json.match_type,
      token: json.token,
    });
  }

  toJson(entity: TournamentEntity) {
    return {
      id: entity.id,
      name: entity.name,
      start_date: entity.startDate,
      end_date: entity.endDate,
      match_type: entity.matchType,
      token: entity.token,
    };
  }
}
