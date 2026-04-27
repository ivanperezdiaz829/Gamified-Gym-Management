import { Component, OnInit } from '@angular/core';
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
  
  // Maps plan IDs to the currently selected trainee in the dropdown
  selectedTraineeForPlan: { [planId: string]: string } = {};

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.loadData();
  }

async loadData() {
    const currentUser = this.firebaseService.getCurrentUser();
    
    try {
      // 1. Try to load real data from Firebase
      this.trainees = await this.firebaseService.getTrainees();
      const allPlans = await this.firebaseService.getTrainerWorkoutPlans(currentUser.id);
      this.plans = allPlans.filter(plan => !plan.traineeId);
      
    } catch (error) {
      // 2. If Firebase fails (like your 400 error), catch it and load Mock Data!
      console.error('Firebase failed, loading mock data for UI testing:', error);
      
      this.trainees = [{
        id: 'trainee-001',
        email: 'trainee@gym.com',
        name: 'Mock Trainee',
        role: 'trainee'
      }];

      this.plans = [{
        id: 'mock-plan-1',
        trainerId: currentUser.id,
        planName: 'Sample Hypertrophy Plan',
        exercises: [
          { name: 'Bench Press', sets: 3, reps: 10 },
          { name: 'Squat', sets: 4, reps: 8 }
        ],
        createdAt: new Date()
      }];
    }
  }

  async assignPlan(plan: WorkoutPlan) {
    const traineeId = this.selectedTraineeForPlan[plan.id!];
    
    if (!traineeId) {
      alert('Please select a trainee first!');
      return;
    }

    
    // Duplicate the plan template and assign it to the selected trainee
    const assignedPlan: WorkoutPlan = {
      ...plan,
      traineeId: traineeId,
      createdAt: new Date()
    };
    
    delete assignedPlan.id; // Let Firebase generate a new ID for the assigned copy

    try {
      await this.firebaseService.assignWorkoutPlan(assignedPlan);
      alert('Plan successfully assigned to trainee!');
      this.selectedTraineeForPlan[plan.id!] = ''; // Reset dropdown
    } catch (error) {
      console.error('Error assigning plan', error);
    }
  }

  // Called when the create component finishes saving a plan
  onPlanCreated() {
    this.viewMode = 'list';
    this.loadData(); // Refresh the list
  }
}