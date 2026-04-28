export type MeetingStatus = 'pending' | 'confirmed' | 'rejected';

export interface Meeting {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  description: string;
  slotId: string;
  slotTime: string;
  slotDate: string;
  paymentProofUrl: string;
  status: MeetingStatus;
  createdAt: string;
  meetingLink?: string;
}

export interface Slot {
  id: string;
  date: string;
  time: string;
  isAvailable: boolean;
}

export interface User {
  id: string;
  email: string;
  role: 'client' | 'admin';
  name?: string;
}