export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Reservation {
  id: string;
  userId: string;
  labId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  endTime: string; // HH:mm (24-hour)
  purpose: string;
  status: ReservationStatus;
  createdAt: string;
  adminNotes?: string;
  user?: { name: string; email: string };
  lab?: { name: string };
}
