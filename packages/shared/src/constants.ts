/**
 * Check-in Inclusivo — Shared Constants
 */

/** Minimum touch target size in pixels (WCAG 2.1 AA) */
export const MIN_TOUCH_TARGET_PX = 44;

/** OTP defaults */
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 3;

/** QR defaults */
export const QR_EXPIRY_MINUTES = 10;

/** Pre-check-in link sent this many hours before arrival */
export const PRE_CHECKIN_HOURS_BEFORE = 72;

/** JWT expiration */
export const JWT_EXPIRATION_HOURS = 24;

/** Check-in step labels for the progress tracker (i18n keys) */
export const CHECKIN_STEP_LABELS = [
  'checkin.step.invited',
  'checkin.step.dataValidated',
  'checkin.step.windowSelected',
  'checkin.step.authenticated',
  'checkin.step.keyIssued',
  'checkin.step.completed',
] as const;

/** API route prefixes */
export const API_ROUTES = {
  AUTH: '/api/auth',
  GUEST: '/api/guests',
  RESERVATION: '/api/reservations',
  CHECKIN: '/api/checkin',
  CONSENT: '/api/consent',
  DIGITAL_KEY: '/api/digital-key',
  HOTEL: '/api/hotel',
  AUDIT: '/api/audit',
  LOBBY_FORECAST: '/api/lobby/forecast', // FASE 2
} as const;
