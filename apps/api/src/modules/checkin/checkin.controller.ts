import { Controller, Get, Post, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { CheckInService } from './checkin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ValidateDataDto {
  @IsBoolean()
  consentAccepted!: boolean;

  @IsArray()
  @IsString({ each: true })
  consentScopes!: string[];

  @IsString()
  @IsNotEmpty()
  documentNumber!: string;
}

class TimeWindowDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @IsBoolean()
  available!: boolean;
}

class SelectWindowDto {
  @ValidateNested()
  @Type(() => TimeWindowDto)
  timeWindow!: TimeWindowDto;
}

@ApiTags('CheckIn')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/checkin')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get details and status of a check-in' })
  async getDetails(@Param('id') id: string, @GetUser() user: any) {
    if (user.role === 'GUEST' && user.checkInId !== id) {
      throw new UnauthorizedException('No tienes permiso para consultar este check-in');
    }
    const checkIn = await this.checkInService.getCheckIn(id);
    return {
      success: true,
      data: checkIn,
    };
  }

  @Post(':id/validate-data')
  @ApiOperation({ summary: 'Submit guest validation details & consent text (INVITADO -> DATOS_VALIDADOS)' })
  async validateData(
    @Param('id') id: string,
    @Body() dto: ValidateDataDto,
    @GetUser() user: any,
  ) {
    if (user.role === 'GUEST' && user.checkInId !== id) {
      throw new UnauthorizedException('No tienes permiso para actualizar este check-in');
    }
    const checkIn = await this.checkInService.validateData(
      id,
      dto.consentAccepted,
      dto.consentScopes,
      dto.documentNumber,
    );
    return {
      success: true,
      data: checkIn,
    };
  }

  @Post(':id/select-window')
  @ApiOperation({ summary: 'Select arrival time slot window (DATOS_VALIDADOS -> VENTANA_SELECCIONADA)' })
  async selectWindow(
    @Param('id') id: string,
    @Body() dto: SelectWindowDto,
    @GetUser() user: any,
  ) {
    if (user.role === 'GUEST' && user.checkInId !== id) {
      throw new UnauthorizedException('No tienes permiso para actualizar este check-in');
    }
    const checkIn = await this.checkInService.selectTimeWindow(id, dto.timeWindow);
    return {
      success: true,
      data: checkIn,
    };
  }

  @Post(':id/issue-key')
  @ApiOperation({ summary: 'Issue digital room key card and confirm in PMS (AUTENTICADO -> COMPLETADO)' })
  async issueKey(@Param('id') id: string, @GetUser() user: any) {
    if (user.role === 'GUEST' && user.checkInId !== id) {
      throw new UnauthorizedException('No tienes permiso para emitir la llave para este check-in');
    }
    const checkIn = await this.checkInService.issueKey(id);
    return {
      success: true,
      data: checkIn,
    };
  }

  @Post(':id/open-door')
  @ApiOperation({ summary: 'Simulate opening the room lock with digital key' })
  async openDoor(@Param('id') id: string, @GetUser() user: any) {
    if (user.role === 'GUEST' && user.checkInId !== id) {
      throw new UnauthorizedException('No tienes permiso para abrir esta puerta');
    }
    const result = await this.checkInService.openDoor(id);
    return {
      success: result.success,
      data: result,
    };
  }
}
