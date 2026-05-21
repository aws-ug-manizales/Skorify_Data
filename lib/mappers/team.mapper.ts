import { DomainEvent } from "@skorify/domain/core";
import { TeamAttributes, TeamEntity } from "@skorify/domain/team";
import { BaseMapper } from "./base.mapper";

export class TeamMapper extends BaseMapper {
  fromJson(json: Record<string, any>): DomainEvent {
    return TeamEntity.build({
      id: json.id,
      name: json.name,
      shieldUrl: json.shield_url,
      tournamentId: json.tournament_id,
      createdAt: json.created_at,
    });
  }

  toJson(entity: TeamEntity): any {
    return {
      id: entity.id,
      name: entity.name,
      shield_url: entity.shieldUrl,
      tournament_id: entity.tournamentId,
      created_at: entity.createdAt,
    };
  }
}
