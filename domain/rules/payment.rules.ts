import { IPayment } from '../interfaces/IPayment';

export class PaymentRules {
  /**
   * REGLA: Acceso Permitido
   * Un usuario solo puede ver contenido exclusivo o realizar predicciones
   * si su pago está en estado 'paid'.
   */
  static canParticipate(payment: IPayment): boolean {
    return payment.state_pay === 'paid';
  }

  /**
   * REGLA: Reintento de Pago
   * Permite determinar si un pago fallido puede volver a intentarse.
   * Por ejemplo, si falló hace menos de 3 días.
   */
  static canRetryPayment(payment: IPayment): boolean {
    if (payment.state_pay !== 'failed') return false;
    
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = new Date();
    return (now.getTime() - payment.created_at.getTime()) < THREE_DAYS_MS;
  }

  /**
   * REGLA: Tiempo de Procesamiento
   * Indica si un pago pendiente lleva demasiado tiempo sin resolverse
   * (útil para auditoría o soporte técnico).
   */
  static isStuckPending(payment: IPayment): boolean {
    if (payment.state_pay !== 'pending') return false;
    
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const now = new Date();
    return (now.getTime() - payment.created_at.getTime()) > TWENTY_FOUR_HOURS_MS;
  }

  /**
   * REGLA SINGULAR: Validación de Registro
   * Asegura que el pago se haya registrado antes de que el torneo termine.
   */
  static isRegistrationPeriodValid(payment: IPayment, tournamentEndDate: Date): boolean {
    return payment.created_at < tournamentEndDate;
  }
}