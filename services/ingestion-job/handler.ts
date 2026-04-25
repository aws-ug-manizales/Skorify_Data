export const extractor = async (event: any) => {
  console.log("Buscando partidos finalizados...");
  return { message: "Extractor ejecutado" };
};

export const processor = async (event: any) => {
  console.log("Procesando puntos de partidos...");
  return { message: "Processor ejecutado" };
};
