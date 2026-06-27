/**
 * PMS Port — Interface for Property Management System integration.
 *
 * This port abstracts the PMS (e.g., Oracle OHIP/Opera) so the domain logic
 * is completely decoupled from any specific PMS implementation.
 *
 * To integrate a real PMS:
 * 1. Create a new adapter implementing this interface (e.g., OhipPmsAdapter)
 * 2. Replace the MockPmsAdapter binding in IntegrationsModule
 * 3. No changes needed in business logic
 */
export interface PmsPort {
  /** Fetch a reservation by booking code from the PMS */
  getReservation(bookingCode: string): Promise<PmsReservation | null>;

  /** Assign a room to a reservation */
  assignRoom(reservationId: string, roomNumber?: string): Promise<PmsAssignResult>;

  /** Confirm check-in in the PMS */
  confirmCheckIn(reservationId: string): Promise<boolean>;

  /** Sync guest data with the PMS */
  syncGuest(guestId: string, data: PmsGuestData): Promise<boolean>;
}

export interface PmsReservation {
  pmsReservationId: string;
  bookingCode: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  roomNumber?: string;
  status: string;
}

export interface PmsAssignResult {
  success: boolean;
  roomNumber: string;
  floor: number;
}

export interface PmsGuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentNumber?: string;
}

/** DI token for PmsPort */
export const PMS_PORT = Symbol('PMS_PORT');
