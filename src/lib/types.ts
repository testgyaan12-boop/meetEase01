export type MeetingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'done';

export interface Meeting {
  id: string;
  userId?: string; // Optional for guests
  clientName: string;
  clientEmail: string;
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
  isActive: boolean; // Toggle for visibility to users
  meetingId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  meetingId?: string;
  isRead: boolean;
  createdAt: string;
}