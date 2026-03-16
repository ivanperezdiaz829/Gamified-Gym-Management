import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface GymClass {
  name: string;
  instructor: string;
  capacity: number;
}

@Component({
  selector: 'app-create-classes',
  standalone: true,
  imports: [FormsModule],
  // 👇 AQUÍ ESTÁ LA MAGIA: Nombres cortos
  templateUrl: './create-classes.html',
  styleUrl: './create-classes.css' 
})
export class CreateClassesComponent {
  classesList = signal<GymClass[]>([]);
  newClass: GymClass = { name: '', instructor: '', capacity: 0 };

  saveClass() {
    if (this.newClass.name && this.newClass.instructor) {
      this.classesList.update(current => [...current, { ...this.newClass }]);
      this.newClass = { name: '', instructor: '', capacity: 0 };
    } else {
      alert('Por favor, rellena el nombre y el instructor.');
    }
  }
}