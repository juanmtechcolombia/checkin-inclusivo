/**
 * Check-in Inclusivo — Shared Enums
 *
 * Enumeraciones compartidas entre el backend (NestJS) y el frontend (React).
 * Representan los estados y tipos fundamentales del dominio.
 */

/** Estado del proceso de check-in — máquina de estados principal */
export enum CheckInStatus {
  /** Enlace enviado, huésped aún no ha iniciado */
  INVITADO = 'INVITADO',
  /** Huésped completó el formulario de datos */
  DATOS_VALIDADOS = 'DATOS_VALIDADOS',
  /** Huésped seleccionó franja horaria de llegada */
  VENTANA_SELECCIONADA = 'VENTANA_SELECCIONADA',
  /** Huésped se autenticó exitosamente (QR o OTP) */
  AUTENTICADO = 'AUTENTICADO',
  /** Sistema emitió la llave digital */
  LLAVE_EMITIDA = 'LLAVE_EMITIDA',
  /** Check-in completado, huésped accedió a la habitación */
  COMPLETADO = 'COMPLETADO',
}

/** Transiciones válidas de la máquina de estados */
export const VALID_TRANSITIONS: Record<CheckInStatus, CheckInStatus[]> = {
  [CheckInStatus.INVITADO]: [CheckInStatus.DATOS_VALIDADOS],
  [CheckInStatus.DATOS_VALIDADOS]: [CheckInStatus.VENTANA_SELECCIONADA],
  [CheckInStatus.VENTANA_SELECCIONADA]: [CheckInStatus.AUTENTICADO],
  [CheckInStatus.AUTENTICADO]: [CheckInStatus.LLAVE_EMITIDA],
  [CheckInStatus.LLAVE_EMITIDA]: [CheckInStatus.COMPLETADO],
  [CheckInStatus.COMPLETADO]: [],
};

/** Tipo de desafío de autenticación */
export enum AuthChallengeType {
  /** Código QR escaneado */
  QR = 'QR',
  /** Código numérico de un solo uso */
  OTP = 'OTP',
  // FASE 2: Biometría con cotejo en dispositivo
  // BIOMETRIC = 'BIOMETRIC',
}

/** Ámbito de datos del consentimiento (Ley 1581 de 2012) */
export enum ConsentScope {
  /** Datos personales básicos (nombre, contacto) */
  PERSONAL_DATA = 'PERSONAL_DATA',
  /** Datos de documento de identidad */
  IDENTITY_DOCUMENT = 'IDENTITY_DOCUMENT',
  /** Datos de preferencias de accesibilidad */
  ACCESSIBILITY_PREFERENCES = 'ACCESSIBILITY_PREFERENCES',
  /** Datos de ubicación (para llegada al hotel) */
  LOCATION_DATA = 'LOCATION_DATA',
  // FASE 2: Datos biométricos
  // BIOMETRIC_DATA = 'BIOMETRIC_DATA',
}

/** Estado de la llave digital */
export enum DigitalKeyStatus {
  /** Llave emitida pero aún no activada */
  ISSUED = 'ISSUED',
  /** Llave activa y funcional */
  ACTIVE = 'ACTIVE',
  /** Llave expirada */
  EXPIRED = 'EXPIRED',
  /** Llave revocada manualmente */
  REVOKED = 'REVOKED',
}

/** Estado de la reserva */
export enum ReservationStatus {
  /** Reserva confirmada, pendiente de check-in */
  CONFIRMED = 'CONFIRMED',
  /** Pre-check-in iniciado */
  PRE_CHECKIN = 'PRE_CHECKIN',
  /** Check-in completado */
  CHECKED_IN = 'CHECKED_IN',
  /** Check-out realizado */
  CHECKED_OUT = 'CHECKED_OUT',
  /** Reserva cancelada */
  CANCELLED = 'CANCELLED',
}

/** Roles de usuario */
export enum UserRole {
  GUEST = 'GUEST',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

/** Tipo de evento de auditoría */
export enum AuditEventType {
  CHECKIN_STARTED = 'CHECKIN_STARTED',
  DATA_VALIDATED = 'DATA_VALIDATED',
  WINDOW_SELECTED = 'WINDOW_SELECTED',
  AUTH_ATTEMPTED = 'AUTH_ATTEMPTED',
  AUTH_SUCCEEDED = 'AUTH_SUCCEEDED',
  AUTH_FAILED = 'AUTH_FAILED',
  KEY_ISSUED = 'KEY_ISSUED',
  KEY_USED = 'KEY_USED',
  CHECKIN_COMPLETED = 'CHECKIN_COMPLETED',
  CONSENT_GIVEN = 'CONSENT_GIVEN',
  CONSENT_REVOKED = 'CONSENT_REVOKED',
  QUIET_LOBBY_TOGGLED = 'QUIET_LOBBY_TOGGLED',
  CONFIG_UPDATED = 'CONFIG_UPDATED',
  DATA_PURGED = 'DATA_PURGED',
}

/** Idiomas soportados */
export enum SupportedLanguage {
  ES = 'es',
  EN = 'en',
}
