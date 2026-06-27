import { Module } from '@nestjs/common';
import { PMS_PORT } from './ports/pms.port';
import { MockPmsAdapter } from './adapters/mock-pms.adapter';
import { LOCK_PORT } from './ports/lock.port';
import { MockLockAdapter } from './adapters/mock-lock.adapter';
import { NOTIFICATION_PORT } from './ports/notification.port';
import { MockNotificationAdapter } from './adapters/mock-notification.adapter';

@Module({
  providers: [
    {
      provide: PMS_PORT,
      useClass: MockPmsAdapter,
    },
    {
      provide: LOCK_PORT,
      useClass: MockLockAdapter,
    },
    {
      provide: NOTIFICATION_PORT,
      useClass: MockNotificationAdapter,
    },
  ],
  exports: [PMS_PORT, LOCK_PORT, NOTIFICATION_PORT],
})
export class IntegrationsModule {}
