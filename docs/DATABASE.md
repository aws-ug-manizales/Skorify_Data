# Documentación del Modelo Relacional – Sistema de Apuestas

## 1. Descripción General

El sistema modela una plataforma de apuestas deportivas basada en torneos de fútbol. Los usuarios se unen a instancias (pollas) dentro de un torneo y realizan predicciones sobre partidos, acumulando puntos según su precisión. El sistema incluye control de pagos, organización de equipos por torneo y grupos, reglas configurables por instancia, y un ranking (leaderboard).

---

## 2. Entidades y Atributos

### USERS
Representa a los usuarios del sistema.

**Atributos:**
- id (PK): Identificador único
- name: Nombre del usuario
- email: Correo electrónico (único)
- password_hash: Contraseña encriptada
- avatar_url: Imagen de perfil
- role: Rol del usuario (general | global | instance)
- created_at: Fecha de creación
- updated_at: Fecha de actualización
- deleted_at: Fecha de eliminación lógica

---

### TOURNAMENTS
Representa torneos en los que se realizan apuestas.

**Atributos:**
- id (PK)
- name: Nombre del torneo
- start_date: Fecha de inicio
- end_date: Fecha de finalización
- created_at

---

### PAYMENTS
Controla si un usuario ha pagado para participar en un torneo.

**Atributos:**
- id (PK)
- user_id (FK → USERS)
- tournament_id (FK → TOURNAMENTS)
- state_pay: Estado del pago (failed | pending | paid)
- created_at
- updated_at

---

### TEAMS
Equipos de fútbol.

**Atributos:**
- id (PK)
- name: Nombre del equipo
- code: Código único
- shield_url: Escudo del equipo
- created_at
- updated_at
- deleted_at

---

### TOURNAMENT_TEAMS
Tabla intermedia que relaciona equipos con torneos.

**Atributos:**
- id (PK)
- team_id (FK → TEAMS)
- tournament_id (FK → TOURNAMENTS)

---

### GROUPS
Define los grupos dentro de un torneo (fase de grupos).

**Atributos:**
- id (PK)
- tournament_id (FK → TOURNAMENTS)
- group_name: Nombre del grupo (A, B, C...)
- created_at
- updated_at
- deleted_at

---

### GROUP_TEAMS
Relaciona equipos con grupos.

**Atributos:**
- id (PK)
- team_id (FK → TEAMS)
- group_id (FK → GROUPS)

---

### MATCHES
Partidos entre equipos.

**Atributos:**
- id (PK)
- home_team_id (FK → TEAMS)
- away_team_id (FK → TEAMS)
- tournament_id (FK → TOURNAMENTS)
- kick_off: Fecha y hora del partido
- home_goals: Goles equipo local
- away_goals: Goles equipo visitante
- status: Estado (scheduled | in_progress | finished)
- stage: Etapa (group | finals)
- venue: Estadio del partido
- created_at
- updated_at

---

### RULES
Reglas configurables para las instancias.

**Atributos:**
- id (PK)
- name: Nombre de la regla
- description: Descripción de la regla
- created_at

---

### INSTANCES
Representa una polla o pool dentro de un torneo. Un usuario la crea y un validador la aprueba.

**Atributos:**
- id (PK)
- tournament_id (FK → TOURNAMENTS)
- owner_user_id (FK → USERS): Creador de la instancia
- validator_user_id (FK → USERS): Validador de la instancia
- state: Estado de la instancia (approved | pending | denied)
- name: Nombre de la polla
- price: Precio de entrada
- created_at
- updated_at
- deleted_at

---

### INSTANCE_USERS
Jugadores que participan en una instancia.

**Atributos:**
- id (PK)
- player_id (FK → USERS)
- instance_id (FK → INSTANCES)
- joined_at: Fecha en que se unió
- created_at

---

### INSTANCE_RULES
Tabla intermedia que asigna reglas a una instancia.

**Atributos:**
- id (PK)
- instance_id (FK → INSTANCES)
- rule_id (FK → RULES)
- created_at

---

### PREDICTIONS
Predicciones realizadas por los jugadores de una instancia.

**Atributos:**
- id (PK)
- instance_player_id (FK → INSTANCE_USERS)
- match_id (FK → MATCHES)
- pred_home_goals: Predicción goles local
- pred_away_goals: Predicción goles visitante
- earned_points: Puntos obtenidos
- created_at
- updated_at
- deleted_at

---

### LEADERBOARD
Ranking de usuarios por torneo.

**Atributos:**
- id (PK)
- user_id (FK → USERS)
- tournament_id (FK → TOURNAMENTS)
- position: Posición en el ranking
- total_points: Puntos acumulados
- exact_hits: Aciertos exactos
- outcome_hits: Aciertos de resultado
- created_at
- updated_at

---

## 3. Relaciones y Cardinalidades

### TOURNAMENTS → INSTANCES
- Tipo: 1:N
- Un torneo puede tener muchas instancias (pollas)
- Cada instancia pertenece a un torneo

---

### USERS → INSTANCES (owner)
- Tipo: 1:N
- Un usuario puede ser dueño de muchas instancias

---

### USERS → INSTANCES (validator)
- Tipo: 1:N
- Un usuario puede validar muchas instancias

---

### INSTANCES → INSTANCE_USERS
- Tipo: 1:N
- Una instancia tiene muchos jugadores

---

### USERS → INSTANCE_USERS
- Tipo: 1:N
- Un usuario puede participar en muchas instancias

---

### INSTANCE_USERS → PREDICTIONS
- Tipo: 1:N
- Un jugador de instancia puede hacer muchas predicciones
- Cada predicción pertenece a un jugador de instancia

---

### MATCHES → PREDICTIONS
- Tipo: 1:N
- Un partido puede tener muchas predicciones
- Cada predicción pertenece a un partido

---

### INSTANCES → INSTANCE_RULES
- Tipo: 1:N
- Una instancia puede tener muchas reglas asignadas

---

### RULES → INSTANCE_RULES
- Tipo: 1:N
- Una regla puede estar asignada a muchas instancias

---

### USERS → PAYMENTS
- Tipo: 1:N
- Un usuario puede pagar múltiples torneos

---

### TOURNAMENTS → PAYMENTS
- Tipo: 1:N
- Un torneo puede tener múltiples pagos de usuarios

---

### TOURNAMENTS → MATCHES
- Tipo: 1:N
- Un torneo contiene múltiples partidos

---

### TEAMS → MATCHES
- Tipo: 1:N (doble relación)
- Un equipo puede ser local o visitante en muchos partidos

---

### TOURNAMENTS ↔ TEAMS (via TOURNAMENT_TEAMS)
- Tipo: N:M
- Un torneo tiene muchos equipos
- Un equipo puede participar en muchos torneos

---

### GROUPS → GROUP_TEAMS
- Tipo: 1:N
- Un grupo contiene muchos equipos

---

### TEAMS → GROUP_TEAMS
- Tipo: 1:N
- Un equipo puede pertenecer a un grupo

---

### TOURNAMENTS → GROUPS
- Tipo: 1:N
- Un torneo tiene múltiples grupos

---

### USERS → LEADERBOARD
- Tipo: 1:N
- Un usuario tiene un registro por torneo

---

### TOURNAMENTS → LEADERBOARD
- Tipo: 1:N
- Un torneo tiene múltiples registros de ranking

---

## 4. Reglas de Negocio Implícitas

- Un jugador de instancia solo puede predecir una vez por partido (constraint UNIQUE en instance_player_id + match_id)
- Un usuario debe pertenecer a una instancia (INSTANCE_USERS) para poder hacer predicciones
- Una instancia debe ser aprobada (state = approved) para estar activa
- Los puntos en LEADERBOARD se derivan de PREDICTIONS
- Los equipos deben pertenecer a un torneo para participar en sus partidos
- Los grupos están contenidos dentro de un torneo
- Cada instancia puede tener sus propias reglas asignadas via INSTANCE_RULES

---

## 5. Consideraciones de Diseño

- LEADERBOARD es una tabla derivada para optimizar consultas de ranking
- TOURNAMENT_TEAMS y GROUP_TEAMS resuelven relaciones N:M
- INSTANCE_RULES resuelve la relación N:M entre INSTANCES y RULES
- INSTANCE_USERS actúa como pivote entre USERS e INSTANCES, y es la entidad que genera predicciones
- El modelo permite escalar a múltiples torneos e instancias simultáneamente
- Los roles de usuario (general, global, instance) definen niveles de acceso
- La integridad depende parcialmente de validaciones en backend