// ER (Entidad–Relación)
// Definir entidades (usuarios, partidos, equipos, predicciones, resultados) y relaciones

// 👤 Usuarios
//⚽ Equipos
//🏟️ Partidos
//🔮 Predicciones
//📊 Resultados

// crado JSAM// Creado

// 1. Entidades principales 

// 👤 Usuario
type Usuario = {
  id: number;
  nombre: string;
  email: string;
};

// ⚽ Equipo
type Equipo = {
  id: number;
  nombre: string;
  pais: string;
};

// 🏟️ Partido
type Partido = {
  id: number;
  fecha: Date;
  equipoLocalId: number;   // FK → Equipo
  equipoVisitanteId: number; // FK → Equipo
};

// 📊 Resultado
type Resultado = {
  id: number;
  partidoId: number; // FK → Partido
  golesLocal: number;
  golesVisitante: number;
};

// 🔮 Predicción
type Prediccion = {
  id: number;
  usuarioId: number; // FK → Usuario
  partidoId: number; // FK → Partido
  golesLocal: number;
  golesVisitante: number;
};

//2. Relaciones

type PartidoCompleto = {
  id: number;
  fecha: Date;
  equipoLocal: Equipo;
  equipoVisitante: Equipo;
  resultado?: Resultado;
  //predicciones?: Prediccion[];
  predicciones?: object;
};

//3. modificancion de datos parcialmente 

type UsuarioUpdate = Partial<Usuario>;
