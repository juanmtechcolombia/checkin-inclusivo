import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { HotelService } from './hotel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@checkin/shared';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsArray, IsNotEmpty } from 'class-validator';

class ToggleLobbyDto {
  @IsBoolean()
  enabled!: boolean;
}

class UpdateConfigDto {
  @IsArray()
  @IsNotEmpty()
  timeWindows!: any[];

  @IsArray()
  @IsNotEmpty()
  consentTexts!: any[];
}

@ApiTags('Hotel')
@Controller('api/hotel')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get hotel config (publicly accessible for consent texts & windows)' })
  async getConfig() {
    // MVP bound to demo hotel ID
    const config = await this.hotelService.getConfig('hotel-sereno-001');
    return {
      success: true,
      data: config,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get administrative dashboard statistics (Staff only)' })
  async getStats() {
    const stats = await this.hotelService.getDashboardStats('hotel-sereno-001');
    return {
      success: true,
      data: stats,
    };
  }

  @Post('config/toggle-lobby')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle quiet lobby mode (Staff only)' })
  async toggleLobby(@Body() dto: ToggleLobbyDto) {
    const config = await this.hotelService.toggleQuietLobby('hotel-sereno-001', dto.enabled);
    return {
      success: true,
      data: config,
    };
  }

  @Put('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update time slots and consent text settings (Staff only)' })
  async updateConfig(@Body() dto: UpdateConfigDto) {
    const config = await this.hotelService.updateConfig('hotel-sereno-001', dto.timeWindows, dto.consentTexts);
    return {
      success: true,
      data: config,
    };
  }
}
