import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { WorkoutPlan, User } from '../../models/gym.models';
import { CreateWorkoutPlanComponent } from '../create-workout-plan/create-workout-plan';

@Component({
  selector: 'app-workout-zone',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateWorkoutPlanComponent],
  templateUrl: './workout-plan-page.html',
  styleUrls: ['./workout-plan-page.css']
})
export class WorkoutZoneComponent implements OnInit {
  viewMode: 'list' | 'create' = 'list';
  plans: WorkoutPlan[] = [];
  trainees: User[] = [];
  selectedTraineeForPlan: { [planId: string]: string } = {};
  planToEdit: WorkoutPlan | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const currentUser = this.firebaseService.getCurrentUser();
    
    // 1. Cargar trainees
    this.trainees = await this.firebaseService.getTrainees();
    
    // 2. Cargar todos los planes y filtrar para quedarnos solo con las "plantillas" (las que no tienen traineeId)
    const allPlans = await this.firebaseService.getTrainerWorkoutPlans(currentUser.id);
    this.plans = allPlans.filter(plan => !plan.traineeId);

    // 3. Auto-seleccionar al trainee por defecto para todos los planes
    if (this.trainees.length > 0) {
      const defaultTraineeId = this.trainees[0].id;
      this.plans.forEach(plan => {
        if (plan.id) {
          this.selectedTraineeForPlan[plan.id] = defaultTraineeId;
        }
      });
    }

    // 4. Obligamos a Angular a actualizar la pantalla con los nuevos datos
    this.cdr.detectChanges(); 
  }

  async assignPlan(plan: WorkoutPlan) {
    if (!plan.id) return;

    const traineeId = this.selectedTraineeForPlan[plan.id];
    
    if (!traineeId) {
      alert('Please select a trainee first!');
      return;
    }

    // Duplicar la plantilla del plan y asignársela al trainee seleccionado
    const assignedPlan: WorkoutPlan = {
      ...plan,
      traineeId: traineeId,
      createdAt: new Date()
    };
    
    // Eliminamos el ID antiguo para que el servicio (o Firebase) genere uno nuevo para esta asignación
    delete assignedPlan.id; 

    try {
      await this.firebaseService.assignWorkoutPlan(assignedPlan);
      alert('Plan successfully assigned to trainee!');
      // Opcional: podrías recargar datos aquí si quieres, pero no es estrictamente necesario
    } catch (error) {
      console.error('Error assigning plan', error);
      alert('Hubo un error al asignar el plan.');
    }
  }

  // Función para abrir el formulario LIMPIO
  openCreateMode() {
    this.planToEdit = null;
    this.viewMode = 'create';
  }

  // Función para abrir el formulario CON DATOS
  editPlan(plan: WorkoutPlan) {
    this.planToEdit = plan;
    this.viewMode = 'create';
  }

  // Función para borrar
  async deletePlan(planId: string | undefined) {
    if (!planId) return;
    if (confirm('¿Estás seguro de que quieres borrar esta plantilla? Los trainees que ya la tengan asignada no la perderán.')) {
      await this.firebaseService.deleteWorkoutPlan(planId);
      this.loadData();
    }
  }

  onPlanCreated() {
    this.viewMode = 'list';
    this.loadData();
  }
}