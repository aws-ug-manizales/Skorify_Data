import { IGroupTeam } from '../interfaces/IGroupTeam';

export class GroupTeamRules {
  /**
   * REGLA: Validación de Pertenencia Única
   * Un equipo no puede estar vinculado a un grupo si ya pertenece a otro
   * dentro de la misma instancia de torneo.
   */
  static isTeamAvailableForGroup(
    teamId: string, 
    existingTeamIdsInTournament: string[]
  ): boolean {
    return !existingTeamIdsInTournament.includes(teamId);
  }

  /**
   * REGLA: Límite de Equipos por Grupo
   * Basado en la lógica de competencia de Skorify.
   */
  static hasRoomInGroup(currentCount: number, maxLimit: number = 4): boolean {
    return currentCount < maxLimit;
  }

  /**
   * REGLA: Integridad de IDs
   * Valida que los UUIDs tengan el formato correcto antes de intentar la operación.
   */
  static isValidPair(teamId: string, groupId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(teamId) && uuidRegex.test(groupId);
  }
}