import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { WorkoutPlan } from '../../models/gym.models';

@Component({
  selector: 'app-my-workout-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-workout-plans.html',
  styleUrls: ['./my-workout-plans.css']
})
export class MyWorkoutPlansComponent implements OnInit {
  myPlans: WorkoutPlan[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadMyPlans();
  }

  async loadMyPlans() {
    const currentUser = this.firebaseService.getCurrentUser();
    this.myPlans = await this.firebaseService.getTraineeWorkoutPlans(currentUser.id);
    this.cdr.detectChanges();
  }

  // NUEVO: Función para quitar un plan
  async removePlan(planId: string | undefined) {
    if (!planId) return;

    // Preguntamos al usuario para confirmar
    const confirmDelete = confirm('¿Estás seguro de que quieres quitar este Workout Plan?');
    
    if (confirmDelete) {
      try {
        await this.firebaseService.deleteWorkoutPlan(planId);
        // Volvemos a cargar los planes para que desaparezca de la pantalla
        this.loadMyPlans(); 
      } catch (error) {
        console.error('Error removing plan', error);
      }
    }
  }
}