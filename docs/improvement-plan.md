# Plan de mejoras — Skorify Data ETL

> Generado: 2026-06-02  
> Rama base: `feature/create-via-endpoint`

---

## Criterios de priorización

| Prioridad | Criterio |
|-----------|----------|
| 🔴 Crítico | Rompe funcionalidad existente o representa riesgo de seguridad inmediato |
| 🟠 Alto | Degradación silenciosa, datos incorrectos o brecha de seguridad latente |
| 🟡 Medio | Resiliencia o corrección funcional que puede fallar bajo carga o en producción |
| 🟢 Bajo | Calidad de código, convenciones, deuda técnica menor |

---

## Fase 1 — Crítico (atacar primero)

### 1.1 Bug: `sendEvents` vacía `mappedMatches` antes del marcado en DDB

- **Archivo:** `infra/lambdas/etl-process/worker.ts`
- **Impacto:** El mecanismo anti-re-procesamiento queda completamente inoperante. Ningún partido se marca como `"Processing"` porque `sendEvents` consume el array con `splice` antes de que `Promise.allSettled` lo itere. Cada ejecución del worker re-enviará los mismos partidos al backend indefinidamente.
- **Solución:** Guardar una copia del array antes de llamar a `sendEvents`, o refactorizar `sendEvents` para no mutar su argumento.

- [ ] Clonar `mappedMatches` antes de pasarlo a `sendEvents`:
  ```typescript
  await sendEvents([...mappedMatches]);
  ```
  o reemplazar `splice` en `sendEvents` por `slice` + índice.
- [ ] Verificar con un test manual que los partidos quedan efectivamente con `status: "Processing"` en DDB tras la ejecución.

---

## Fase 2 — Seguridad

### 2.1 `FOOTBALL_DATA_API_TOKEN` expuesto como variable de entorno de Lambda

- **Archivo:** `infra/lib/match-processing-stack.ts`
- **Impacto:** El token es visible en texto plano para cualquier usuario o rol de AWS con permisos de lectura en Lambda (ej. `lambda:GetFunctionConfiguration`). Una rotación del token requiere un redeploy completo.
- **Solución:** Migrar a AWS Secrets Manager. La Lambda lee el secreto en runtime mediante el SDK, evitando la exposición.

- [ ] Crear un secreto en Secrets Manager (manual o via CDK) con el token.
- [ ] En el CDK, referenciar el secreto con `Secret.fromSecretsManager` y otorgar `secretsmanager:GetSecretValue` a `workerLambda` y `GetMatchesByCompetitionLambda`.
- [ ] Actualizar `httpClient.ts` para leer el token desde Secrets Manager al inicializar (una vez por ejecución, no por request).
- [ ] Eliminar `addEnvironment("FOOTBALL_DATA_API_TOKEN", ...)` del stack.

### 2.2 Variables de Cognito ausentes en el stack para las lambdas del ETL

- **Archivo:** `infra/lib/match-processing-stack.ts`
- **Impacto:** `finishMatchLambda`, `notifyUsersLambda` y `calculateRankingLambda` usan `backend-client.ts`, que requiere `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET` y `COGNITO_DOMAIN`. Al no estar configuradas, cualquier llamada al backend lanza un error en runtime que pasa desapercibido hasta el primer partido procesado en producción.
- **Solución:** Añadir las tres variables de entorno a cada lambda en el CDK. Las credenciales de Cognito deben venir de Secrets Manager (ver 2.1).

- [ ] Añadir `COGNITO_CLIENT_ID`, `COGNITO_DOMAIN` como env vars (no sensibles, pueden ir como `addEnvironment`).
- [ ] Añadir `COGNITO_CLIENT_SECRET` desde Secrets Manager (mismo patrón que 2.1).
- [ ] Aplicar a las tres lambdas: `finishMatchLambda`, `notifyUsersLambda`, `calculateRankingLambda`.
- [ ] Verificar con un deploy en dev que el flujo completo autentique correctamente.

---

## Fase 3 — Resiliencia

### 3.1 `retry.ts` reintenta errores 4xx

- **Archivo:** `infra/utils/retry.ts` / `infra/utils/backend-client.ts`
- **Impacto:** Un error 400 (payload inválido) o 404 (match no encontrado) se reintenta 3 veces con backoff. Consume tiempo de Lambda innecesariamente y puede agotar el `maxAttempts` antes de llegar a un error real reintentable (5xx / red). Además, introduce latencia artificial en el procesamiento.
- **Solución:** En `withRetry`, permitir que el caller indique qué errores son reintentables, o chequear en `backend-client.ts` si el error es `BackendClientError` con status 4xx y no reintentarlo.

- [ ] Añadir una opción `shouldRetry?: (error: unknown) => boolean` a `RetryOptions`.
- [ ] En `BackendClient.request`, pasar `shouldRetry: (e) => !(e instanceof BackendClientError && e.statusCode < 500)`.
- [ ] Verificar que `RetryExhaustedError` sigue propagándose correctamente hacia los handlers SQS.

### 3.2 `httpClient.ts` no verifica `response.ok`

- **Archivo:** `infra/utils/httpClient.ts`
- **Impacto:** Si la Football Data API devuelve un 4xx o 5xx, la respuesta se parsea como JSON y se retorna como data válida. El worker procesa silenciosamente una respuesta de error como si fuera una lista de partidos, potencialmente con cero partidos o estructura incorrecta.
- **Solución:** Verificar `response.ok` y lanzar un error descriptivo si es falso.

- [ ] Añadir check `if (!response.ok) throw new Error(...)` con el status code y body en `getRequest`.
- [ ] Incluir el status HTTP en el mensaje de error para facilitar el debugging en CloudWatch.

### 3.3 `DDBClient.getItems` ignora `UnprocessedKeys`

- **Archivo:** `infra/utils/ddbClient.ts`
- **Impacto:** DynamoDB puede devolver `UnprocessedKeys` cuando hay throttling. El cliente los ignora silenciosamente, retornando un resultado incompleto. El worker construirá un `matchMap` parcial y filtrará partidos válidos como si no existieran en DDB.
- **Solución:** Implementar un loop que reintente los `UnprocessedKeys` con backoff hasta que estén vacíos.

- [ ] Tras cada `BatchGetCommand`, chequear `response.UnprocessedKeys`.
- [ ] Si hay `UnprocessedKeys`, reencolarlos y reintentar con delay exponencial.
- [ ] Añadir un límite de reintentos para evitar loops infinitos.

### 3.4 Visibility timeout insuficiente en las colas SQS

- **Archivo:** `infra/lib/constants.ts`
- **Impacto:** Con `visibilityTimeout: 90s` y Lambda timeout de 30s, el ratio es 3×. AWS recomienda mínimo 6× para evitar que un mensaje vuelva a ser visible mientras la Lambda aún lo está procesando (causando procesamiento duplicado). Con `batchSize: 5` el riesgo aumenta.
- **Solución:** Aumentar `visibilityTimeout` a `Duration.seconds(180)` (6× el timeout de la Lambda).

- [ ] Cambiar `QUEUE_DEFAULTS.visibilityTimeout` de 90s a 180s en `constants.ts`.
- [ ] Verificar que el cambio aplica a las tres colas (`finishMatchQueue`, `notifyUserQueue`, `calculateRankingQueue`).

### 3.5 Sin jitter en el backoff de reintentos

- **Archivo:** `infra/utils/retry.ts`
- **Impacto:** Con múltiples Lambda instances fallando al mismo tiempo (ej. backend caído), todas reintentarán en exactamente los mismos instantes. Esto puede saturar el backend justo cuando se recupera, creando un thundering herd.
- **Solución:** Añadir jitter aleatorio al delay (`delay * (0.5 + Math.random() * 0.5)`).

- [ ] Modificar el cálculo de `delay` en `retry.ts` para incluir jitter.
- [ ] Mantener el delay base y máximo para que el jitter no extienda indefinidamente el tiempo de espera.

---

## Fase 4 — Corrección funcional

### 4.1 Competition ID `"WC"` hardcodeado en el worker

- **Archivo:** `infra/lambdas/etl-process/worker.ts`
- **Impacto:** El sistema solo procesa una competencia fija. Para soportar múltiples competencias (Liga, Champions, etc.) se requiere un cambio de código y redeploy.
- **Solución:** Leer los IDs de competencia desde una env var (lista separada por comas) o una tabla DDB de configuración.

- [ ] Definir env var `COMPETITION_IDS` en el CDK (ej. `"WC,PL,CL"`).
- [ ] En `worker.ts`, parsear la lista y ejecutar `getFinishedMatchesByCompetition` por cada ID (en paralelo con `Promise.all`).
- [ ] Actualizar `mapExternalIds` y `syncExternalIdsWithDB` para manejar resultados de múltiples competencias.

### 4.2 VPC name hardcodeado en el stack

- **Archivo:** `infra/lib/match-processing-stack.ts`
- **Impacto:** El stack solo desplegará correctamente en el entorno dev. En staging o producción fallará al resolver la VPC.
- **Solución:** Descomentar el lookup por SSM que ya existe en el código.

- [ ] Descomentar el bloque `ssm.StringParameter.valueFromLookup` para `vpcName`.
- [ ] Eliminar la línea hardcodeada `const vpcName = "skorify-dev-vpc"`.
- [ ] Verificar que el parámetro SSM existe en todos los entornos objetivo.

### 4.3 Log final del worker usa `matchIds` en lugar de los partidos enviados

- **Archivo:** `infra/lambdas/etl-process/worker.ts`
- **Impacto:** El log `"Evento publicado para los partidos..."` lista todos los partidos FINISHED de la API, no los que realmente pasaron el filtro de mapeo y se enviaron. Genera confusión al debuggear.
- **Solución:** Loguear los IDs de `mappedMatches`.

- [ ] Reemplazar `matchIds.join(", ")` por `mappedMatches.map(m => m.fdMatchId).join(", ")` en el `console.log` final.

---

## Fase 5 — Calidad de código

### 5.1 `DDBClient.getItems` muta el array de entrada

- **Archivo:** `infra/utils/ddbClient.ts`
- **Impacto:** Efecto secundario inesperado: el array del caller queda vacío tras llamar a `getItems`. Puede causar bugs difíciles de rastrear si el array se reutiliza después.
- **Solución:** Trabajar sobre una copia interna del array.

- [ ] Reemplazar `keys.splice(0, 100)` por `keys.slice(i, i + 100)` con un índice, o clonar el array al inicio del método.

### 5.2 `props: any` en `SharedResources`

- **Archivo:** `infra/lib/constructs/shared-resources.ts`
- **Impacto:** Pérdida de type-safety en el construct. Errores de configuración no se detectan en compilación.
- **Solución:** Definir una interfaz `SharedResourcesProps`.

- [ ] Crear `interface SharedResourcesProps { envName: string }`.
- [ ] Reemplazar `props: any` por `props: SharedResourcesProps` en el constructor.

### 5.3 Nombre de clase `createMatchesFlow` no sigue PascalCase

- **Archivo:** `infra/lib/constructs/createMatchesFlow.ts`
- **Impacto:** Rompe la convención de TypeScript y CDK. Inconsistente con el resto de constructs del proyecto.
- **Solución:** Renombrar a `CreateMatchesFlow`.

- [ ] Renombrar la clase a `CreateMatchesFlow`.
- [ ] Actualizar la importación en `match-processing-stack.ts`.
- [ ] Renombrar el archivo a `CreateMatchesFlow.ts` para consistencia.

### 5.4 Filtro redundante en `worker.ts`

- **Archivo:** `infra/lambdas/etl-process/worker.ts`
- **Impacto:** Código muerto. La API ya filtra por `?status=FINISHED`, el `.filter()` posterior no agrega valor y puede inducir a pensar que la API puede devolver partidos no finalizados.
- **Solución:** Eliminar el filtro o documentar explícitamente si hay una razón para mantenerlo.

- [ ] Eliminar la línea `const finishedMatches = matches.filter(...)` y usar `matches` directamente, o renombrar para claridad.

---

## Fase 6 — Unit Tests

> Stack sugerido: **Vitest** (compatible con el toolchain Node 22 existente, sin configuración extra) + **@aws-sdk/client-dynamodb** mocked con `vi.mock`. No se requiere infraestructura real para ninguno de estos tests.

### 6.1 `retry.ts`

- **Por qué:** Es la utilidad transversal más crítica. Un bug aquí afecta todos los llamados al backend.

- [ ] **Reintenta el número correcto de veces:** dado `maxAttempts: 3`, verifica que la función se llama exactamente 3 veces antes de lanzar `RetryExhaustedError`.
- [ ] **Lanza `RetryExhaustedError` al agotar intentos:** verifica `error.attempts === maxAttempts` y `error.lastError` contiene el error original.
- [ ] **No reintenta si la primera llamada tiene éxito:** verifica que la función se llama una sola vez.
- [ ] **Backoff exponencial:** verifica que el delay entre intentos crece correctamente (`baseDelay * 2^n`). Mockear `setTimeout`.
- [ ] **Llama `onRetry` en cada fallo:** verifica que el callback recibe el error y el número de intento correcto.

### 6.2 `ddbClient.ts`

- **Por qué:** Es el punto central de lectura/escritura del estado de procesamiento. Bugs aquí rompen el mecanismo anti-re-procesamiento.

- [ ] **`getItems` no muta el array de entrada:** pasar un array de 5 elementos, verificar que sigue teniendo 5 tras la llamada.
- [ ] **`getItems` pagina correctamente en lotes de 100:** con 250 claves, verifica que se hacen 3 llamadas a `BatchGetCommand`.
- [ ] **`getItems` retorna todos los items de todas las páginas:** verificar que los resultados de cada batch se concatenan correctamente.
- [ ] **`put` llama a `PutCommand` con la tabla y el item correctos.**
- [ ] **Constructor lanza error si la env var no está definida:** `new DDBClient("TABLA_INEXISTENTE")` debe lanzar.

### 6.3 `httpClient.ts`

- **Por qué:** Es el único punto de contacto con la Football Data API. Un fallo silencioso aquí propaga datos incorrectos a todo el pipeline.

- [ ] **Lanza error cuando `response.ok` es `false`:** simular una respuesta 429 o 500 y verificar que se lanza con el status code.
- [ ] **Retorna el JSON parseado en respuesta exitosa.**
- [ ] **Lanza error si `FOOTBALL_DATA_API_TOKEN` no está configurado:** verificar el mensaje de error.
- [ ] **Incluye el header `X-Auth-Token` en el request.**

### 6.4 `footballDataClient.ts`

- **Por qué:** El cálculo de fechas fue corregido en esta sesión; un test lo protege de regresiones.

- [ ] **`dateFrom` es `daysAgo` días antes de hoy en formato `yyyy-MM-dd`.**
- [ ] **`dateTo` es la fecha de hoy en formato `yyyy-MM-dd`.**
- [ ] **Ambas fechas aparecen en la URL generada cuando `daysAgo` no es `null`.**
- [ ] **No se añaden parámetros de fecha cuando `daysAgo` es `null`.**
- [ ] **La URL incluye `?status=FINISHED`.**

### 6.5 `backend-client.ts`

- **Por qué:** Gestiona autenticación M2M y reintentos. Bugs aquí bloquean todo el procesamiento.

- [ ] **Reutiliza el token cacheado si no ha expirado:** verificar que el endpoint de Cognito se llama solo una vez en dos requests consecutivos.
- [ ] **Refresca el token cuando ha expirado:** avanzar el reloj (mockear `Date.now`) y verificar que se hace un nuevo request a Cognito.
- [ ] **No reintenta errores 4xx** (pendiente de implementar en fase 3.1): un 400 debe fallar inmediatamente sin reintentos.
- [ ] **Reintenta errores 5xx:** un 503 debe reintentarse hasta `maxAttempts`.
- [ ] **`processMatch` hace POST a `/matches/:id/process` con el body correcto.**
- [ ] **`calculateTournamentInstanceRanking` hace POST a la URL correcta.**

### 6.6 `worker.ts` (handler)

- **Por qué:** Es el orquestador principal del ETL. Concentra la lógica de filtrado, mapeo y dispatch.

- [ ] **No envía eventos cuando no hay partidos finalizados:** verificar que `sendEvents` no se llama si `finishedMatches.length === 0`.
- [ ] **Excluye partidos con `status: "Finished"` del envío:** mockear `getItems` retornando un partido con ese status y verificar que no llega a `PutEventsCommand`.
- [ ] **Excluye partidos con `status: "Processing"` del envío:** ídem para el status intermedio.
- [ ] **Excluye partidos sin mapeo en DDB** (match_id null): verificar el filtro de `mappedMatches`.
- [ ] **`sendEvents` no muta `mappedMatches`** (regresión del bug 1.1): verificar que tras el envío el array mantiene sus elementos para el marcado en DDB.
- [ ] **Marca como `"Processing"` solo los partidos efectivamente enviados.**
- [ ] **Un fallo en `ddb.put` de "Processing" no aborta los demás** (`allSettled`): simular un fallo en uno y verificar que los otros se intentan.

### 6.7 `finish-match.ts` (handler)

- **Por qué:** Es el punto donde se cierra definitivamente un partido. Un error aquí puede causar doble procesamiento o cierres incorrectos.

- [ ] **Retorna `batchItemFailures` vacío cuando todos los records se procesan correctamente.**
- [ ] **Un record no parseable se incluye en `batchItemFailures` y no aborta los demás.**
- [ ] **Si `backend.processMatch` falla, el partido NO se cierra en DDB** (`ddb.put` no se llama) y el `messageId` va a `batchItemFailures`.
- [ ] **Si `ddb.put` falla tras éxito del backend, el `messageId` va a `batchItemFailures`.**
- [ ] **En un batch de 3 records, un fallo en el segundo no impide procesar el tercero.**
- [ ] **El record exitoso NO aparece en `batchItemFailures`.**

### 6.8 `notify-users.ts` y `calculate-ranking.ts` (handlers)

- **Por qué:** Mismo patrón que `finish-match.ts`; los tests garantizan consistencia entre los tres handlers.

- [ ] **Record no parseable va a `batchItemFailures` en ambos handlers.**
- [ ] **Fallo en `backend.notifyUsers` va a `batchItemFailures` sin afectar otros records.**
- [ ] **Fallo en `backend.calculateTournamentInstanceRanking` ídem.**
- [ ] **Handler exitoso retorna `{ batchItemFailures: [] }`.**

---

## Resumen ejecutivo

| # | Mejora | Prioridad | Esfuerzo estimado |
|---|--------|-----------|-------------------|
| 1.1 | Bug `sendEvents` muta `mappedMatches` | 🔴 Crítico | 30 min |
| 2.1 | Token Football Data en Secrets Manager | 🟠 Alto | 2 h |
| 2.2 | Variables Cognito ausentes en lambdas | 🟠 Alto | 1 h |
| 3.1 | No reintentar errores 4xx | 🟡 Medio | 1 h |
| 3.2 | `httpClient` sin check `response.ok` | 🟡 Medio | 30 min |
| 3.3 | `DDBClient` ignora `UnprocessedKeys` | 🟡 Medio | 1.5 h |
| 3.4 | Visibility timeout insuficiente (90s → 180s) | 🟡 Medio | 15 min |
| 3.5 | Sin jitter en backoff | 🟡 Medio | 30 min |
| 4.1 | Competition ID hardcodeado | 🟡 Medio | 2 h |
| 4.2 | VPC name hardcodeado | 🟡 Medio | 15 min |
| 4.3 | Log final con IDs incorrectos | 🟢 Bajo | 10 min |
| 5.1 | `getItems` muta array de entrada | 🟢 Bajo | 20 min |
| 5.2 | `props: any` en `SharedResources` | 🟢 Bajo | 20 min |
| 5.3 | Clase `createMatchesFlow` sin PascalCase | 🟢 Bajo | 30 min |
| 5.4 | Filtro redundante en worker | 🟢 Bajo | 10 min |
