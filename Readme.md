# SkorifyData

Librería de capa de datos e infraestructura serverless en AWS para una plataforma de predicciones deportivas.

## Descripción general

SkorifyData tiene dos responsabilidades:

1. **Librería TypeScript** — `DBClient` que envuelve servicios de entidades para acceso a Postgres, consumida por el backend
2. **Infraestructura AWS CDK** — Workers Lambda que ingestan datos de partidos desde football-data.org y ejecutan el pipeline de puntuación de predicciones

## Inicio rápido

```bash
pnpm run setup    # levanta Postgres + aplica todas las migraciones
pnpm run seed     # carga datos iniciales de referencia
```

→ Ver [docs/DATABASE.md](docs/DATABASE.md) para comandos de migración e historial.

## Modelo Entidad Relación

```mermaid
---
config:
  look: neo
  theme: mc
---
erDiagram
    USER {
        uuid id PK
        string name
        boolean is_active
        string notification_token
        string email
        string sub
        string image
        enum role
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    TEAM {
        uuid id PK
        uuid tournament_id FK
        string name
        string shield_url
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    TOURNAMENT {
        uuid id PK
        string name
        enum match_type
        date start_date
        date end_date
        enum status
        string token
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    TOURNAMENT_INSTANCE {
        uuid id PK
        uuid tournament_id FK
        uuid owner_id FK
        string name
        enum state
        string invite_code
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    USER_ENROLLMENT {
        uuid id PK
        uuid user_id FK
        uuid tournament_instance_id FK
        uuid tournament_id
        integer last_position
        integer current_position
        integer current_score
        integer exact_hits
        integer streak
        integer max_streak
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
        timestamptz joined_at
    }

    MATCH {
        uuid id PK
        uuid tournament_id FK
        uuid home_team_id FK
        uuid away_team_id FK
        timestamptz kick_off
        integer home_score
        integer away_score
        enum status
        enum stage
        string venue
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    PREDICTION {
        uuid id PK
        uuid user_id FK
        uuid user_enrollment_id FK
        uuid tournament_instance_id FK
        uuid match_id FK
        integer home_score
        integer away_score
        integer earned_points
        boolean has_exact_result
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    USER ||--o{ TOURNAMENT_INSTANCE : "owner_id"
    USER ||--o{ USER_ENROLLMENT : "user_id"
    TOURNAMENT ||--o{ TEAM : "tournament_id"
    TOURNAMENT ||--o{ TOURNAMENT_INSTANCE : "tournament_id"
    TOURNAMENT_INSTANCE ||--o{ USER_ENROLLMENT : "tournament_instance_id"
    USER_ENROLLMENT ||--o{ PREDICTION : "user_enrollment_id"
    TOURNAMENT ||--o{ MATCH : "tournament_id"
    TEAM ||--o{ MATCH : "home_away_team_id"
    MATCH ||--o{ PREDICTION : "match_id"
```

![Diagrama ER](docs/SkorifyDB.png)

→ Ver [docs/ENTITIES.md](docs/ENTITIES.md) para campos de entidades y API de servicios.

## Entidades expuestas como servicios

La librería expone cada entidad como un servicio que extiende `BaseDataService<T>` (ver [lib/services/README.md](lib/services/README.md) para el detalle de la API base y cómo crear uno nuevo).

| Entidad | Archivo de entidad | Servicio | Estado |
|---------|-------------------|---------|--------|
| User | [entities/User.ts](entities/User.ts) | [lib/services/User.service.ts](lib/services/User.service.ts) | Disponible |
| Tournament | [entities/Tournament.ts](entities/Tournament.ts) | [lib/services/Tournament.service.ts](lib/services/Tournament.service.ts) | Disponible |
| Team | [entities/Team.ts](entities/Team.ts) | [lib/services/Team.service.ts](lib/services/Team.service.ts) | Disponible |
| Match | [entities/Match.ts](entities/Match.ts) | [lib/services/Match.service.ts](lib/services/Match.service.ts) | Disponible |
| TournamentInstance | [entities/TournamentInstance.ts](entities/TournamentInstance.ts) | [lib/services/TournamentInstance.service.ts](lib/services/TournamentInstance.service.ts) | Disponible |
| UserEnrollment | [entities/UserEnrollment.ts](entities/UserEnrollment.ts) | [lib/services/UserEnrollment.service.ts](lib/services/UserEnrollment.service.ts) | Disponible |
| Prediction | [entities/Prediction.ts](entities/Prediction.ts) | [lib/services/Prediction.service.ts](lib/services/Prediction.service.ts) | Disponible |

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm run db:up` | Inicia el contenedor PostgreSQL |
| `pnpm run db:down` | Detiene y elimina los contenedores |
| `pnpm run migrate` | Aplica todas las migraciones pendientes |
| `pnpm run status` | Muestra migraciones aplicadas / pendientes |
| `pnpm run rollback` | Revierte el último lote de migraciones |
| `pnpm run setup` | Configuración completa: db:up + migrate |
| `pnpm run seed` | Carga datos iniciales de referencia |
| `pnpm run build` | Compila la librería TypeScript a `/dist` |

## Pipeline ETL / Ingesta

Los datos de partidos se ingestan desde football-data.org mediante dos sub-flujos en el `MatchProcessingStack`:

- **CreateMatchesFlow** — flujo Step Functions de configuración única para cargar partidos de una competencia
- **MatchProcessingFlow** — scheduler de EventBridge que corre cada 5 minutos para detectar partidos finalizados y disparar el pipeline de puntuación

→ Ver [docs/ETL.md](docs/ETL.md) para diagramas del flujo ETL y contratos del backend.

## Requisitos

- Node.js 24 LTS
- Docker 28+, Docker Compose v2
- pnpm 10

## En caso de romperlo todo

```bash
docker compose down -v && pnpm run setup
```

## Instalar la librería desde GitHub

```bash
pnpm add "git+ssh://git@github.com/<org>/<repo>.git#<tag-o-sha>"
```

Esta librería compila el código TypeScript durante el empaquetado (`prepack`), por lo que no es necesario versionar `dist` en el repositorio. Siempre fijar a un tag o commit SHA en producción.
