import { Injectable, Logger } from '@nestjs/common';
import {
  LockPort,
  LockCredentialRequest,
  LockCredentialResponse,
  LockCredentialStatus,
  LockOpenResult,
} from '../ports/lock.port';
import { randomBytes } from 'crypto';

/**
 * Mock Lock Adapter — Simulates ASSA ABLOY / Salto / Dormakaba lock SDKs.
 *
 * Generates mock credentials and simulates door operations.
 * Replace with a real adapter for production.
 */
@Injectable()
export class MockLockAdapter implements LockPort {
  private readonly logger = new Logger('MockLockAdapter');
  private readonly credentials = new Map<string, { active: boolean; roomNumber: string; expiresAt: Date }>();

  async issueCredential(params: LockCredentialRequest): Promise<LockCredentialResponse> {
    this.logger.log(`[MOCK LOCK] Issuing credential for room ${params.roomNumber}`);
    await this.delay(500);

    const credentialId = `MOCK-CRED-${randomBytes(8).toString('hex')}`;
    const credential = `LOCK-${params.roomNumber}-${randomBytes(16).toString('hex')}`;

    this.credentials.set(credentialId, {
      active: true,
      roomNumber: params.roomNumber,
      expiresAt: params.validUntil,
    });

    this.logger.log(`[MOCK LOCK] ✅ Credential issued: ${credentialId} for room ${params.roomNumber}`);

    return {
      success: true,
      credentialId,
      credential,
      roomNumber: params.roomNumber,
    };
  }

  async revokeCredential(credentialId: string): Promise<boolean> {
    this.logger.log(`[MOCK LOCK] Revoking credential: ${credentialId}`);
    await this.delay(200);

    const cred = this.credentials.get(credentialId);
    if (cred) {
      cred.active = false;
      this.logger.log(`[MOCK LOCK] ✅ Credential revoked`);
      return true;
    }

    this.logger.warn(`[MOCK LOCK] Credential not found: ${credentialId}`);
    return false;
  }

  async checkStatus(credentialId: string): Promise<LockCredentialStatus> {
    this.logger.log(`[MOCK LOCK] Checking status: ${credentialId}`);
    await this.delay(100);

    const cred = this.credentials.get(credentialId);
    return {
      credentialId,
      active: cred?.active ?? false,
      expiresAt: cred?.expiresAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  async openDoor(credentialId: string, roomNumber: string): Promise<LockOpenResult> {
    this.logger.log(`[MOCK LOCK] 🔓 Opening door: room ${roomNumber} with credential ${credentialId}`);
    await this.delay(800);

    const cred = this.credentials.get(credentialId);
    if (!cred || !cred.active) {
      this.logger.warn(`[MOCK LOCK] ❌ Door open DENIED — invalid or inactive credential`);
      return {
        success: false,
        roomNumber,
        timestamp: new Date().toISOString(),
        message: 'Credential is not valid or has expired',
      };
    }

    this.logger.log(`[MOCK LOCK] ✅ Door OPENED: room ${roomNumber}`);
    return {
      success: true,
      roomNumber,
      timestamp: new Date().toISOString(),
      message: `Room ${roomNumber} opened successfully`,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
