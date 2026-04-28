import { IUser } from '../interfaces/IUser';

export class UserRules {
  /**
   * REGLA: Validación de Email
   * Asegura que el formato sea correcto antes de intentar el guardado único.
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * REGLA: Seguridad de Contraseña
   * Verifica que el hash no sea una cadena vacía o demasiado corta.
   */
  static isSecureHash(hash: string): boolean {
    return hash.length >= 20; // Los hashes de bcrypt suelen ser largos
  }

  /**
   * REGLA: Jerarquía de Roles
   * Define si un usuario tiene permisos de administración.
   */
  static isAdmin(user: IUser): boolean {
    return user.role === 'global';
  }

  /**
   * REGLA: Estado de Cuenta
   * Verifica si el usuario no ha sido eliminado (Soft Delete).
   */
  static isActive(user: IUser): boolean {
    return user.deleted_at === null;
  }

  /**
   * REGLA DE INTEGRIDAD: Creación de Usuario
   * Agrupa las validaciones necesarias para dar de alta a alguien.
   */
  static canBeCreated(user: IUser): boolean {
    return (
      user.name.trim().length > 0 &&
      this.isValidEmail(user.email) &&
      this.isSecureHash(user.password_hash)
    );
  }
}