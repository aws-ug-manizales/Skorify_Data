// prediction.rules.ts

import { TimeService } from "./concepto_de_tiempo/time.service";

export class PredictionRules {
  /**
   * Verifica si aún se puede hacer una predicción
   * (hasta 10 minutos antes del partido)
   */
  static canCreatePrediction(matchDate: Date): boolean {
    const now = TimeService.now();

    // Restamos 10 minutos al inicio del partido
    const limitTime = new Date(matchDate.getTime() - 10 * 60 * 1000);

    return now <= limitTime;
  }

  /**
   * Lanza error si no se cumple la regla
   */
  static validatePredictionTime(matchDate: Date): void {
    if (!this.canCreatePrediction(matchDate)) {
      throw new Error(
        "No se pueden hacer predicciones: el partido inicia en menos de 10 minutos o ya comenzó."
      );
    }
  }
}