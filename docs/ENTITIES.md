# Librería de Entidades

## DBClient

Se instancia con `DataSourceOptions` de TypeORM:

```ts
import { DBClient } from 'skorifydata';

const client = new DBClient({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'polla_mundial',
  username: 'postgres',
  password: 'password',
});

await client.connect();
```

Propiedades de servicio disponibles:

| Propiedad | Clase de servicio | Entidad |
|-----------|------------------|---------|
| `users` | `UserService` | User |
| `tournaments` | `TournamentService` | Tournament |
| `teams` | `TeamService` | Team |
| `matches` | `MatchService` | Match |
| `predictions` | `PredictionService` | Prediction |
| `tournamentInstances` | `TournamentInstanceService` | TournamentInstance |
| `userEnrollments` | `UserEnrollmentService` | UserEnrollment |

Métodos del cliente:

| Método | Firma | Descripción |
|--------|-------|-------------|
| `connect` | `() => Promise<void>` | Inicializa el DataSource de TypeORM |
| `disconnect` | `() => Promise<void>` | Destruye el DataSource |
| `getServiceByName` | `(name: string) => BaseDataService` | Obtiene un servicio por nombre en snake_case |

Claves válidas para `getServiceByName`: `users`, `tournaments`, `teams`, `tournament_instances`, `matches`, `predictions`, `user_enrollments`.

## Métodos del servicio base

Todos los servicios extienden `BaseDataService<InternalEntity, DomainEntity>`.

| Método | Firma | Descripción |
|--------|-------|-------------|
| `create` | `(data: Partial<T>) => Promise<T>` | Valida con class-validator e inserta |
| `getById` | `(id: string) => Promise<T \| null>` | Busca una fila por clave primaria |
| `getAll` | `() => Promise<T[]>` | Retorna todas las filas |
| `getByIDs` | `(ids: string[]) => Promise<T[]>` | Búsqueda masiva vía `IN (...)` |
| `modify` | `(id: string, data: Partial<T>) => Promise<T>` | Actualiza y retorna la entidad actualizada |
| `deleteById` | `(id: string) => Promise<void>` | Elimina por clave primaria (hard-delete) |

Hooks del ciclo de vida — ambos son no-op por defecto y se pueden sobreescribir:

| Hook | Comportamiento por defecto | Cuándo sobreescribir |
|------|---------------------------|---------------------|
| `validateData(data)` | Ejecuta class-validator | Reemplazar o extender validación de esquema |
| `validateRules(data)` | No-op | Aplicar reglas de negocio |

Orden de llamada: `validateData` → `validateRules` → escritura.

→ Ver [lib/services/README.md](lib/services/README.md) para documentación completa y ejemplos.

## Entidades

### User — tabla: `users`

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | UUID | PK |
| `name` | string | NOT NULL |
| `is_active` | boolean | DEFAULT true |
| `notification_token` | string | NOT NULL |
| `email` | string | UNIQUE |
| `sub` | string | UNIQUE |
| `image` | string | nullable |
| `role` | enum(general, admin) | DEFAULT general |
| `created_at` | timestamp with timezone | auto-asignado en inserción |
| `updated_at` | timestamp with timezone | nullable, DEFAULT null |
| `deleted_at` | timestamp with timezone | nullable, DEFAULT null |

Servicio: `dbClient.users` — archivo: [lib/services/User.service.ts](lib/services/User.service.ts)
Reglas personalizadas: ninguna

---

### Tournament — tabla: `tournaments`

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | UUID | PK |
| `name` | string | NOT NULL |
| `match_type` | enum(single_match_per_round, home_and_away_per_round) | DEFAULT single_match_per_round |
| `start_date` | date | NOT NULL |
| `end_date` | date | NOT NULL |
| `status` | enum(active, inactive, terminated) | DEFAULT active |
| `token` | string | NOT NULL |
| `created_at` | timestamp with timezone | auto-asignado en inserción |
| `updated_at` | timestamp with timezone | nullable, DEFAULT null |
| `deleted_at` | timestamp with timezone | nullable, DEFAULT null |

Servicio: `dbClient.tournaments` — archivo: [lib/services/Tournament.service.ts](lib/services/Tournament.service.ts)
Reglas personalizadas: ninguna

---

### Team — tabla: `teams`

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | UUID | PK |
| `tournament_id` | UUID | FK → tournaments, CASCADE delete |
| `name` | string | NOT NULL |
| `shield_url` | string | nullable |
| `created_at` | timestamp with timezone | auto-asignado en inserción |
| `updated_at` | timestamp with timezone | nullable, DEFAULT null |
| `deleted_at` | timestamp with timezone | nullable, DEFAULT null |

Servicio: `dbClient.teams` — archivo: [lib/services/Team.service.ts](lib/services/Team.service.ts)
Reglas personalizadas: ninguna

---

### Match — tabla: `matches`

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | UUID | PK |
| `home_team_id` | UUID | FK → teams, CASCADE delete |
| `away_team_id` | UUID | FK → teams, CASCADE delete |
| `tournament_id` | UUID | FK → tournaments, CASCADE delete |
| `kick_off` | timestamp with timezone | NOT NULL |
| `home_score` | integer | nullable |
| `away_score` | integer | nullable |
| `status` | enum(scheduled, in_progress, finished, draft, calculated, cancelled) | DEFAULT scheduled |
| `stage` | enum(group, finals) | DEFAULT group |
| `venue` | string | NOT NULL |
| `created_at` | timestamp with timezone | auto-asignado en inserción |
| `updated_at` | timestamp with timezone | nullable, DEFAULT null |
| `deleted_at` | timestamp with timezone | nullable, DEFAULT null |

Servicio: `dbClient.matches` — archivo: [lib/services/Match.service.ts](lib/services/Match.service.ts)
Reglas personalizadas: ninguna

---

### TournamentInstance — tabla: `tournament_instances`

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | UUID | PK |
| `name` | string | NOT NULL |
| `owner_id` | UUID | FK → users, CASCADE delete |
| `tournament_id` | UUID | FK → tournaments, CASCADE delete |
| `state` | enum(active, inactive, suspended, terminated) | DEFAULT active |
| `invite_code` | string | NOT NULL |
| `created_at` | timestamp with timezone | auto-asignado en inserción |
| `updated_at` | timestamp with timezone | nullable, DEFAULT null |
| `deleted_at` | timestamp with timezone | nullable, DEFAULT null |

Servicio: `dbClient.tournamentInstances` — archivo: [lib/services/TournamentInstance.service.ts](lib/services/TournamentInstance.service.ts)
Reglas personalizadas: ninguna

---

### UserEnrollment — tabla: `user_enrollments`

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users, CASCADE delete; UNIQUE con tournament_instance_id |
| `tournament_instance_id` | UUID | FK → tournament_instances, CASCADE delete; UNIQUE con user_id |
| `tournament_id` | UUID | NOT NULL |
| `last_position` | integer | nullable |
| `current_position` | integer | nullable |
| `current_score` | integer | DEFAULT 0 |
| `exact_hits` | integer | DEFAULT 0 |
| `streak` | integer | DEFAULT 0 |
| `max_streak` | integer | DEFAULT 0 |
| `created_at` | timestamp with timezone | auto-asignado en inserción |
| `updated_at` | timestamp with timezone | nullable, DEFAULT null |
| `deleted_at` | timestamp with timezone | nullable, DEFAULT null |
| `joined_at` | timestamp with timezone | nullable, DEFAULT null |

Servicio: `dbClient.userEnrollments` — archivo: [lib/services/UserEnrollment.service.ts](lib/services/UserEnrollment.service.ts)
Reglas personalizadas: ninguna

---

### Prediction — tabla: `predictions`

| Columna | Tipo | Restricciones |
|---------|------|--------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users, CASCADE delete |
| `user_enrollment_id` | UUID | FK → user_enrollments, CASCADE delete; UNIQUE con match_id |
| `tournament_instance_id` | UUID | FK → tournament_instances, CASCADE delete |
| `match_id` | UUID | FK → matches, CASCADE delete; UNIQUE con user_enrollment_id |
| `home_score` | integer | NOT NULL |
| `away_score` | integer | NOT NULL |
| `earned_points` | integer | DEFAULT 0 |
| `has_exact_result` | boolean | DEFAULT false |
| `created_at` | timestamp with timezone | auto-asignado en inserción |
| `updated_at` | timestamp with timezone | nullable, DEFAULT null |
| `deleted_at` | timestamp with timezone | nullable, DEFAULT null |

Servicio: `dbClient.predictions` — archivo: [lib/services/Prediction.service.ts](lib/services/Prediction.service.ts)
Reglas personalizadas: ninguna
