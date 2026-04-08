# SkorifyData

Migraciones de base de datos para la Polla Mundial.

## Requisitos

- Node.js 24.14.1 (LTS) 
- Docker 28.3.0

## Levantar la base de datos

```bash
docker compose up -d
```

Esto crea un contenedor de PostgreSQL 16 con la base de datos `polla_mundial` en el puerto `5432`.

## Instalar dependencias

```bash
npm install
```

## Migraciones

```bash
# Ejecutar todas las migraciones pendientes
npx knex migrate:latest

# Revertir la última migración
npx knex migrate:rollback

# Ver el estado de las migraciones
npx knex migrate:status

# Crear una nueva migración
npx knex migrate:make nombre_de_migracion
```

## Setup rápido (todo de una)

```bash
npm run setup
```

## Parar la base de datos

```bash
docker compose down
```

