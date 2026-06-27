import { Controller, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { AuthChallengeType } from '@checkin/shared';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

class StaffLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

class GuestLoginDto {
  @IsString()
  @IsNotEmpty()
  bookingCode!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;
}

class RequestChallengeDto {
  @IsString()
  @IsNotEmpty()
  checkInId!: string;

  @IsEnum(AuthChallengeType)
  type!: AuthChallengeType;
}

class VerifyChallengeDto {
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @IsEnum(AuthChallengeType)
  type!: AuthChallengeType;

  @IsString()
  @IsNotEmpty()
  value!: string;
}

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('staff/login')
  @ApiOperation({ summary: 'Login for hotel staff members' })
  @ApiResponse({ status: 200, description: 'Successful staff login' })
  async staffLogin(@Body() dto: StaffLoginDto) {
    const result = await this.authService.staffLogin(dto.email, dto.password);
    return {
      success: true,
      data: result,
    };
  }

  @Post('guest/login')
  @ApiOperation({ summary: 'Login/access token for guests using booking code & last name' })
  @ApiResponse({ status: 200, description: 'Successful guest login' })
  async guestLogin(@Body() dto: GuestLoginDto) {
    const result = await this.authService.guestLogin(dto.bookingCode, dto.lastName);
    return {
      success: true,
      data: result,
    };
  }

  @Post('challenge/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request OTP or QR authentication challenge' })
  @ApiResponse({ status: 201, description: 'Challenge generated successfully' })
  async requestChallenge(@Body() dto: RequestChallengeDto, @GetUser() user: any) {
    // Ensure the guest is requesting for their own check-in session
    if (user.role === 'GUEST' && user.checkInId !== dto.checkInId) {
      throw new UnauthorizedException('No tienes permiso para solicitar un desafío para este check-in');
    }
    const result = await this.authService.generateChallenge(dto.checkInId, dto.type);
    return {
      success: true,
      data: result,
    };
  }

  @Post('challenge/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify OTP or QR code input' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyChallenge(@Body() dto: VerifyChallengeDto, @GetUser() user: any) {
    // Challenge verification changes the state machine to authenticated
    const result = await this.authService.verifyChallenge(dto.challengeId, dto.type, dto.value);
    return {
      success: result,
      message: 'Desafío verificado exitosamente. Huésped autenticado.',
    };
  }
}
