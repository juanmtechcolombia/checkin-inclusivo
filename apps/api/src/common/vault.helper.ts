import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class VaultHelper {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor() {
    const rawKey = process.env.VAULT_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    // Key should be 32 bytes (64 hex characters)
    this.key = Buffer.from(rawKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error('Vault encryption key must be 32 bytes (64 hex characters)');
    }
  }

  encrypt(text: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  }

  decrypt(encryptedText: string, ivHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
export const vaultHelperInstance = new VaultHelper();
