/**
 * Check-in Inclusivo — Shared Types
 *
 * Tipos TypeScript compartidos entre el backend y el frontend.
 * Representan las formas de datos que cruzan la frontera API.
 */

import {
  CheckInStatus,
  AuthChallengeType,
  ConsentScope,
  DigitalKeyStatus,
  ReservationStatus,
  AuditEventType,
  SupportedLanguage,
} from './enums';

// ─── Guest ─────────────────────────────────────────────────

export interface GuestDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  preferredLanguage: SupportedLanguage;
  accessibilityPreferences: AccessibilityPreferences;
  createdAt: string;
}

export interface AccessibilityPreferences {
  /** Prefer text-only interactions (no voice) */
  textOnly: boolean;
  /** High contrast mode */
  highContrast: boolean;
  /** Reduced motion */
  reducedMotion: boolean;
  /** Screen reader optimized */
  screenReader: boolean;
  /** Preferred communication channel */
  preferredChannel: 'text' | 'email';
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  textOnly: true,
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  preferredChannel: 'text',
};

// ─── Reservation ───────────────────────────────────────────

export interface ReservationDto {
  id: string;
  bookingCode: string;
  guestId: string;
  guest?: GuestDto;
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber?: string;
  status: ReservationStatus;
  pmsSource: string;
  createdAt: string;
}

// ─── Check-In ──────────────────────────────────────────────

export interface CheckInDto {
  id: string;
  reservationId: string;
  reservation?: ReservationDto;
  status: CheckInStatus;
  selectedTimeWindow?: TimeWindow;
  timestamps: CheckInTimestamps;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInTimestamps {
  invitedAt?: string;
  dataValidatedAt?: string;
  windowSelectedAt?: string;
  authenticatedAt?: string;
  keyIssuedAt?: string;
  completedAt?: string;
}

export interface TimeWindow {
  id: string;
  label: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  available: boolean;
}

// ─── Consent ───────────────────────────────────────────────

export interface ConsentDto {
  id: string;
  guestId: string;
  version: string;
  accepted: boolean;
  scope: ConsentScope[];
  timestamp: string;
}

export interface ConsentTextDto {
  /** Version identifier */
  version: string;
  /** Easy-read version (short sentences, simple language) */
  easyReadText: string;
  /** Full legal version */
  fullText: string;
  /** Scopes covered by this consent */
  scopes: ConsentScope[];
}

// ─── Digital Key ───────────────────────────────────────────

export interface DigitalKeyDto {
  id: string;
  checkInId: string;
  credential: string;
  validFrom: string;
  validUntil: string;
  status: DigitalKeyStatus;
  roomNumber: string;
}

// ─── Auth Challenge ────────────────────────────────────────

export interface AuthChallengeDto {
  id: string;
  type: AuthChallengeType;
  /** For QR: the encoded data. For OTP: masked hint */
  displayValue: string;
  expiresAt: string;
  remainingAttempts: number;
}

export interface AuthVerifyRequest {
  challengeId: string;
  type: AuthChallengeType;
  /** For QR: scanned payload. For OTP: entered code */
  value: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
  role: string;
}

// ─── Hotel Config ──────────────────────────────────────────

export interface HotelConfigDto {
  id: string;
  hotelId: string;
  quietLobbyEnabled: boolean;
  availableTimeWindows: TimeWindow[];
  consentTexts: ConsentTextDto[];
  createdAt: string;
  updatedAt: string;
}

// ─── Audit Event ───────────────────────────────────────────

export interface AuditEventDto {
  id: string;
  type: AuditEventType;
  actorId: string;
  actorRole: string;
  details: string;
  timestamp: string;
}

// ─── API Responses ─────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Pre-Check-In Request ──────────────────────────────────

export interface PreCheckInRequest {
  bookingCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  preferredLanguage: SupportedLanguage;
  accessibilityPreferences: AccessibilityPreferences;
  documentUploaded: boolean;
}

// ─── Dashboard Stats (Admin Panel) ─────────────────────────

export interface DashboardStatsDto {
  totalReservationsToday: number;
  completedWithoutReception: number;
  completedWithReception: number;
  inProgressCheckIns: number;
  pendingArrivals: number;
  quietLobbyActive: boolean;
  checkInFunnel: CheckInFunnelDto;
}

export interface CheckInFunnelDto {
  invited: number;
  dataValidated: number;
  windowSelected: number;
  authenticated: number;
  keyIssued: number;
  completed: number;
}

// ─── FASE 2 Stubs ──────────────────────────────────────────

/** FASE 2: Predicción de aforo del lobby */
export interface LobbyForecastDto {
  timeSlot: string;
  predictedOccupancy: number;
  confidence: number;
}

/** FASE 2: Biometric verification port */
// export interface BiometricVerifyRequest { ... }

/** FASE 3: Indoor navigation waypoint */
// export interface WayfindingStep { ... }
