import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PMS_PORT, PmsPort } from '../integrations/ports/pms.port';
import { NOTIFICATION_PORT, NotificationPort } from '../integrations/ports/notification.port';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, UserRole, ReservationStatus, CheckInStatus } from '@checkin/shared';

@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Inject(PMS_PORT) private readonly pmsPort: PmsPort,
    @Inject(NOTIFICATION_PORT) private readonly notificationPort: NotificationPort,
  ) {}

  async getReservation(bookingCode: string) {
    // 1. Check local DB
    let reservation = await this.prisma.reservation.findUnique({
      where: { bookingCode },
      include: {
        guest: true,
        checkIn: true,
      },
    });

    // 2. If not in DB, search in PMS
    if (!reservation) {
      const pmsRes = await this.pmsPort.getReservation(bookingCode);
      if (!pmsRes) {
        throw new NotFoundException(`Reserva con código ${bookingCode} no encontrada en el PMS`);
      }

      // Find or create guest based on email (simulated PMS email or placeholder)
      const guestEmail = `${pmsRes.guestName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      const names = pmsRes.guestName.split(' ');
      const firstName = names[0] || 'Guest';
      const lastName = names.slice(1).join(' ') || 'PMS';

      let guest = await this.prisma.guest.findUnique({
        where: { email: guestEmail },
      });

      if (!guest) {
        guest = await this.prisma.guest.create({
          data: {
            firstName,
            lastName,
            email: guestEmail,
            accessibilityPreferences: {},
          },
        });
      }

      // Create local reservation
      reservation = await this.prisma.reservation.create({
        data: {
          bookingCode,
          guestId: guest.id,
          hotelId: 'hotel-sereno-001', // Bind to our main demo hotel
          checkInDate: new Date(pmsRes.checkInDate),
          checkOutDate: new Date(pmsRes.checkOutDate),
          status: ReservationStatus.CONFIRMED,
          pmsSource: 'MOCK_OHIP',
        },
        include: {
          guest: true,
          checkIn: true,
        },
      });

      // Create CheckIn record
      const checkIn = await this.prisma.checkIn.create({
        data: {
          reservationId: reservation.id,
          status: CheckInStatus.INVITADO,
        },
      });

      reservation.checkIn = checkIn;

      await this.auditService.logEvent(
        AuditEventType.CHECKIN_STARTED,
        guest.id,
        UserRole.GUEST,
        `Reserva importada de PMS y check-in iniciado. Código: ${bookingCode}`,
      );
    }

    return reservation;
  }

  async sendPreCheckInLink(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { guest: true, checkIn: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // In a real app we'd load this from config or ENV
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const link = `${frontendUrl}/check-in/${reservation.bookingCode}`;

    // Send email using notification port
    await this.notificationPort.sendPreCheckInLink(
      reservation.guest.email,
      reservation.bookingCode,
      link,
    );

    // Update status to PRE_CHECKIN if confirmed
    if (reservation.status === ReservationStatus.CONFIRMED) {
      await this.prisma.reservation.update({
        where: { id },
        data: { status: ReservationStatus.PRE_CHECKIN },
      });
    }

    await this.auditService.logEvent(
      AuditEventType.CHECKIN_STARTED,
      reservation.guestId,
      UserRole.STAFF,
      `Enlace de pre-check-in enviado al correo del huésped (${reservation.guest.email})`,
    );

    return true;
  }

  async getAllReservations() {
    return this.prisma.reservation.findMany({
      include: {
        guest: true,
        checkIn: true,
      },
      orderBy: { checkInDate: 'asc' },
    });
  }
}
