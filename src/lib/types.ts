export type MeetingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'done';

export interface Meeting {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientMobile: string;
  description: string;
  availableSlotId: string;
  paymentProofUrl: string;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
  meetingLink?: string;
  adminNotes?: string;
  slotStartTime?: string;
  slotEndTime?: string;
}

export interface AvailableSlot {
  id: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isBooked: boolean;
  meetingId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}
