import { IPrediction } from '../interfaces/IPrediction';

export class PredictionRules {
  /**
   * REGLA: Validación de Goles
   * En el fútbol real y en Skorify, no existen goles negativos.
   */
  static isValidScore(homeGoals: number, awayGoals: number): boolean {
    return homeGoals >= 0 && awayGoals >= 0;
  }

  /**
   * REGLA: Estado de Disponibilidad (Soft Delete)
   * Verifica si la predicción es válida para el conteo de puntos.
   */
  static isActive(prediction: IPrediction): boolean {
    return prediction.deleted_at === null;
  }

  /**
   * REGLA: Límite de Edición
   * Una vez creada, ¿puede el usuario cambiar su predicción?
   * Útil para auditoría de integridad antes de que el partido inicie.
   */
  static isEditable(prediction: IPrediction, matchKickOff: Date): boolean {
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    const now = new Date();
    const deadline = matchKickOff.getTime() - FIFTEEN_MINUTES_MS;

    return now.getTime() < deadline && prediction.deleted_at === null;
  }

  /**
   * REGLA SINGULAR: Auditoría de Modificación
   * Indica si el usuario cambió de opinión después de su predicción inicial.
   */
  static wasModified(prediction: IPrediction): boolean {
    if (!prediction.updated_at) return false;
    return prediction.updated_at.getTime() > prediction.created_at.getTime();
  }

  /**
   * REGLA: Cálculo de Puntos (Lógica de Negocio)
   * Esta es la regla maestra que alimenta al Leaderboard.
   */
  static calculatePoints(prediction: IPrediction, realHome: number, realAway: number): number {
    // 1. Acierto Exacto (Marcador idéntico) -> 3 puntos
    if (prediction.pred_home_goals === realHome && prediction.pred_away_goals === realAway) {
      return 3;
    }

    // 2. Acierto de Ganador/Empate (Tendencia) -> 1 punto
    const predResult = Math.sign(prediction.pred_home_goals - prediction.pred_away_goals);
    const realResult = Math.sign(realHome - realAway);

    if (predResult === realResult) {
      return 1;
    }

    // 3. Fallo total
    return 0;
  }
}