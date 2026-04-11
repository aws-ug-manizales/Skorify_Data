// time.service.ts

export class TimeService {
  private static readonly TIMEZONE = "America/Bogota";

  /**
   * Retorna la fecha actual en hora de Colombia
   */
  static now(): Date {
    const date = new Date();

    // Convertimos a zona horaria Colombia
    const colombiaTime = new Intl.DateTimeFormat("en-US", {
      timeZone: this.TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(date);

    const get = (type: string) =>
      colombiaTime.find(p => p.type === type)?.value;

    return new Date(
      `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`
    );
  }
}