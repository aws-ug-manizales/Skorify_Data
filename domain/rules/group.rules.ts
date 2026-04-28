import { IGroup } from '../interfaces/IGroup';

export class GroupRules {
  /**
   * REGLA: Validación de Nombre
   * Los grupos suelen ser 'A', 'B', 'Grupo 1', etc.
   */
  static isValidGroupName(name: string): boolean {
    return name.length > 0 && name.length <= 50;
  }

  /**
   * REGLA: Capacidad del Grupo (Basado en el mapa)
   * Un grupo en un torneo estándar suele tener entre 2 y 8 equipos.
   */
  static canAddMoreTeams(currentTeamCount: number): boolean {
    const MAX_TEAMS_PER_GROUP = 8; 
    return currentTeamCount < MAX_TEAMS_PER_GROUP;
  }

  /**
   * REGLA: Integridad del Torneo
   * Verifica que el grupo pertenezca al torneo antes de realizar acciones.
   */
  static belongsToTournament(group: IGroup, tournamentId: string): boolean {
    return group.tournament_id === tournamentId;
  }

/**
   * REGLA: Validación Singular de Creación
   * Verifica si el grupo fue creado en las últimas 24 horas.
   * Se usa para permitir ediciones o eliminaciones sin restricciones
   * solo durante el primer día de vida del registro.
   */
  static isWithinGracePeriod(group: IGroup): boolean {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = new Date();
    const age = now.getTime() - group.created_at.getTime();

    return age < ONE_DAY_MS;
  }

  /**
   * REGLA: Estado de Disponibilidad (Soft Delete)
   */
  static isActive(group: IGroup): boolean {
    return group.deleted_at === null;
  }

  /**
   * REGLA: Verificación de Modificación
   */
  static isEdited(group: IGroup): boolean {
    if (!group.updated_at || !group.created_at) return false;
    return group.updated_at.getTime() > group.created_at.getTime();
  }
}