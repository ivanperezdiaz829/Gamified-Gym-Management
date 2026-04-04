import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reservation } from '../../models/gym.models';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-cancel-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancel-reservations.html',
  styleUrl: './cancel-reservations.css'
})
export class CancelReservationsComponent implements OnInit {
  myReservations = signal<Reservation[]>([]);
  isLoading = signal(false);

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  async loadReservations(): Promise<void> {
    this.isLoading.set(true);
    try {
      const currentUser = this.firebaseService.getCurrentUser();
      const reservations = await this.firebaseService.getTraineeReservations(currentUser.id);

      // Filter to only show future reservations (classes that haven't started yet)
      const futureReservations = reservations.filter(reservation => {
        const classDateTime = new Date(`${reservation.classStartDate}T${reservation.classStartTime}`);
        return classDateTime > new Date();
      });

      this.myReservations.set(futureReservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
      alert('Failed to load your reservations');
    } finally {
      this.isLoading.set(false);
    }
  }

  canCancel(reservation: Reservation): boolean {
    const classDateTime = new Date(`${reservation.classStartDate}T${reservation.classStartTime}`);
    return classDateTime > new Date();
  }

  async cancelReservation(reservation: Reservation): Promise<void> {
    if (!reservation.id) {
      alert('Invalid reservation');
      return;
    }

    // Double-check the class hasn't started
    if (!this.canCancel(reservation)) {
      alert('Cannot cancel a reservation for a class that has already started');
      await this.loadReservations();
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to cancel your reservation for "${reservation.className}" on ${reservation.classStartDate} at ${reservation.classStartTime}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.firebaseService.deleteReservation(
        reservation.id,
        reservation.classId,
        reservation.traineeId
      );

      alert('Reservation cancelled successfully!');
      await this.loadReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Failed to cancel reservation');
    }
  }
}
