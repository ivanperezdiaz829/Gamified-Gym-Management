import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GymClass, Reservation } from '../../models/gym.models';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-book-classes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-classes.html',
  styleUrl: './book-classes.css'
})
export class BookClassesComponent implements OnInit {
  availableClasses = signal<GymClass[]>([]);
  myReservations = signal<Reservation[]>([]);
  isLoading = signal(false);

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.loadAvailableClasses(),
        this.loadMyReservations()
      ]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadAvailableClasses(): Promise<void> {
    try {
      const allClasses = await this.firebaseService.getClasses();
      const currentUser = this.firebaseService.getCurrentUser();
      const myReservations = await this.firebaseService.getTraineeReservations(currentUser.id);
      const reservedClassIds = new Set(myReservations.map(r => r.classId));

      // Filter out classes that:
      // - have already started
      // - are full
      // - user already booked
      const available = allClasses.filter(gymClass => {
        const hasStarted = this.firebaseService.hasClassStarted(gymClass);
        const isFull = this.firebaseService.isClassFull(gymClass);
        const alreadyBooked = reservedClassIds.has(gymClass.id || '');

        return !hasStarted && !isFull && !alreadyBooked;
      });

      this.availableClasses.set(available);
    } catch (error) {
      console.error('Error loading available classes:', error);
      alert('Failed to load available classes');
    }
  }

  async loadMyReservations(): Promise<void> {
    try {
      const currentUser = this.firebaseService.getCurrentUser();
      const reservations = await this.firebaseService.getTraineeReservations(currentUser.id);
      this.myReservations.set(reservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
      alert('Failed to load your reservations');
    }
  }

  async bookClass(gymClass: GymClass): Promise<void> {
    if (!gymClass.id) {
      alert('Invalid class');
      return;
    }

    // Double-check class hasn't started and isn't full
    if (this.firebaseService.hasClassStarted(gymClass)) {
      alert('This class has already started');
      await this.loadData();
      return;
    }

    if (this.firebaseService.isClassFull(gymClass)) {
      alert('This class is full');
      await this.loadData();
      return;
    }

    try {
      const currentUser = this.firebaseService.getCurrentUser();

      const reservation: Omit<Reservation, 'id'> = {
        classId: gymClass.id,
        traineeId: currentUser.id,
        traineeName: currentUser.name,
        className: gymClass.name,
        classStartDate: gymClass.startDate,
        classStartTime: gymClass.startTime,
        bookedAt: new Date().toISOString()
      };

      await this.firebaseService.createReservation(reservation);
      alert('Class booked successfully!');

      await this.loadData();
    } catch (error) {
      console.error('Error booking class:', error);
      alert('Failed to book class');
    }
  }

  getAvailableSpots(gymClass: GymClass): number {
    const attendees = gymClass.attendees || [];
    return gymClass.capacity - attendees.length;
  }
}
