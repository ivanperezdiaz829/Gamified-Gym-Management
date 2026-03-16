import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// ¡CORRECCIÓN! Importamos CreateClassesComponent
import { CreateClassesComponent } from './components/create-classes/create-classes';

@Component({
  selector: 'app-root',
  // ¡CORRECCIÓN! Lo añadimos aquí
  imports: [RouterOutlet, CreateClassesComponent], 
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Gamified-Gym-Management');
}