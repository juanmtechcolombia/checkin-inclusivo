import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VaultHelper } from '../../common/vault.helper';
import { AccessibilityPreferences, SupportedLanguage } from '@checkin/shared';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, UserRole } from '@checkin/shared';

@Injectable()
export class GuestService {
  private readonly vaultHelper = new VaultHelper();

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getGuest(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
    });
    if (!guest) {
      throw new NotFoundException('Huésped no encontrado');
    }
    return guest;
  }

  async updateAccessibilityPreferences(id: string, prefs: AccessibilityPreferences) {
    const guest = await this.prisma.guest.update({
      where: { id },
      data: {
        accessibilityPreferences: prefs as any,
      },
    });

    await this.auditService.logEvent(
      AuditEventType.CONFIG_UPDATED,
      id,
      UserRole.GUEST,
      `Preferencias de accesibilidad actualizadas`,
    );

    return guest;
  }

  async saveSensitiveData(guestId: string, dataType: string, plainValue: string) {
    // Check if guest exists
    await this.getGuest(guestId);

    const { encrypted, iv } = this.vaultHelper.encrypt(plainValue);

    // Update if exists, otherwise create
    const existing = await this.prisma.sensitiveData.findFirst({
      where: { guestId, dataType },
    });

    if (existing) {
      await this.prisma.sensitiveData.update({
        where: { id: existing.id },
        data: {
          encryptedValue: encrypted,
          encryptionIv: iv,
        },
      });
    } else {
      await this.prisma.sensitiveData.create({
        data: {
          guestId,
          dataType,
          encryptedValue: encrypted,
          encryptionIv: iv,
        },
      });
    }

    await this.auditService.logEvent(
      AuditEventType.CONSENT_GIVEN,
      guestId,
      UserRole.GUEST,
      `Dato sensible guardado y cifrado: ${dataType}`,
    );
  }

  async getSensitiveData(guestId: string, dataType: string): Promise<string | null> {
    const record = await this.prisma.sensitiveData.findFirst({
      where: { guestId, dataType },
    });

    if (!record) {
      return null;
    }

    try {
      return this.vaultHelper.decrypt(record.encryptedValue, record.encryptionIv);
    } catch (error) {
      console.error(`Error decrypting guest ${guestId} data: ${dataType}`, error);
      return null;
    }
  }

  async deleteGuestData(guestId: string) {
    // GDPR/Ley 1581 right to be forgotten
    await this.prisma.sensitiveData.deleteMany({
      where: { guestId },
    });

    await this.auditService.logEvent(
      AuditEventType.DATA_PURGED,
      guestId,
      UserRole.GUEST,
      `Datos sensibles purgados de la bóveda por solicitud del huésped`,
    );
  }
}
