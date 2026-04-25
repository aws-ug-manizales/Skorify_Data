import { TimeService } from "./time.service";

export class PredictionRules {
  // Convención: Las constantes de configuración se definen al inicio
  private static readonly PREDICTION_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

  /**
   * Verifica si la predicción está dentro del rango de tiempo permitido.
   * @param matchDate Fecha programada del partido
   * @returns boolean
   */
  public static canCreatePrediction(matchDate: Date): boolean {
    const now = TimeService.now();
    const limit = new Date(matchDate.getTime() - this.PREDICTION_WINDOW_MS);

    return now <= limit;
  }

  /**
   * Valida la regla de negocio y lanza una excepción si el tiempo ha expirado.
   * @param matchDate Fecha programada del partido
   * @throws Error si faltan menos de 10 minutos para el partido
   */
  public static validatePredictionTime(matchDate: Date): void {
    if (!this.canCreatePrediction(matchDate)) {
      throw new Error(
        "No se pueden hacer predicciones: el partido inicia en menos de 10 minutos o ya comenzó."
      );
    }
  }
}