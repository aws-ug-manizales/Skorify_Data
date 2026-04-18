import { IMatch } from '../interfaces/IMatch';

export class MatchRules {
  /**
   * REGLA: Ventana de Apuestas
   * Determina si un partido aún acepta predicciones.
   * Por convención en Skorify, se cierra 15 minutos antes del kick_off.
   */
  static acceptsPredictions(match: IMatch): boolean {
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    const now = new Date();
    const deadline = match.kick_off.getTime() - FIFTEEN_MINUTES_MS;

    return now.getTime() < deadline && match.status === 'scheduled';
  }

  /**
   * REGLA: Validación de Resultado
   * Un partido solo puede tener goles asignados si no está en estado 'scheduled'.
   */
  static canHaveResult(match: IMatch): boolean {
    return match.status === 'in_progress' || match.status === 'finished';
  }

  /**
   * REGLA: Finalización de Partido
   * Verifica si el partido ha terminado para proceder al cálculo de puntos.
   */
  static isReadyToScore(match: IMatch): boolean {
    return (
      match.status === 'finished' && 
      match.home_goals !== null && 
      match.away_goals !== null
    );
  }

  /**
   * REGLA SINGULAR: Auditoría de Creación
   * Verifica si el partido se registró antes de su inicio real (Prevención de fraude).
   */
  static wasCreatedValidly(match: IMatch): boolean {
    return match.created_at.getTime() < match.kick_off.getTime();
  }
}