import { ITournamentTeam } from '../interfaces/ITournamentTeam';

export class TournamentTeamRules {
  /**
   * REGLA: Validación de IDs
   * Verifica que ambos IDs existan y tengan formato válido antes de intentar el Join.
   */
  static hasValidIdentifiers(data: ITournamentTeam): boolean {
    return !!data.tournament_id && !!data.team_id;
  }

  /**
   * REGLA DE NEGOCIO: Torneo Activo
   * Un equipo solo puede ser inscrito si el torneo está en estado 'PLANNED'.
   * No se deberían permitir inscripciones en torneos 'FINISHED'.
   */
  static canJoinTournament(tournamentStatus: string): boolean {
    return tournamentStatus === 'PLANNED';
  }

  /**
   * REGLA: Límite de Participantes
   * Si el torneo es, por ejemplo, un mundial de 32 equipos, esta regla valida el cupo.
   */
  static isUnderParticipantLimit(currentCount: number, maxLimit: number): boolean {
    return currentCount < maxLimit;
  }

  /**
   * REGLA DE INTEGRIDAD
   * Valida si la relación se puede crear.
   */
  static canBeLinked(data: ITournamentTeam, tournamentStatus: string): boolean {
    return this.hasValidIdentifiers(data) && this.canJoinTournament(tournamentStatus);
  }
}