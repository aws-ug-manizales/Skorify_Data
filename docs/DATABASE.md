# Documentación del Modelo Relacional – Sistema de Apuestas

## 1. Descripción General

El sistema modela una plataforma de apuestas deportivas basada en torneos de fútbol. Los usuarios se unen a instancias (pollas) dentro de un torneo y realizan predicciones sobre partidos, acumulando puntos según su precisión. El sistema incluye organización de equipos por torneo y grupos y un ranking (user_enrollments).

---
## 2. Entidades y Atributos

### USER
Representa a los usuarios del sistema.

**Atributos:**
- `id` (PK, uuid): Identificador único
- `name` (string): Nombre del usuario
- `email` (string): Correo electrónico (único)
- `avatar_url` (string): Imagen de perfil
- `role` (enum): Rol del usuario (`general` | `admin`)
- `created_at` (date): Fecha de creación
- `updated_at` (date): Fecha de actualización
- `deleted_at` (date): Fecha de eliminación lógica

---

### TOURNAMENT
Representa torneos en los que se realizan apuestas.

**Atributos:**
- `id` (PK, uuid): Identificador único
- `name` (string): Nombre del torneo
- `token` (string): Token de acceso al torneo
- `start_date` (date): Fecha de inicio
- `end_date` (date): Fecha de finalización
- `created_at` (date): Fecha de creación

---

### TEAM
Equipos de fútbol asociados a un torneo.

**Atributos:**
- `id` (PK, uuid): Identificador único
- `tournament_id` (FK → TOURNAMENT): Torneo al que pertenece el equipo
- `name` (string): Nombre del equipo
- `shield_url` (string): URL del escudo del equipo
- `created_at` (date): Fecha de creación
- `updated_at` (date): Fecha de actualización
- `deleted_at` (date): Fecha de eliminación lógica

---

### TOURNAMENT_INSTANCE
Representa una polla o pool dentro de un torneo, creada por un usuario.

**Atributos:**
- `id` (PK, uuid): Identificador único
- `tournament_id` (FK → TOURNAMENT): Torneo al que pertenece
- `owner_user_id` (FK → USER): Usuario creador de la instancia
- `name` (string): Nombre de la instancia
- `state` (TournamentState): Estado de la instancia (`approved` | `pending` | `denied`)
- `created_at` (date): Fecha de creación
- `updated_at` (date): Fecha de actualización
- `deleted_at` (date): Fecha de eliminación lógica

---

### USER_ENROLLMENT
Representa la inscripción de un usuario en una instancia (polla), incluyendo su ranking y puntaje.

**Atributos:**
- `id` (PK, uuid): Identificador único
- `player_id` (FK → USER): Usuario inscrito
- `tournament_instance_id` (FK → TOURNAMENT_INSTANCE): Instancia a la que pertenece
- `last_position` (number): Posición anterior en el ranking
- `current_position` (number): Posición actual en el ranking
- `current_score` (number): Puntaje acumulado actual
- `exact_hits` (number): Total de predicciones con marcador exacto
- `streak` (number): Racha activa del usuario
- `created_at` (date): Fecha de creación
- `updated_at` (date): Fecha de actualización
- `joined_at` (date): Fecha en que se unió

---

### MATCH
Partidos disputados entre equipos dentro de un torneo.

**Atributos:**
- `id` (PK, uuid): Identificador único
- `tournament_id` (FK → TOURNAMENT): Torneo al que pertenece
- `home_team_id` (FK → TEAM): Equipo local
- `away_team_id` (FK → TEAM): Equipo visitante
- `kick_off` (date): Fecha y hora del partido
- `home_score` (number): Goles del equipo local
- `away_score` (number): Goles del equipo visitante
- `status` (MatchStatus): Estado del partido (`scheduled` | `in_progress` | `finished` | `draft`)
- `stage` (MatchStage): Etapa del partido (`group` | `finals`)
- `created_at` (date): Fecha de creación
- `updated_at` (date): Fecha de actualización

---

### PREDICTION
Predicciones realizadas por un usuario inscrito sobre el resultado de un partido.

**Atributos:**
- `id` (PK, uuid): Identificador único
- `user_enrollment_id` (FK → USER_ENROLLMENT): Inscripción del usuario que predice
- `match_id` (FK → MATCH): Partido al que corresponde la predicción
- `pred_home_goals` (number): Predicción de goles del equipo local
- `pred_away_goals` (number): Predicción de goles del equipo visitante
- `earned_points` (number): Puntos obtenidos por la predicción
- `has_exact_result` (bool): Indica si el usuario acertó el marcador exacto
- `created_at` (date): Fecha de creación
- `updated_at` (date): Fecha de actualización
- `deleted_at` (date): Fecha de eliminación lógica

---

## 3. Relaciones y Cardinalidades

### TOURNAMENT → TEAM
- Tipo: 1:N
- Un torneo tiene muchos equipos directamente asociados
- Cada equipo pertenece a un único torneo

---

### TOURNAMENT → TOURNAMENT_INSTANCE
- Tipo: 1:N
- Un torneo puede tener muchas instancias (pollas)
- Cada instancia pertenece a un único torneo

---

### USER → TOURNAMENT_INSTANCE (owner)
- Tipo: 1:N
- Un usuario puede ser dueño de muchas instancias

---

### TOURNAMENT_INSTANCE → USER_ENROLLMENT
- Tipo: 1:N
- Una instancia tiene muchos usuarios inscritos
- Cada inscripción pertenece a una única instancia

---

### USER → USER_ENROLLMENT
- Tipo: 1:N
- Un usuario puede estar inscrito en muchas instancias

---

### TOURNAMENT → MATCH
- Tipo: 1:N
- Un torneo contiene múltiples partidos
- Cada partido pertenece a un único torneo

---

### TEAM → MATCH
- Tipo: 1:N (doble relación)
- Un equipo puede ser local o visitante en muchos partidos
- Cada partido tiene un equipo local (`home_team_id`) y uno visitante (`away_team_id`)

---

### MATCH → PREDICTION
- Tipo: 1:N
- Un partido puede tener muchas predicciones asociadas
- Cada predicción corresponde a un único partido

---

### USER_ENROLLMENT → PREDICTION
- Tipo: 1:N
- Un usuario inscrito puede realizar muchas predicciones
- Cada predicción pertenece a una única inscripción

---

## 4. Reglas de Negocio Implícitas

- Un usuario debe estar inscrito en una instancia (`USER_ENROLLMENT`) para poder hacer predicciones
- Un usuario inscrito solo puede predecir una vez por partido (constraint `UNIQUE` en `user_enrollment_id` + `match_id`)
- Una instancia debe estar aprobada (`state = approved`) para estar activa
- `current_score`, `current_position` y `streak` en `USER_ENROLLMENT` se derivan de los resultados en `PREDICTION`
- Los equipos pertenecen directamente a un torneo; no existe una tabla intermedia de equipos globales
- Una instancia solo puede tener un dueño (`owner_id`), sin rol de validador separado

---

## 5. Consideraciones de Diseño

- `USER_ENROLLMENT` reemplaza y unifica las tablas `INSTANCE_USERS` y `LEADERBOARD` del modelo anterior, centralizando tanto la participación como el ranking del usuario en una única entidad
- Los equipos (`TEAM`) están directamente vinculados a un torneo mediante `tournament_id`, eliminando la tabla intermedia `TOURNAMENT_TEAMS`
- Se eliminaron las entidades `GROUPS`, `GROUP_TEAMS`, `INSTANCE_RULES`, `RULES` y `PAYMENTS` respecto al modelo anterior
- `TOURNAMENT_INSTANCE` ya no requiere `validator_user_id` ni `price`, simplificando el flujo de creación
- El campo `token` en `TOURNAMENT` permite controlar el acceso o invitación a un torneo
- `has_exact_result` en `PREDICTION` optimiza las consultas de estadísticas sin necesidad de recalcular
- El modelo permite escalar a múltiples torneos e instancias simultáneamente