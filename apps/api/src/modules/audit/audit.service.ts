import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditEventType, UserRole } from '@checkin/shared';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logEvent(
    type: AuditEventType,
    actorId: string,
    actorRole: UserRole | string,
    details: string,
    metadata?: any,
  ) {
    return this.prisma.auditEvent.create({
      data: {
        type,
        actorId,
        actorRole,
        details,
        metadata: metadata || undefined,
      },
    });
  }

  async getLogs() {
    return this.prisma.auditEvent.findMany({
      orderBy: { timestamp: 'desc' },
    });
  }
}
