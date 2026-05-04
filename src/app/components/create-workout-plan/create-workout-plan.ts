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
  
  @Input() planToEdit: WorkoutPlan | null = null;
  @Output() planCreated = new EventEmitter<void>();

  planName: string = '';
  
  // CAMBIO 1: Inicializamos con null para que los placeholders se muestren
  exercises: Exercise[] = [{ name: '', sets: null, reps: null }];

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    if (this.planToEdit) {
      this.planName = this.planToEdit.planName;
      this.exercises = JSON.parse(JSON.stringify(this.planToEdit.exercises));
    }
  }

  addExercise() {
    // CAMBIO 2: Al añadir nuevos ejercicios, también usamos null
    this.exercises.push({ name: '', sets: null, reps: null });
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

      // CAMBIO 3: Al reiniciar el formulario tras guardar, volvemos a usar null
      this.planName = '';
      this.exercises = [{ name: '', sets: null, reps: null }];
      this.planCreated.emit();

    } catch (error) {
      console.error('Error saving plan', error);
      alert('Failed to save workout plan.');
    }
  }
}