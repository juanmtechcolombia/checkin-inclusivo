import { Injectable, UnauthorizedException, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { NOTIFICATION_PORT, NotificationPort } from '../integrations/ports/notification.port';
import { AuthChallengeType, UserRole, AuditEventType } from '@checkin/shared';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    @Inject(NOTIFICATION_PORT) private readonly notificationPort: NotificationPort,
  ) {}

  // ─── Staff Authentication ──────────────────────────────────

  async staffLogin(email: string, pass: string) {
    const staff = await this.prisma.staffUser.findUnique({
      where: { email },
    });

    if (!staff) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(pass, staff.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: staff.id,
      email: staff.email,
      role: staff.role,
      hotelId: staff.hotelId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: 86400, // 24h
      role: staff.role,
    };
  }

  // ─── Guest Authentication ──────────────────────────────────

  async guestLogin(bookingCode: string, lastName: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { bookingCode },
      include: {
        guest: true,
        checkIn: true,
      },
    });

    if (!reservation) {
      throw new UnauthorizedException('Reserva no encontrada');
    }

    const cleanLastName = reservation.guest.lastName.trim().toLowerCase();
    const enteredLastName = lastName.trim().toLowerCase();

    if (!cleanLastName.includes(enteredLastName) && !enteredLastName.includes(cleanLastName)) {
      throw new UnauthorizedException('Apellido no coincide con la reserva');
    }

    const payload = {
      sub: reservation.guest.id,
      email: reservation.guest.email,
      role: UserRole.GUEST,
      bookingCode: reservation.bookingCode,
      hotelId: reservation.hotelId,
      guestId: reservation.guest.id,
      checkInId: reservation.checkIn?.id,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: 86400,
      role: UserRole.GUEST,
    };
  }

  // ─── Auth Challenge Management ──────────────────────────────

  async generateChallenge(checkInId: string, type: AuthChallengeType) {
    const checkIn = await this.prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: { reservation: { include: { guest: true } } },
    });

    if (!checkIn) {
      throw new NotFoundException('Check-in no encontrado');
    }

    // Deactivate existing challenges for this checkIn
    await this.prisma.authChallenge.updateMany({
      where: { checkInId, used: false },
      data: { used: true },
    });

    let rawValue = '';
    let displayValue = '';

    if (type === AuthChallengeType.OTP) {
      // 6-digit code
      rawValue = Math.floor(100000 + Math.random() * 900000).toString();
      displayValue = `Code sent to preferred channel`;
      // Send code using notification adapter
      const guest = checkIn.reservation.guest;
      await this.notificationPort.sendOtp(guest.email, rawValue);
    } else {
      // QR code value
      rawValue = `QR-CHALLENGE-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      displayValue = rawValue;
    }

    const valueHash = crypto.createHash('sha256').update(rawValue).digest('hex');
    const expiryMinutes = type === AuthChallengeType.OTP ? 5 : 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const challenge = await this.prisma.authChallenge.create({
      data: {
        checkInId,
        type,
        valueHash,
        expiresAt,
      },
    });

    await this.auditService.logEvent(
      AuditEventType.AUTH_ATTEMPTED,
      checkIn.reservation.guestId,
      UserRole.GUEST,
      `Desafío de tipo ${type} generado para el check-in: ${checkInId}`,
    );

    return {
      id: challenge.id,
      type,
      displayValue,
      expiresAt: expiresAt.toISOString(),
      remainingAttempts: 3,
    };
  }

  async verifyChallenge(challengeId: string, type: AuthChallengeType, value: string) {
    const challenge = await this.prisma.authChallenge.findUnique({
      where: { id: challengeId },
      include: { checkIn: { include: { reservation: true } } },
    });

    if (!challenge || challenge.type !== type || challenge.used) {
      throw new UnauthorizedException('Desafío no válido o expirado');
    }

    if (new Date() > challenge.expiresAt) {
      await this.prisma.authChallenge.update({
        where: { id: challengeId },
        data: { used: true },
      });
      throw new UnauthorizedException('El desafío ha expirado');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      await this.prisma.authChallenge.update({
        where: { id: challengeId },
        data: { used: true },
      });
      throw new UnauthorizedException('Se excedió el número máximo de intentos');
    }

    const hashedInput = crypto.createHash('sha256').update(value.trim()).digest('hex');

    if (challenge.valueHash !== hashedInput) {
      const updated = await this.prisma.authChallenge.update({
        where: { id: challengeId },
        data: { attempts: { increment: 1 } },
      });

      await this.auditService.logEvent(
        AuditEventType.AUTH_FAILED,
        challenge.checkIn.reservation.guestId,
        UserRole.GUEST,
        `Fallo de autenticación con ${type}. Intento ${updated.attempts}/${challenge.maxAttempts}`,
      );

      if (updated.attempts >= challenge.maxAttempts) {
        await this.prisma.authChallenge.update({
          where: { id: challengeId },
          data: { used: true },
        });
        throw new UnauthorizedException('Se excedió el número máximo de intentos. Solicite uno nuevo.');
      }

      throw new UnauthorizedException('Código o QR inválido');
    }

    // Success! Mark challenge as used
    await this.prisma.authChallenge.update({
      where: { id: challengeId },
      data: { used: true },
    });

    // Update CheckIn status to authenticated
    await this.prisma.checkIn.update({
      where: { id: challenge.checkInId },
      data: {
        status: 'AUTENTICADO',
        authenticatedAt: new Date(),
      },
    });

    await this.auditService.logEvent(
      AuditEventType.AUTH_SUCCEEDED,
      challenge.checkIn.reservation.guestId,
      UserRole.GUEST,
      `Autenticación exitosa mediante ${type} para check-in: ${challenge.checkInId}`,
    );

    return true;
  }
}
