# Base de Datos

## Configuración local

PostgreSQL local corre en Docker via `docker-compose.yml` (imagen `postgres:17.3-alpine`):

| Parámetro | Valor por defecto | Variable de entorno |
|-----------|------------------|---------------------|
| Host | `localhost` | `DB_HOST` |
| Puerto | `5432` | `DB_PORT` |
| Base de datos | `polla_mundial` | `DB_NAME` |
| Usuario | `postgres` | `DB_USER` |
| Contraseña | `password` | `DB_PASSWORD` |
| Nombre del contenedor | `skorify_db` | — |

Iniciar la base de datos:

```bash
pnpm run db:up
```

## Ejecutar migraciones

Las migraciones se gestionan con Knex 3.x. El servicio `knex` en `docker-compose.yml` (perfil `tools`) ejecuta `npm install && npx knex $KNEX_COMMAND` dentro de un contenedor `node:24-alpine`. Todos los scripts de migración lo invocan a través de ese contenedor:

```bash
pnpm run migrate   # equivalente: docker compose run --rm --no-deps -e KNEX_COMMAND=migrate:latest knex
```

El estado de las migraciones se rastrea en la tabla `knex_migrations`. Los archivos de migración están en `./migrations/`.

## Historial de migraciones

| Archivo | Descripción | Notas |
|---------|-------------|-------|
| `20260517000000_initial_setup.js` | Esquema inicial — crea todas las tablas del núcleo | Primera migración |
| `20260520000000_schema_updates.js` | Actualizaciones al esquema tras la revisión inicial | Ajustes post-diseño |
| `20260530155609_include_user_sub.js` | Agrega columna `sub` a usuarios | Sujeto de identidad de Cognito |
| `20260603000521_include_status_field.js` | Agrega campo `status` a torneos | Seguimiento activo / inactivo / terminado |
| `20260604034433_include_match_state.js` | Agrega campos `stage` y `status` a partidos | Columnas para la máquina de estado del partido |

## Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `db:up` | `docker compose up -d --wait postgres` | Inicia PostgreSQL y espera a que esté sano |
| `db:down` | `docker compose down` | Detiene y elimina los contenedores |
| `migrate` | `docker compose run … knex migrate:latest` | Aplica todas las migraciones pendientes |
| `status` | `docker compose run … knex migrate:status` | Muestra migraciones aplicadas / pendientes |
| `rollback` | `docker compose run … knex migrate:rollback` | Revierte el último lote de migraciones |
| `setup` | `pnpm run db:up && pnpm run migrate` | Configuración completa desde cero |
| `seed` | `node seeders/initial_seed.js` | Carga datos iniciales de referencia |
| `verify` | alias de `status` | Verificación rápida del estado de migraciones |
| `build` | `tsc -p tsconfig.json` | Compila la librería TypeScript a `/dist` |

## Reiniciar todo

```bash
docker compose down -v && pnpm run setup
```
