/**
 * Servicio encargado de la gestión horaria del ecosistema Skorify.
 */
export class TimeService {
  private static readonly COLOMBIA_TZ = "America/Bogota";

  /**
   * Obtiene la instancia de fecha actual normalizada para Colombia.
   */
  public static now(): Date {
    const now = new Date();
    
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: this.COLOMBIA_TZ,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const get = (type: string) => parts.find(p => p.type === type)?.value;

    return new Date(
      `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`
    );
  }
}