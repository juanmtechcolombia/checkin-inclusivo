import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@checkin/shared';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Reservations')
@Controller('api/reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get('lookup/:bookingCode')
  @ApiOperation({ summary: 'Lookup reservation by booking code (PMS + local DB sync)' })
  @ApiResponse({ status: 200, description: 'Reservation details' })
  async lookup(@Param('bookingCode') bookingCode: string) {
    const reservation = await this.reservationService.getReservation(bookingCode);
    return {
      success: true,
      data: reservation,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reservations (Staff only)' })
  async getAll() {
    const list = await this.reservationService.getAllReservations();
    return {
      success: true,
      data: list,
    };
  }

  @Post(':id/send-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send pre-check-in link to guest email (Staff only)' })
  async sendLink(@Param('id') id: string) {
    await this.reservationService.sendPreCheckInLink(id);
    return {
      success: true,
      message: 'Enlace de pre-check-in enviado exitosamente.',
    };
  }
}
