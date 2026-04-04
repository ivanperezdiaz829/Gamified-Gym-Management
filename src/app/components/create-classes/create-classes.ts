import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GymClass } from '../../models/gym.models';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-create-classes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-classes.html',
  styleUrl: './create-classes.css'
})
export class CreateClassesComponent implements OnInit {
  // Signal to store the list of registered classes
  classesList = signal<GymClass[]>([]);

  // Temporary object for the form data (starts with 1 pax)
  newClass: Partial<GymClass> = {
    name: '',
    instructor: '',
    capacity: 1,
    startDate: '',
    startTime: ''
  };

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  /**
   * Load classes from Firebase
   */
  async loadClasses(): Promise<void> {
    try {
      const classes = await this.firebaseService.getClasses();
      this.classesList.set(classes);
    } catch (error) {
      console.error('Error loading classes:', error);
      alert('Failed to load classes');
    }
  }

  /**
   * Increases the capacity value by 1
   */
  incrementCapacity(): void {
    this.newClass.capacity = (this.newClass.capacity || 0) + 1;
  }

  /**
   * Decreases the capacity value by 1, preventing values lower than 1
   */
  decrementCapacity(): void {
    if (this.newClass.capacity && this.newClass.capacity > 1) {
      this.newClass.capacity--;
    }
  }

  /**
   * Validates and saves the new class to Firebase
   */
  async saveClass(): Promise<void> {
    const { name, instructor, capacity, startDate, startTime } = this.newClass;

    if (!name || !instructor || !capacity || !startDate || !startTime) {
      alert('Please fill in all required fields.');
      return;
    }

    if (capacity < 1) {
      alert('Capacity must be at least 1.');
      return;
    }

    try {
      const currentUser = this.firebaseService.getCurrentUser();

      const classToCreate: Omit<GymClass, 'id'> = {
        name,
        instructor,
        capacity,
        startDate,
        startTime,
        trainerId: currentUser.id
      };

      await this.firebaseService.createClass(classToCreate);

      // Reload classes from Firebase
      await this.loadClasses();

      // Reset the form to initial values
      this.resetForm();

      alert('Class created successfully!');
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class');
    }
  }

  /**
   * Resets the form object
   */
  private resetForm(): void {
    this.newClass = {
      name: '',
      instructor: '',
      capacity: 1,
      startDate: '',
      startTime: ''
    };
  }
}