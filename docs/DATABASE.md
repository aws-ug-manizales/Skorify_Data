# Documentación del Modelo Relacional – Sistema de Apuestas

## 1. Descripción General

El sistema modela una plataforma de apuestas deportivas basada en torneos de fútbol. Los usuarios realizan predicciones sobre partidos y acumulan puntos según su precisión. El sistema incluye control de pagos, organización de equipos por torneo y grupos, y un ranking (leaderboard).

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
- status: Estado (scheduled, in_progress, finished)
- stage: Etapa (group, finals)
- venue: Estadio del partido
- created_at
- updated_at

---

### PREDICTIONS
Predicciones realizadas por los usuarios.

**Atributos:**
- id (PK)
- user_id (FK → USERS)
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
- total_points: Puntos acumulados
- exact_hits: Aciertos exactos
- outcome_hits: Aciertos de resultado
- created_at
- updated_at

---

## 3. Relaciones y Cardinalidades

### USERS → PREDICTIONS
- Tipo: 1:N
- Un usuario puede hacer muchas predicciones
- Cada predicción pertenece a un usuario

---

### MATCHES → PREDICTIONS
- Tipo: 1:N
- Un partido puede tener muchas predicciones
- Cada predicción pertenece a un partido

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

- Un usuario solo puede apostar una vez por partido (constraint UNIQUE en user_id + match_id)
- Un usuario debe haber pagado para participar en un torneo
- Los puntos en LEADERBOARD se derivan de PREDICTIONS
- Los equipos deben pertenecer a un torneo para participar en sus partidos
- Los grupos están contenidos dentro de un torneo

---

## 5. Consideraciones de Diseño

- LEADERBOARD es una tabla derivada para optimizar consultas
- TOURNAMENT_TEAMS y GROUP_TEAMS resuelven relaciones N:M
- El modelo permite escalar a múltiples torneos simultáneamente
- La integridad depende parcialmente de validaciones en backend