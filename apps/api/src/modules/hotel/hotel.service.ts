import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, UserRole, DashboardStatsDto, CheckInStatus } from '@checkin/shared';

@Injectable()
export class HotelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getConfig(hotelId: string) {
    const config = await this.prisma.hotelConfig.findUnique({
      where: { hotelId },
    });
    if (!config) {
      throw new NotFoundException('Configuración del hotel no encontrada');
    }
    return config;
  }

  async toggleQuietLobby(hotelId: string, enabled: boolean) {
    const config = await this.prisma.hotelConfig.update({
      where: { hotelId },
      data: { quietLobbyEnabled: enabled },
    });

    await this.auditService.logEvent(
      AuditEventType.QUIET_LOBBY_TOGGLED,
      'staff-001', // MVP simulation actor
      UserRole.STAFF,
      `Modo Lobby Tranquilo ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}`,
    );

    return config;
  }

  async updateConfig(hotelId: string, timeWindows: any[], consentTexts: any[]) {
    const config = await this.prisma.hotelConfig.update({
      where: { hotelId },
      data: {
        availableTimeWindows: timeWindows,
        consentTexts: consentTexts,
      },
    });

    await this.auditService.logEvent(
      AuditEventType.CONFIG_UPDATED,
      'staff-001',
      UserRole.STAFF,
      `Configuración general del hotel actualizada (horarios y textos de consentimiento)`,
    );

    return config;
  }

  async getDashboardStats(hotelId: string): Promise<DashboardStatsDto> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Get all reservations for today
    const reservationsToday = await this.prisma.reservation.findMany({
      where: {
        hotelId,
        checkInDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        checkIn: true,
        guest: true,
      },
    });

    // 2. Fetch hotel config for quiet lobby state
    const config = await this.getConfig(hotelId);

    // 3. Count statuses
    let totalReservationsToday = reservationsToday.length;
    let completedWithoutReception = 0;
    let completedWithReception = 0;
    let inProgressCheckIns = 0;
    let pendingArrivals = 0;

    for (const res of reservationsToday) {
      if (res.status === 'CHECKED_IN') {
        // Check if guest had textOnly or accessibility preferences enabled
        const prefs = res.guest?.accessibilityPreferences as any;
        if (prefs?.textOnly) {
          completedWithoutReception++;
        } else {
          completedWithReception++;
        }
      } else if (res.status === 'CANCELLED') {
        continue;
      } else if (res.checkIn) {
        if (res.checkIn.status === CheckInStatus.INVITADO) {
          pendingArrivals++;
        } else {
          inProgressCheckIns++;
        }
      } else {
        pendingArrivals++;
      }
    }

    // 4. Calculate funnel statistics (all time or active)
    const allCheckIns = await this.prisma.checkIn.findMany();
    const funnel = {
      invited: 0,
      dataValidated: 0,
      windowSelected: 0,
      authenticated: 0,
      keyIssued: 0,
      completed: 0,
    };

    for (const c of allCheckIns) {
      // Cumulative funnel steps
      funnel.invited++;
      if (c.status === CheckInStatus.DATOS_VALIDADOS) {
        funnel.dataValidated++;
      } else if (c.status === CheckInStatus.VENTANA_SELECCIONADA) {
        funnel.dataValidated++;
        funnel.windowSelected++;
      } else if (c.status === CheckInStatus.AUTENTICADO) {
        funnel.dataValidated++;
        funnel.windowSelected++;
        funnel.authenticated++;
      } else if (c.status === CheckInStatus.LLAVE_EMITIDA) {
        funnel.dataValidated++;
        funnel.windowSelected++;
        funnel.authenticated++;
        funnel.keyIssued++;
      } else if (c.status === CheckInStatus.COMPLETADO) {
        funnel.dataValidated++;
        funnel.windowSelected++;
        funnel.authenticated++;
        funnel.keyIssued++;
        funnel.completed++;
      }
    }

    return {
      totalReservationsToday,
      completedWithoutReception,
      completedWithReception,
      inProgressCheckIns,
      pendingArrivals,
      quietLobbyActive: config.quietLobbyEnabled,
      checkInFunnel: funnel,
    };
  }
}
