import { DomainEvent } from "@skorify/domain/core";
import {
  TournamentInstanceAttributes,
  TournamentInstanceEntity,
} from "@skorify/domain/tournament-instance";
import { BaseMapper } from "./base.mapper";

export class TournamentInstanceMapper extends BaseMapper {
  fromJson(json: Record<string, any>): DomainEvent {
    const event = TournamentInstanceEntity.build({
      id: json.id,
      name: json.name,
      ownerId: json.owner_id,
      tournamentId: json.tournament_id,
      state: json.state,
      inviteCode: json.invite_code,
    });

    return event;
  }

  toJson(entity: TournamentInstanceEntity): any {
    return {
      id: entity.id,
      name: entity.name,
      owner_id: entity.ownerId,
      tournament_id: entity.tournamentId,
      state: entity.state,
      invite_code: entity.inviteCode,
    };
  }
}
