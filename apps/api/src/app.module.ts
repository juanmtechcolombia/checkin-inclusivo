import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AuthModule } from './modules/auth/auth.module';
import { GuestModule } from './modules/guest/guest.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { CheckInModule } from './modules/checkin/checkin.module';
import { HotelModule } from './modules/hotel/hotel.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    IntegrationsModule,
    AuthModule,
    GuestModule,
    ReservationModule,
    CheckInModule,
    HotelModule,
    AuditModule,
  ],
})
export class AppModule {}
