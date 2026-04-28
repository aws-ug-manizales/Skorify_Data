import { ITeam } from '../interfaces/ITeam';

export class TeamRules {
  /**
   * REGLA: Nombre Válido
   * El nombre del equipo no debe estar vacío y debe tener una longitud razonable.
   */
  static isValidName(name: string): boolean {
    const minLength = 2;
    const maxLength = 100;
    return name.trim().length >= minLength && name.trim().length <= maxLength;
  }

  /**
   * REGLA: Formato de Siglas (Abbreviation)
   * Los equipos suelen identificarse por 3 letras mayúsculas (FIFA style).
   */
  static isValidAbbreviation(abbreviation: string): boolean {
    const regex = /^[A-Z]{2,4}$/; // Acepta de 2 a 4 letras en mayúscula
    return regex.test(abbreviation);
  }

  /**
   * REGLA: Validación de Logo
   * Si se proporciona una URL, debe ser válida.
   */
  static hasValidLogoUrl(logoUrl?: string): boolean {
    if (!logoUrl) return true; // Es opcional
    try {
      new URL(logoUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * REGLA DE INTEGRIDAD: Validar objeto completo
   * Útil antes de guardar en la base de datos (H03).
   */
  static canBeCreated(team: ITeam): boolean {
    return (
      this.isValidName(team.name) &&
      this.isValidAbbreviation(team.abbreviation) &&
      this.hasValidLogoUrl(team.logo_url)
    );
  }
}