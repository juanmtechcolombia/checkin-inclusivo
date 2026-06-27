import { Injectable, Logger } from '@nestjs/common';
import {
  PmsPort,
  PmsReservation,
  PmsAssignResult,
  PmsGuestData,
} from '../ports/pms.port';

/**
 * Mock PMS Adapter — Simulates Oracle OHIP/Opera PMS.
 *
 * This adapter uses an in-memory store to simulate PMS operations.
 * Replace with a real adapter (e.g., OhipPmsAdapter) for production.
 *
 * To swap: change the provider binding in IntegrationsModule.
 */
@Injectable()
export class MockPmsAdapter implements PmsPort {
  private readonly logger = new Logger('MockPmsAdapter');

  /** Simulated room inventory */
  private readonly availableRooms = [
    { roomNumber: '301', floor: 3, type: 'standard' },
    { roomNumber: '302', floor: 3, type: 'standard' },
    { roomNumber: '405', floor: 4, type: 'superior' },
    { roomNumber: '406', floor: 4, type: 'superior' },
    { roomNumber: '501', floor: 5, type: 'suite' },
    { roomNumber: '502', floor: 5, type: 'suite' },
    { roomNumber: '601', floor: 6, type: 'accessible', accessible: true },
  ];

  private assignedRooms = new Set<string>();

  async getReservation(bookingCode: string): Promise<PmsReservation | null> {
    this.logger.log(`[MOCK PMS] Fetching reservation: ${bookingCode}`);

    // Simulate a small delay like a real API
    await this.delay(200);

    // The mock always "finds" the reservation — actual data comes from our DB
    return {
      pmsReservationId: `OHIP-${bookingCode}`,
      bookingCode,
      guestName: 'Guest from PMS',
      checkInDate: new Date().toISOString(),
      checkOutDate: new Date(Date.now() + 86400000).toISOString(),
      roomType: 'standard',
      status: 'CONFIRMED',
    };
  }

  async assignRoom(reservationId: string, roomNumber?: string): Promise<PmsAssignResult> {
    this.logger.log(`[MOCK PMS] Assigning room for reservation: ${reservationId}`);
    await this.delay(300);

    let room: (typeof this.availableRooms)[0] | undefined;

    if (roomNumber) {
      room = this.availableRooms.find(
        (r) => r.roomNumber === roomNumber && !this.assignedRooms.has(r.roomNumber),
      );
    }

    if (!room) {
      room = this.availableRooms.find((r) => !this.assignedRooms.has(r.roomNumber));
    }

    if (!room) {
      this.logger.warn('[MOCK PMS] No rooms available!');
      return { success: false, roomNumber: '', floor: 0 };
    }

    this.assignedRooms.add(room.roomNumber);
    this.logger.log(`[MOCK PMS] Assigned room ${room.roomNumber} (Floor ${room.floor})`);

    return {
      success: true,
      roomNumber: room.roomNumber,
      floor: room.floor,
    };
  }

  async confirmCheckIn(reservationId: string): Promise<boolean> {
    this.logger.log(`[MOCK PMS] Confirming check-in for: ${reservationId}`);
    await this.delay(200);
    this.logger.log(`[MOCK PMS] ✅ Check-in confirmed in PMS`);
    return true;
  }

  async syncGuest(_guestId: string, data: PmsGuestData): Promise<boolean> {
    this.logger.log(
      `[MOCK PMS] Syncing guest: ${data.firstName} ${data.lastName} (${data.email})`,
    );
    await this.delay(100);
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
