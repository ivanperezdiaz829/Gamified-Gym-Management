import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GymClass, Reservation } from '../../models/gym.models';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-create-classes',
  standalone: true,
  imports: [FormsModule, CommonModule],
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

  // Track if we're in edit mode
  isEditMode = false;
  editingClassId: string | null = null;

  // Track expanded attendance views
  expandedClassIds = new Set<string>();

  // Store attendance data for each class
  attendanceData = signal<Map<string, Reservation[]>>(new Map());

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  /**
   * Load classes from Firebase (only trainer's classes)
   */
  async loadClasses(): Promise<void> {
    try {
      const currentUser = this.firebaseService.getCurrentUser();
      const classes = await this.firebaseService.getTrainerClasses(currentUser.id);
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
   * Validates and saves the new class to Firebase (or updates if editing)
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
      if (this.isEditMode && this.editingClassId) {
        // Update existing class
        const updates: Partial<GymClass> = {
          name,
          instructor,
          capacity,
          startDate,
          startTime
        };

        await this.firebaseService.updateClass(this.editingClassId, updates);
        alert('Class updated successfully!');
      } else {
        // Create new class
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
        alert('Class created successfully!');
      }

      // Reload classes from Firebase
      await this.loadClasses();

      // Reset the form to initial values
      this.resetForm();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Failed to save class');
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
    this.isEditMode = false;
    this.editingClassId = null;
  }

  /**
   * Enter edit mode for a specific class
   */
  editClass(gymClass: GymClass): void {
    if (!this.canEditOrDelete(gymClass)) {
      alert('Cannot edit a class that has already started.');
      return;
    }

    this.isEditMode = true;
    this.editingClassId = gymClass.id!;
    this.newClass = {
      name: gymClass.name,
      instructor: gymClass.instructor,
      capacity: gymClass.capacity,
      startDate: gymClass.startDate,
      startTime: gymClass.startTime
    };

    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Cancel edit mode
   */
  cancelEdit(): void {
    this.resetForm();
  }

  /**
   * Delete a class with confirmation
   */
  async deleteClass(gymClass: GymClass): Promise<void> {
    if (!this.canEditOrDelete(gymClass)) {
      alert('Cannot delete a class that has already started.');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete the class "${gymClass.name}"?\n\n` +
      `This will also cancel all reservations for this class.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.firebaseService.deleteClass(gymClass.id!);
      await this.loadClasses();
      alert('Class deleted successfully!');
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class');
    }
  }

  /**
   * Check if a class can be edited or deleted
   */
  canEditOrDelete(gymClass: GymClass): boolean {
    return this.firebaseService.canEditOrCancelClass(gymClass);
  }

  /**
   * Check if class has started (for UI display)
   */
  hasClassStarted(gymClass: GymClass): boolean {
    return this.firebaseService.hasClassStarted(gymClass);
  }

  /**
   * Toggle attendance view for a class
   */
  async toggleAttendance(gymClass: GymClass): Promise<void> {
    const classId = gymClass.id!;

    if (this.expandedClassIds.has(classId)) {
      // Collapse
      this.expandedClassIds.delete(classId);
    } else {
      // Expand and load attendance
      this.expandedClassIds.add(classId);
      await this.loadAttendance(classId);
    }
  }

  /**
   * Load attendance for a specific class
   */
  async loadAttendance(classId: string): Promise<void> {
    try {
      const reservations = await this.firebaseService.getClassReservations(classId);
      const currentData = this.attendanceData();
      currentData.set(classId, reservations);
      this.attendanceData.set(new Map(currentData));
    } catch (error) {
      console.error('Error loading attendance:', error);
      alert('Failed to load attendance');
    }
  }

  /**
   * Check if attendance is expanded for a class
   */
  isAttendanceExpanded(classId: string): boolean {
    return this.expandedClassIds.has(classId);
  }

  /**
   * Get attendance for a specific class
   */
  getAttendance(classId: string): Reservation[] {
    return this.attendanceData().get(classId) || [];
  }

  /**
   * Get attendee count for a class
   */
  getAttendeeCount(gymClass: GymClass): number {
    return gymClass.attendees?.length || 0;
  }
}