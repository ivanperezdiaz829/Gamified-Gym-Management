import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Interface defining the structure of a Gym Class
 */
export interface GymClass {
  name: string;
  instructor: string;
  capacity: number;
}

@Component({
  selector: 'app-create-classes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-classes.html',
  styleUrl: './create-classes.css'
})
export class CreateClassesComponent {
  // Signal to store the list of registered classes
  classesList = signal<GymClass[]>([]);

  // Temporary object for the form data (starts with 1 pax)
  newClass: GymClass = { name: '', instructor: '', capacity: 1 };

  /**
   * Increases the capacity value by 1
   */
  incrementCapacity(): void {
    this.newClass.capacity++;
  }

  /**
   * Decreases the capacity value by 1, preventing values lower than 1
   */
  decrementCapacity(): void {
    if (this.newClass.capacity > 1) {
      this.newClass.capacity--;
    }
  }

  /**
   * Validates and saves the new class into the list
   */
  saveClass(): void {
    const { name, instructor, capacity } = this.newClass;

    if (name && instructor && capacity > 0) {
      // Add the new class to the signal list
      this.classesList.update(current => [...current, { ...this.newClass }]);
      
      // Reset the form to initial values
      this.resetForm();
    } else {
      alert('Please fill in all required fields.');
    }
  }

  /**
   * Resets the form object
   */
  private resetForm(): void {
    this.newClass = { name: '', instructor: '', capacity: 1 };
  }
}