import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { User } from '../../models/gym.models';

@Component({
  selector: 'app-award-points',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './award-points.html',
  styleUrls: ['./award-points.css']
})
export class AwardPointsComponent implements OnInit {
  trainees: User[] = [];
  
  // Variables para dar puntos
  customPoints: { [traineeId: string]: number | null } = {};
  awardReasonMap: { [traineeId: string]: string } = {}; // <-- NUEVO
  
  // Variables para restar puntos
  deductPointsMap: { [traineeId: string]: number | null } = {};
  deductReasonMap: { [traineeId: string]: string } = {};

  constructor(
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTrainees();
  }

  async loadTrainees() {
    this.trainees = await this.firebaseService.getTrainees();
    
    // Inicializamos todos los inputs vacíos por defecto
    this.trainees.forEach(t => {
      if (this.customPoints[t.id] === undefined) {
        this.customPoints[t.id] = null;
      }
      if (this.deductPointsMap[t.id] === undefined) {
        this.deductPointsMap[t.id] = null;
      }
      if (this.deductReasonMap[t.id] === undefined) {
        this.deductReasonMap[t.id] = '';
      }
    });
    
    this.cdr.detectChanges();
  }

  async givePoints(traineeId: string, points: number | null, reason: string) {
    if (!points || points <= 0 || !reason || reason.trim() === '') {
      alert('Por favor, introduce una cantidad válida y el motivo del premio.');
      return;
    }

    try {
      await this.firebaseService.awardPoints(traineeId, points, reason);
      alert(`¡Se han añadido ${points} puntos y notificado al alumno!`);
      
      // Limpiamos los inputs
      this.customPoints[traineeId] = null; 
      this.awardReasonMap[traineeId] = '';
      this.loadTrainees(); 
    } catch (error) {
      console.error('Error al dar puntos:', error);
    }
  }

  // Restar puntos (penalizar)
  async removePoints(traineeId: string) {
    const points = this.deductPointsMap[traineeId];
    const reason = this.deductReasonMap[traineeId];

    if (!points || points <= 0 || !reason || reason.trim() === '') {
      alert('Por favor, introduce una cantidad válida y el motivo de la penalización.');
      return;
    }

    try {
      await this.firebaseService.deductPoints(traineeId, points, reason);
      alert(`Se han restado ${points} puntos y notificado al alumno.`);
      
      // Limpiamos los campos y recargamos
      this.deductPointsMap[traineeId] = null;
      this.deductReasonMap[traineeId] = '';
      this.loadTrainees(); 
    } catch (error) {
      console.error('Error al restar puntos:', error);
    }
  }
}