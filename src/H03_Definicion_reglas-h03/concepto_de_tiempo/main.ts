// **1. Instalación del Entorno (Solo una vez)**
// Para ejecutar archivos `.ts`, necesitas el compilador de TypeScript y un ejecutor directo. Abre tu terminal y corre:
// `npm install -g typescript ts-node`
// **2. Opción A: Ejecución Rápida (Desarrollo)**
// Ideal para pruebas rápidas sin generar archivos adicionales. Usa `ts-node` para leer el archivo directamente:
// `ts-node main.ts`
// **3. Opción B: Compilación y Ejecución (Producción)**
// Si necesitas convertir el código a JavaScript para distribuirlo o ejecutarlo en un servidor estándar:
// * **Paso 1 (Compilar):** `npx tsc time.service.ts` (Esto crea el archivo `.js`).
// * **Paso 2 (Correr):** `node time.service.js`
// **Resumen de Comandos:**
// * **`tsc`**: Transpila el código (TS -> JS). Es como "traducir" el archivo.
// * **`ts-node`**: Es un "todo en uno" que traduce y ejecuta en memoria al mismo tiempo.
// * **`node`**: Solo entiende JavaScript, por eso necesita que `tsc` trabaje primero.
// **Nota Importante:** Asegúrate de tener instalado **Node.js** en el sistema antes de empezar. Si el comando `npm` no funciona, descarga Node desde su sitio oficial.


import { TimeService } from './time.service';

const fecha = TimeService.now();
console.log("Hora en Colombia:", fecha.toString());