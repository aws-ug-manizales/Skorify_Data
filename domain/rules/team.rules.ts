import { ITeam } from '../interfaces/ITeam';

export class TeamRules {
  /**
   * REGLA: Validación de Identidad (Código)
   * Los códigos de equipo deben ser cortos (ej: COL, BRA, ARG) 
   * y siempre en mayúsculas para consistencia.
   */
  static isValidCode(code: string): boolean {
    const codeRegex = /^[A-Z0-9]{2,5}$/;
    return codeRegex.test(code);
  }

  /**
   * REGLA: Disponibilidad (Soft Delete)
   * Un equipo no puede ser asignado a nuevos partidos o grupos 
   * si ha sido marcado como eliminado.
   */
  static isActive(team: ITeam): boolean {
    return team.deleted_at === null;
  }

  /**
   * REGLA: Integridad de Nombre
   * Evita nombres de equipos excesivamente largos que rompan la UI.
   */
  static isValidName(name: string): boolean {
    return name.length >= 2 && name.length <= 100;
  }

  /**
   * REGLA SINGULAR: Auditoría de Antigüedad
   * Determina si el equipo es un registro "clásico" en el sistema 
   * (creado hace más de un año) para dar medallas o badges en la UI.
   */
  static isLegacyTeam(team: ITeam): boolean {
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    const now = new Date();
    return (now.getTime() - team.created_at.getTime()) > ONE_YEAR_MS;
  }
}