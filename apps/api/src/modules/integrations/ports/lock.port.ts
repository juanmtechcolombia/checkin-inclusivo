/**
 * Lock Port — Interface for digital lock system integration.
 *
 * Abstracts lock vendors (ASSA ABLOY, Salto, Dormakaba) so the
 * domain logic is decoupled from specific lock SDKs.
 *
 * To integrate a real lock system:
 * 1. Create a new adapter (e.g., AssaAbloyLockAdapter)
 * 2. Replace the MockLockAdapter binding in IntegrationsModule
 * 3. No changes needed in business logic
 */
export interface LockPort {
  /** Issue a mobile credential for a room */
  issueCredential(params: LockCredentialRequest): Promise<LockCredentialResponse>;

  /** Revoke an existing credential */
  revokeCredential(credentialId: string): Promise<boolean>;

  /** Check the status of a credential */
  checkStatus(credentialId: string): Promise<LockCredentialStatus>;

  /** Simulate opening a door (for demo/testing) */
  openDoor(credentialId: string, roomNumber: string): Promise<LockOpenResult>;
}

export interface LockCredentialRequest {
  guestId: string;
  roomNumber: string;
  validFrom: Date;
  validUntil: Date;
}

export interface LockCredentialResponse {
  success: boolean;
  credentialId: string;
  credential: string;
  roomNumber: string;
}

export interface LockCredentialStatus {
  credentialId: string;
  active: boolean;
  expiresAt: string;
}

export interface LockOpenResult {
  success: boolean;
  roomNumber: string;
  timestamp: string;
  message: string;
}

/** DI token for LockPort */
export const LOCK_PORT = Symbol('LOCK_PORT');
