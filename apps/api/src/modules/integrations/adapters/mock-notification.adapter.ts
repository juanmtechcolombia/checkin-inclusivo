import { Injectable, Logger } from '@nestjs/common';
import { NotificationPort } from '../ports/notification.port';

/**
 * Mock Notification Adapter — Logs all notifications to console.
 *
 * In production, replace with a real adapter (SendGrid, AWS SES, Firebase Cloud Messaging, etc.)
 */
@Injectable()
export class MockNotificationAdapter implements NotificationPort {
  private readonly logger = new Logger('MockNotificationAdapter');

  async sendPreCheckInLink(email: string, bookingCode: string, link: string): Promise<boolean> {
    this.logger.log('═══════════════════════════════════════════════');
    this.logger.log('📧 [MOCK EMAIL] Pre-Check-In Link');
    this.logger.log(`   To: ${email}`);
    this.logger.log(`   Booking: ${bookingCode}`);
    this.logger.log(`   Link: ${link}`);
    this.logger.log('═══════════════════════════════════════════════');
    return true;
  }

  async sendOtp(email: string, code: string): Promise<boolean> {
    this.logger.log('═══════════════════════════════════════════════');
    this.logger.log('🔑 [MOCK EMAIL] OTP Code');
    this.logger.log(`   To: ${email}`);
    this.logger.log(`   Code: ${code}`);
    this.logger.log('═══════════════════════════════════════════════');
    return true;
  }

  async sendKeyIssued(email: string, roomNumber: string): Promise<boolean> {
    this.logger.log('═══════════════════════════════════════════════');
    this.logger.log('🗝️  [MOCK EMAIL] Digital Key Issued');
    this.logger.log(`   To: ${email}`);
    this.logger.log(`   Room: ${roomNumber}`);
    this.logger.log('═══════════════════════════════════════════════');
    return true;
  }

  async sendNotification(email: string, subject: string, message: string): Promise<boolean> {
    this.logger.log('═══════════════════════════════════════════════');
    this.logger.log(`📬 [MOCK EMAIL] ${subject}`);
    this.logger.log(`   To: ${email}`);
    this.logger.log(`   Message: ${message}`);
    this.logger.log('═══════════════════════════════════════════════');
    return true;
  }
}
