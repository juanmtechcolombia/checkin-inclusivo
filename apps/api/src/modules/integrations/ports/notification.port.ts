/**
 * Notification Port — Interface for notification delivery.
 *
 * Abstracts notification channels (email, push, SMS) so the domain
 * logic doesn't depend on specific notification services.
 */
export interface NotificationPort {
  /** Send the pre-check-in link to a guest */
  sendPreCheckInLink(email: string, bookingCode: string, link: string): Promise<boolean>;

  /** Send an OTP code to a guest */
  sendOtp(email: string, code: string): Promise<boolean>;

  /** Notify guest that their digital key was issued */
  sendKeyIssued(email: string, roomNumber: string): Promise<boolean>;

  /** Send a generic notification */
  sendNotification(email: string, subject: string, message: string): Promise<boolean>;
}

/** DI token for NotificationPort */
export const NOTIFICATION_PORT = Symbol('NOTIFICATION_PORT');
