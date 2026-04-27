// 1. Añade Input a tus importaciones
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { Exercise, WorkoutPlan } from '../../models/gym.models';

@Component({
  selector: 'app-create-workout-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-workout-plan.html',
  styleUrls: ['./create-workout-plan.css']
})
export class CreateWorkoutPlanComponent implements OnInit {
  
  // 2. Recibe el plan si estamos en modo edición
  @Input() planToEdit: WorkoutPlan | null = null;
  @Output() planCreated = new EventEmitter<void>();

  planName: string = '';
  exercises: Exercise[] = [{ name: '', sets: 0, reps: 0 }];

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    // 3. Si recibimos un plan para editar, rellenamos el formulario
    if (this.planToEdit) {
      this.planName = this.planToEdit.planName;
      // Hacemos una copia profunda de los ejercicios para no modificar el original hasta que no le demos a guardar
      this.exercises = JSON.parse(JSON.stringify(this.planToEdit.exercises));
    }
  }

  addExercise() {
    this.exercises.push({ name: '', sets: 0, reps: 0 });
  }

  removeExercise(index: number) {
    this.exercises.splice(index, 1);
  }

  async submitPlan() {
    if (!this.planName || this.exercises.length === 0) {
      alert("Please fill out all fields and add at least one exercise.");
      return;
    }

    try {
      if (this.planToEdit && this.planToEdit.id) {
        // MODO EDICIÓN
        await this.firebaseService.updateWorkoutPlan(this.planToEdit.id, {
          planName: this.planName,
          exercises: this.exercises
        });
        alert('Workout plan actualizado correctamente!');
      } else {
        // MODO CREACIÓN
        const currentUser = this.firebaseService.getCurrentUser();
        const newPlan: WorkoutPlan = {
          trainerId: currentUser.id,
          planName: this.planName,
          exercises: this.exercises,
          createdAt: new Date()
        };
        await this.firebaseService.assignWorkoutPlan(newPlan);
        alert('Workout plan guardado correctamente!');
      }

      // Limpiamos y avisamos de que hemos terminado
      this.planName = '';
      this.exercises = [{ name: '', sets: 0, reps: 0 }];
      this.planCreated.emit();

    } catch (error) {
      console.error('Error saving plan', error);
      alert('Failed to save workout plan.');
    }
  }
}