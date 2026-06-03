import { DomainEvent } from "@skorify/domain/core";
import { MatchAttributes, MatchEntity } from "@skorify/domain/match";
import { BaseMapper } from "./base.mapper";

export class MatchMapper extends BaseMapper {
  constructor() {
    super();
  }
  fromJson(json: Record<string, any>): DomainEvent {
    return MatchEntity.build({
      id: json.id,
      tournamentId: json.tournament_id,
      homeTeamId: json.home_team_id,
      awayTeamId: json.away_team_id,
      kickOff: new Date(json.kick_off),
      homeScore: json.home_score,
      awayScore: json.away_score,
      status: json.status,
      stage: json.stage,
      venue: json.venue,
      createdAt: new Date(json.created_at),
      updatedAt: json.updated_at ? new Date(json.updated_at) : undefined,
      deletedAt: json.deleted_at ? new Date(json.deleted_at) : undefined,
    });
  }

  toJson(entity: MatchEntity): any {
    return {
      id: entity.id,
      tournament_id: entity.tournamentId,
      home_team_id: entity.homeTeamId,
      away_team_id: entity.awayTeamId,
      kick_off: entity.kickOff,
      home_score: entity.homeScore,
      away_score: entity.awayScore,
      status: entity.status,
      stage: entity.stage,
      venue: entity.venue,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      deleted_at: entity.deletedAt,
    };
  }
}
