import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PMS_PORT, PmsPort } from '../integrations/ports/pms.port';
import { LOCK_PORT, LockPort } from '../integrations/ports/lock.port';
import { NOTIFICATION_PORT, NotificationPort } from '../integrations/ports/notification.port';
import { AuditService } from '../audit/audit.service';
import { GuestService } from '../guest/guest.service';
import { CheckInStatus, AuditEventType, UserRole, ReservationStatus, TimeWindow } from '@checkin/shared';

@Injectable()
export class CheckInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly guestService: GuestService,
    @Inject(PMS_PORT) private readonly pmsPort: PmsPort,
    @Inject(LOCK_PORT) private readonly lockPort: LockPort,
    @Inject(NOTIFICATION_PORT) private readonly notificationPort: NotificationPort,
  ) {}

  async getCheckIn(id: string) {
    const checkIn = await this.prisma.checkIn.findUnique({
      where: { id },
      include: {
        reservation: {
          include: { guest: true },
        },
        digitalKey: true,
      },
    });

    if (!checkIn) {
      throw new NotFoundException('Check-in no encontrado');
    }

    return checkIn;
  }

  async validateData(checkInId: string, consentAccepted: boolean, consentScopes: string[], documentNumber?: string) {
    const checkIn = await this.getCheckIn(checkInId);

    if (checkIn.status !== CheckInStatus.INVITADO) {
      throw new BadRequestException('El check-in ya se encuentra en proceso o completado');
    }

    if (!consentAccepted) {
      throw new BadRequestException('Debe aceptar los términos de consentimiento de datos personales');
    }

    const guestId = checkIn.reservation.guestId;

    // 1. Create Consent Record
    await this.prisma.consent.create({
      data: {
        guestId,
        version: '1.0',
        accepted: true,
        scope: consentScopes as any,
      },
    });

    // 2. Save document number securely in SensitiveData vault
    if (documentNumber) {
      await this.guestService.saveSensitiveData(guestId, 'IDENTITY_DOCUMENT', documentNumber);
      
      // Also sync guest data to PMS
      await this.pmsPort.syncGuest(guestId, {
        firstName: checkIn.reservation.guest.firstName,
        lastName: checkIn.reservation.guest.lastName,
        email: checkIn.reservation.guest.email,
        phone: checkIn.reservation.guest.phone || undefined,
        documentNumber,
      });
    }

    // 3. Update CheckIn Status to DATOS_VALIDADOS
    const updated = await this.prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        status: CheckInStatus.DATOS_VALIDADOS,
        dataValidatedAt: new Date(),
      },
    });

    await this.auditService.logEvent(
      AuditEventType.DATA_VALIDATED,
      guestId,
      UserRole.GUEST,
      `Datos del huésped validados y consentimiento registrado.`,
    );

    return updated;
  }

  async selectTimeWindow(checkInId: string, timeWindow: TimeWindow) {
    const checkIn = await this.getCheckIn(checkInId);

    // Allow transition from INVITADO (if skipped data) or DATOS_VALIDADOS
    if (
      checkIn.status !== CheckInStatus.DATOS_VALIDADOS &&
      checkIn.status !== CheckInStatus.INVITADO
    ) {
      throw new BadRequestException('Estado inválido para seleccionar ventana horaria');
    }

    const updated = await this.prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        selectedTimeWindow: timeWindow as any,
        status: CheckInStatus.VENTANA_SELECCIONADA,
        windowSelectedAt: new Date(),
      },
    });

    await this.auditService.logEvent(
      AuditEventType.WINDOW_SELECTED,
      checkIn.reservation.guestId,
      UserRole.GUEST,
      `Franja horaria seleccionada: ${timeWindow.label}`,
    );

    return updated;
  }

  async issueKey(checkInId: string) {
    const checkIn = await this.prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        reservation: {
          include: { guest: true },
        },
        digitalKey: true,
      },
    });

    if (!checkIn) {
      throw new NotFoundException('Check-in no encontrado');
    }

    if (checkIn.status !== CheckInStatus.AUTENTICADO) {
      throw new BadRequestException('El huésped debe autenticarse en el lobby antes de emitir la llave');
    }

    // 1. Assign room in PMS
    const assignResult = await this.pmsPort.assignRoom(checkIn.reservationId);
    if (!assignResult.success) {
      throw new BadRequestException('No se pudo asignar habitación automáticamente en el PMS');
    }

    const roomNumber = assignResult.roomNumber;

    // 2. Issue digital lock credential
    const lockResponse = await this.lockPort.issueCredential({
      guestId: checkIn.reservation.guestId,
      roomNumber,
      validFrom: checkIn.reservation.checkInDate,
      validUntil: checkIn.reservation.checkOutDate,
    });

    if (!lockResponse.success) {
      throw new BadRequestException('Fallo al emitir la credencial en la cerradura electrónica');
    }

    // 3. Create DigitalKey record
    const digitalKey = await this.prisma.digitalKey.create({
      data: {
        checkInId,
        credential: lockResponse.credential,
        validFrom: checkIn.reservation.checkInDate,
        validUntil: checkIn.reservation.checkOutDate,
        status: 'ACTIVE',
        roomNumber,
      },
    });

    // 4. Confirm check-in in PMS
    await this.pmsPort.confirmCheckIn(checkIn.reservationId);

    // 5. Update Reservation status to CHECKED_IN
    await this.prisma.reservation.update({
      where: { id: checkIn.reservationId },
      data: {
        status: ReservationStatus.CHECKED_IN,
        roomNumber,
      },
    });

    // 6. Update CheckIn status to COMPLETADO
    const updatedCheckIn = await this.prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        status: CheckInStatus.COMPLETADO,
        keyIssuedAt: new Date(),
        completedAt: new Date(),
      },
      include: { digitalKey: true },
    });

    // 7. Notify guest
    await this.notificationPort.sendKeyIssued(checkIn.reservation.guest.email, roomNumber);

    await this.auditService.logEvent(
      AuditEventType.KEY_ISSUED,
      checkIn.reservation.guestId,
      UserRole.GUEST,
      `Llave digital emitida para la habitación ${roomNumber}`,
    );

    await this.auditService.logEvent(
      AuditEventType.CHECKIN_COMPLETED,
      checkIn.reservation.guestId,
      UserRole.GUEST,
      `Check-in completado digitalmente. Habitación ${roomNumber}`,
    );

    return updatedCheckIn;
  }

  async openDoor(checkInId: string) {
    const checkIn = await this.prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: { digitalKey: true, reservation: true },
    });

    if (!checkIn || !checkIn.digitalKey) {
      throw new NotFoundException('Llave digital no encontrada para este check-in');
    }

    const openResult = await this.lockPort.openDoor(
      checkIn.digitalKey.id,
      checkIn.digitalKey.roomNumber,
    );

    if (openResult.success) {
      await this.auditService.logEvent(
        AuditEventType.KEY_USED,
        checkIn.reservation.guestId,
        UserRole.GUEST,
        `Cerradura abierta con llave digital. Habitación ${checkIn.digitalKey.roomNumber}`,
      );
    }

    return openResult;
  }
}
