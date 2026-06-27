import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { GuestService } from './guest.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AccessibilityPreferences, UserRole } from '@checkin/shared';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsString, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class AccessibilityPreferencesDto implements AccessibilityPreferences {
  @IsBoolean()
  textOnly!: boolean;

  @IsBoolean()
  highContrast!: boolean;

  @IsBoolean()
  reducedMotion!: boolean;

  @IsBoolean()
  screenReader!: boolean;

  @IsString()
  @IsNotEmpty()
  preferredChannel!: 'text' | 'email';
}

class UpdatePrefsDto {
  @ValidateNested()
  @Type(() => AccessibilityPreferencesDto)
  accessibilityPreferences!: AccessibilityPreferencesDto;
}

class SaveSensitiveDto {
  @IsString()
  @IsNotEmpty()
  dataType!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;
}

@ApiTags('Guests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/guests')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current guest profile (Guest or Staff)' })
  @ApiResponse({ status: 200, description: 'Guest profile data' })
  async getProfile(@GetUser() user: any) {
    let targetId = user.id;
    // If user is Staff, they must specify the guest ID, but for the MVP, the guest token fetches their own
    if (user.role === UserRole.STAFF || user.role === UserRole.ADMIN) {
      // In a full implementation staff might query by query param, here we just return the logged-in entity
      throw new UnauthorizedException('El personal debe consultar huéspedes a través de Reservaciones');
    }
    const guest = await this.guestService.getGuest(targetId);
    return {
      success: true,
      data: guest,
    };
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update guest accessibility preferences' })
  async updatePreferences(@Body() dto: UpdatePrefsDto, @GetUser() user: any) {
    if (user.role === UserRole.STAFF || user.role === UserRole.ADMIN) {
      throw new UnauthorizedException('Solo el huésped puede modificar sus preferencias');
    }
    const guest = await this.guestService.updateAccessibilityPreferences(user.guestId, dto.accessibilityPreferences);
    return {
      success: true,
      data: guest,
    };
  }

  @Post('sensitive')
  @ApiOperation({ summary: 'Save guest sensitive data (crypted in database)' })
  async saveSensitive(@Body() dto: SaveSensitiveDto, @GetUser() user: any) {
    if (user.role === UserRole.STAFF || user.role === UserRole.ADMIN) {
      throw new UnauthorizedException('Solo el huésped puede subir sus datos sensibles');
    }
    await this.guestService.saveSensitiveData(user.guestId, dto.dataType, dto.value);
    return {
      success: true,
      message: 'Datos guardados de forma segura y cifrada.',
    };
  }

  @Get('sensitive/:dataType')
  @ApiOperation({ summary: 'Retrieve decrypted sensitive data (Authorized only)' })
  async getSensitive(@Param('dataType') dataType: string, @GetUser() user: any) {
    // Both guest and staff/admin can read sensitive data (e.g. for check-in validation)
    const guestId = user.role === UserRole.GUEST ? user.guestId : null; // Staff would pass guestId differently, for MVP guest fetches their own
    if (!guestId) {
      throw new UnauthorizedException('Debe estar autenticado como el huésped correspondiente');
    }
    const value = await this.guestService.getSensitiveData(guestId, dataType);
    return {
      success: true,
      data: value,
    };
  }

  @Delete('purge')
  @ApiOperation({ summary: 'Purge all guest sensitive data from the vault (Right to be forgotten)' })
  async purgeData(@GetUser() user: any) {
    if (user.role === UserRole.GUEST) {
      await this.guestService.deleteGuestData(user.guestId);
      return {
        success: true,
        message: 'Todos tus datos sensibles han sido purgados de la base de datos.',
      };
    }
    throw new UnauthorizedException('Solo el huésped puede solicitar purgar sus datos');
  }
}
