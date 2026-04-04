/**
 * User roles in the gym management system
 */
export type UserRole = 'trainer' | 'trainee';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Enhanced GymClass interface with all required fields
 */
export interface GymClass {
  id?: string;
  name: string;
  instructor: string;
  trainerId: string;
  capacity: number;
  startDate: string; // ISO date string
  startTime: string; // HH:mm format
  attendees?: string[]; // Array of trainee IDs
  createdAt?: string;
}

/**
 * Reservation/Booking interface
 */
export interface Reservation {
  id?: string;
  classId: string;
  traineeId: string;
  traineeName: string;
  className: string;
  classStartDate: string;
  classStartTime: string;
  bookedAt: string;
}
