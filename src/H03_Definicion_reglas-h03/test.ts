// **1. Preparación del entorno (una sola vez):**
// ```bash
// npm install -g typescript ts-node
// **2. Ejecución directa (sin generar basura):**
// ```bash
// ts-node test.ts
// **3. Compilación manual (si necesitas JS):**
// ```bash
// npx tsc prediction.rules.ts
// node prediction.rules.js


import { PredictionRules } from "./prediction.rules";

// Crear una fecha de partido para mañana
const partidoManana = new Date();
partidoManana.setDate(partidoManana.getDate() + 1);

// Crear una fecha de partido para dentro de 5 minutos (debería fallar)
const partidoYa = new Date(Date.now() + 5 * 60 * 1000);

try {
    PredictionRules.validatePredictionTime(partidoYa);
} catch (error) {
    if (error instanceof Error) {
        // Aquí TypeScript ya sabe que 'error' tiene la propiedad .message
        console.error("Error esperado:", error.message);
    } else {
        console.error("Ocurrió un error inesperado:", error);
    }
}