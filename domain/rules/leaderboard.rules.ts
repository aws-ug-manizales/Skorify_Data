import { ILeaderboard } from '../interfaces/ILeaderboard';

export class LeaderboardRules {
  /**
   * REGLA: Desempate (Tie-breaker)
   * En Skorify, a igualdad de puntos, el que tenga más aciertos exactos
   * debería estar por encima.
   */
  static isHigherRanked(playerA: ILeaderboard, playerB: ILeaderboard): boolean {
    if (playerA.total_points !== playerB.total_points) {
      return playerA.total_points > playerB.total_points;
    }
    // Si hay empate en puntos, desempatamos por aciertos exactos
    return playerA.exact_hits > playerB.exact_hits;
  }

  /**
   * REGLA: Validación de Puntos Negativos
   * Los puntos totales nunca deberían ser menores a 0 por lógica de juego.
   */
  static hasValidPoints(points: number): boolean {
    return points >= 0;
  }

  /**
   * REGLA: Consistencia de Aciertos
   * La suma de aciertos no puede ser mayor al total de partidos del torneo.
   */
  static isValidHitCount(hits: number, totalMatches: number): boolean {
    return hits <= totalMatches;
  }

  /**
   * REGLA: Auditoría de Clasificación
   * Verifica si la posición ha sido actualizada recientemente.
   */
  static wasRecentlyCalculated(leaderboard: ILeaderboard): boolean {
    if (!leaderboard.updated_at) return false;
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = new Date();
    return (now.getTime() - leaderboard.updated_at.getTime()) < ONE_HOUR_MS;
  }
}