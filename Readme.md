# SkorifyData

Migraciones de base de datos para la Polla Mundial usando Knex + PostgreSQL en Docker

## Modelo Entidad Relacion

![Diagrama ER](docs/SkorifyDB.png)


## Codigo Mermeid del modelo
---
config:
  look: neo
  theme: mc
---
erDiagram
    USER {
        uuid id PK
        string name
        string email
        string avatar_url
        date created_at
        date updated_at
        date deleted_at
    }

    TEAM {
        uuid id PK
        uuid tournament_id FK
        string name
        string shield_url
        date created_at
        date deleted_at
        date updated_at
    }

    TOURNAMENT {
        uuid id PK
        string name
        date start_date
        date end_date
        string token
        date created_at
        date updated_at
        date deleted_at
    }

    TOURNAMENT_INSTANCE {
        uuid id PK
        uuid tournament_id FK
        uuid owner_id FK
        string name
        TournamentState state
        date created_at
        date deleted_at
        date updated_at
    }

    USER_ENROLLMENT {
        uuid id PK
        uuid user_id FK
        uuid instance_id FK
        date joined_at
        number last_position
        number current_position
        number current_score
        number streak
    }

    MATCH {
        uuid id PK
        uuid tournament_id FK
        uuid home_team_id FK
        uuid away_team_id FK
        date kick_off
        number home_score
        number away_score
        MatchStatus status
        MatchStage stage
        date created_at
        date updated_at
        date deleted_at
    }

    PREDICTION {
        uuid id PK
        uuid match_id FK
        uuid enrollment_id FK
        number home_score
        number away_score
        number earned_points
        date created_at
        date updated_at
        date deleted_at
        bool has_exact_result
    }

    %% Relaciones
    USER ||--o{ TOURNAMENT_INSTANCE : "owner_id"
    USER ||--o{ USER_ENROLLMENT : "user_id"
    TOURNAMENT ||--o{ TEAM : "tournament_id"
    TOURNAMENT ||--o{ TOURNAMENT_INSTANCE : "tournament_id"
    TOURNAMENT_INSTANCE ||--o{ USER_ENROLLMENT : "instance_id"
    USER_ENROLLMENT ||--o{ PREDICTION : "enrollment_id"
    TOURNAMENT ||--o{ MATCH : "tournament_id"
    TEAM ||--o{ MATCH : "home_away_team_id"
    MATCH ||--o{ PREDICTION : "match_id"
## Requisitos

- Node.js 24.14.1 (LTS)
- Docker 28.3.0+
- Docker Compose v2

## Funcionamiento

Este proyecto tiene 2 piezas:

1. **PostgreSQL** (contenedor postgres)
    - Guarda los datos
    - Se levanta con Docker
2. **Knex** (contenedor knex)
    - Ejecuta migraciones
    - Crea las tablas en la base de datos

```
Levantas PostgreSQL → Espera a estar listo → Ejecutas Knex → Se crean tablas
```

## Onboarding de equipo (paso a paso)

1. Instalar dependencias de Node (opcional si usaras solo migraciones dockerizadas):

```bash
npm ci
```

2. Crear entorno local y completar con los siguientes datos:

```bash
DB_HOST=postgres
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
```
## Forma corta
```bash
    docker compose up -d
    npx knex migrate:up
    npm run seed
```

3. Levantar PostgreSQL:

```bash
npm run db:up
```
Esto hace:
- Crea contenedor skorify_db
- Expone puerto 5432
- Espera a que la DB esté lista (healthcheck)

4. Aplicar migraciones:

```bash
npm run migrate
```
Esto hace:
- Levanta contenedor temporal knex
- Ejecuta:

```bash
npx knex migrate:latest
```
- Para crear todas las tablas

## Verificar que TODO funciona

```bash
docker exec -it skorify_db psql -U postgres -d polla_mundial -c "\dt"
```
Si todo sale bien, verás las tablas en tu pestaña de logs

## Scripts disponibles

``` bash
# Levanta SOLO PostgreSQL
npm run db:up

# Elimina contenedores y red
npm run db:down

# Ejecuta migraciones (crea tablas)
npm run migrate

# Ver estado de migraciones
npm run status

# Revierte última migración
npm run rollback

# Flujo completo (lo que deberías usar)
npm run setup

# Alias de status
npm run verify
```

## Instalar la librería desde GitHub

Si quieres consumir esta librería en otro proyecto TypeScript sin publicarla a npm, puedes instalarla directo desde el repositorio.

1. Requisito: usar una referencia estable (tag o commit SHA) para evitar cambios inesperados.

2. Instalar con `pnpm`:

```bash
pnpm add "git+https://github.com/<org>/<repo>.git#<tag-o-sha>"
```

Ejemplo:

```bash
pnpm add "git+https://github.com/skorify/skorify-data.git#v1.0.0"
```

3. Si el repositorio es privado, usa SSH:

```bash
pnpm add "git+ssh://git@github.com/<org>/<repo>.git#<tag-o-sha>"
```

Notas importantes:
- Esta librería compila el código TypeScript durante el empaquetado (`prepack`), por lo que no necesitas versionar `dist` en el repositorio.
- Para producción, fija siempre una versión (`tag`) o un commit SHA en lugar de `main`.

## En caso de romperlo todo
```bash
docker compose down -v
npm run setup
```
Esto:
- Borra base de datos
- Borra volúmenes
- Crea todo desde cero
