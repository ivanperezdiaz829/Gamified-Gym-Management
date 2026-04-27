import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { Exercise, WorkoutPlan, User } from '../../models/gym.models';

@Component({
  selector: 'app-create-workout-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-workout-plan.html',
  styleUrls: ['./create-workout-plan.css']
})
export class CreateWorkoutPlanComponent implements OnInit {
  trainees: User[] = [];
  selectedTraineeId: string = '';
  planName: string = '';
  
  // Start with one empty exercise row
  exercises: Exercise[] = [{ name: '', sets: 0, reps: 0 }];

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.loadTrainees();
  }

  async loadTrainees() {
    try {
      this.trainees = await this.firebaseService.getTrainees();
    } catch (error) {
      console.error('Error loading trainees:', error);
    }
  }

  addExercise() {
    this.exercises.push({ name: '', sets: 0, reps: 0 });
  }

  removeExercise(index: number) {
    this.exercises.splice(index, 1);
  }

async submitPlan() {
    // REMOVED the !this.selectedTraineeId check here:
    if (!this.planName || this.exercises.length === 0) {
      alert("Please fill out all fields and add at least one exercise.");
      return;
    }

    const currentUser = this.firebaseService.getCurrentUser();

    const newPlan: WorkoutPlan = {
      trainerId: currentUser.id,
      // We don't need a traineeId here anymore since it's just a template!
      planName: this.planName,
      exercises: this.exercises,
      createdAt: new Date() 
    };

    try {
      await this.firebaseService.assignWorkoutPlan(newPlan);
      alert('Workout plan saved successfully!');
      
      // Reset the form
      this.planName = '';
      this.exercises = [{ name: '', sets: 0, reps: 0 }];
      
    } catch (error) {
      console.error('Error saving plan', error);
      alert('Failed to save workout plan.');
    }
  }
}