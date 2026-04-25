import { PredictionRules } from "./prediction.rules";

/**
 * Suite de pruebas para validar la lógica de predicciones
 */

// 1. Caso de éxito: Partido programado para mañana
const partidoManana = new Date();
partidoManana.setDate(partidoManana.getDate() + 1);

console.log("Validando partido programado para mañana...");
const puedePredecirManana = PredictionRules.canCreatePrediction(partidoManana);
console.log(`Resultado: ${puedePredecirManana ? "Permitido" : "Denegado"}`);

// 2. Caso de error: Partido que inicia en 5 minutos (debe fallar por la regla de < 10min)
const partidoInminente = new Date(Date.now() + 5 * 60 * 1000);

console.log("\nValidando partido inminente (margen de 5 minutos)...");
try {
  PredictionRules.validatePredictionTime(partidoInminente);
} catch (error) {
  if (error instanceof Error) {
    // Convención: Se usa console.info o log para errores esperados en pruebas
    console.log("Error capturado correctamente:", error.message);
  } else {
    console.error("Ocurrió un error inesperado de tipo desconocido:", error);
  }
}