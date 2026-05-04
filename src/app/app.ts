import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Tus importaciones originales
import { CreateClassesComponent } from './components/create-classes/create-classes';
import { BookClassesComponent } from './components/book-classes/book-classes';
import { CancelReservationsComponent } from './components/cancel-reservations/cancel-reservations';
import { FirebaseService } from './services/firebase.service';
import { WorkoutZoneComponent } from './components/workout-plan-page/workout-plan-page';
import { MyWorkoutPlansComponent } from './components/my-workout-plans/my-workout-plans';

// Importaciones de los nuevos componentes de Gamificación y Modelos
import { LeaderboardComponent } from './components/leaderboard/leaderboard';
import { AwardPointsComponent } from './components/award-points/award-points';
import { UserNotification } from './models/gym.models';

type ViewType = 'create' | 'workout-zone' | 'book' | 'cancel' | 'my-plans' | 'leaderboard' | 'award-points';

@Component({
  selector: 'app-root',
  standalone: true, // Siempre recomendado con la nueva sintaxis
  imports: [
    RouterOutlet,
    CreateClassesComponent,
    BookClassesComponent,
    CancelReservationsComponent,
    WorkoutZoneComponent,
    MyWorkoutPlansComponent,
    LeaderboardComponent,     // Añadido
    AwardPointsComponent      // Añadido
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Gamified-Gym-Management');
  protected currentView = signal<ViewType>('create');
  protected currentUserRole = signal<'trainer' | 'trainee'>('trainer');
  
  // NUEVO: Usamos un signal para las notificaciones, mucho más limpio
  protected unreadNotifications = signal<UserNotification[]>([]);

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    // Al iniciar, le pasamos el rol inicial al servicio y comprobamos notificaciones
    this.firebaseService.setCurrentUser(this.currentUserRole(), `Test ${this.currentUserRole()}`);
    this.checkNotifications();
  }

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

    // NUEVO: Revisamos notificaciones pendientes al cambiar de rol
    this.checkNotifications();
  }

  // NUEVO: Busca en la base de datos si el Trainee tiene avisos
  async checkNotifications() {
    // Como currentUserRole es un signal, lo leemos con ()
    if (this.currentUserRole() === 'trainee') {
      const user = this.firebaseService.getCurrentUser();
      const notifs = await this.firebaseService.getUnreadNotifications(user.id);
      this.unreadNotifications.set(notifs); // Actualizamos el signal
    } else {
      this.unreadNotifications.set([]); // El trainer no ve estos avisos
    }
  }

  // NUEVO: Oculta el aviso al hacer clic
  async dismissNotification(id: string) {
    await this.firebaseService.markNotificationAsRead(id);
    this.checkNotifications(); // Recargamos
  }
}