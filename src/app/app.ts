import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CreateClassesComponent } from './components/create-classes/create-classes';
import { BookClassesComponent } from './components/book-classes/book-classes';
import { CancelReservationsComponent } from './components/cancel-reservations/cancel-reservations';
import { FirebaseService } from './services/firebase.service';
import { WorkoutZoneComponent } from './components/workout-plan-page/workout-plan-page';

// Updated 'create-plan' to 'workout-zone'
type ViewType = 'create' | 'workout-zone' | 'book' | 'cancel';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CreateClassesComponent,
    BookClassesComponent,
    CancelReservationsComponent,
    WorkoutZoneComponent // Replaced CreateWorkoutPlanComponent with WorkoutZoneComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Gamified-Gym-Management');
  protected currentView = signal<ViewType>('create');
  protected currentUserRole = signal<'trainer' | 'trainee'>('trainer');

  constructor(private firebaseService: FirebaseService) {}

  setView(view: ViewType): void {
    this.currentView.set(view);
  }

  switchRole(role: 'trainer' | 'trainee'): void {
    this.currentUserRole.set(role);
    this.firebaseService.setCurrentUser(role, `Test ${role}`);

    // Switch to appropriate default view
    if (role === 'trainer') {
      this.currentView.set('create');
    } else {
      this.currentView.set('book');
    }
  }
}