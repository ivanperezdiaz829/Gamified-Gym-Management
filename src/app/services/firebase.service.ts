import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { GymClass, Reservation, User, UserRole, WorkoutPlan } from '../models/gym.models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  // Mock current user for development
  private currentUser: User = {
    id: 'trainer-001',
    email: 'trainer@gym.com',
    name: 'Default Trainer',
    role: 'trainer'
  };

  // Fixed IDs for consistent role switching
  private readonly FIXED_TRAINER_ID = 'trainer-001';
  private readonly FIXED_TRAINEE_ID = 'trainee-001';
  private localWorkoutPlans: WorkoutPlan[] = []; // Local state for workout plans

  constructor() {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      this.app = initializeApp(environment.firebase);
    } else {
      this.app = getApp();
    }
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);

    // FIX: Comprobar que estamos en el navegador antes de usar localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedPlans = localStorage.getItem('gym_workout_plans');
      if (savedPlans) {
        this.localWorkoutPlans = JSON.parse(savedPlans);
      }
    }
  }

  // User Management
  getCurrentUser(): User {
    return this.currentUser;
  }

  setCurrentUser(role: UserRole, name: string = 'User') {
    this.currentUser = {
      id: role === 'trainer' ? this.FIXED_TRAINER_ID : this.FIXED_TRAINEE_ID,
      email: `${role}@gym.com`,
      name: name,
      role: role
    };
  }

  // Classes CRUD
  async getClasses(): Promise<GymClass[]> {
    const classesRef = collection(this.db, 'classes');
    const snapshot = await getDocs(classesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GymClass));
  }

  async getClassById(id: string): Promise<GymClass | null> {
    const docRef = doc(this.db, 'classes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as GymClass;
    }
    return null;
  }

  async createClass(gymClass: Omit<GymClass, 'id'>): Promise<string> {
    const classesRef = collection(this.db, 'classes');
    const docRef = await addDoc(classesRef, {
      ...gymClass,
      attendees: [],
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  }

  async updateClass(id: string, updates: Partial<GymClass>): Promise<void> {
    const docRef = doc(this.db, 'classes', id);
    await updateDoc(docRef, updates);
  }

  async deleteClass(id: string): Promise<void> {
    // First, delete all reservations for this class
    const reservations = await this.getClassReservations(id);
    const deletePromises = reservations.map(reservation => {
      const reservationRef = doc(this.db, 'reservations', reservation.id!);
      return deleteDoc(reservationRef);
    });
    await Promise.all(deletePromises);

    // Then delete the class itself
    const docRef = doc(this.db, 'classes', id);
    await deleteDoc(docRef);
  }

  async getTrainerClasses(trainerId: string): Promise<GymClass[]> {
    const classesRef = collection(this.db, 'classes');
    const q = query(classesRef, where('trainerId', '==', trainerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GymClass));
  }

  // Reservations CRUD
  async getReservations(): Promise<Reservation[]> {
    const reservationsRef = collection(this.db, 'reservations');
    const snapshot = await getDocs(reservationsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Reservation));
  }

  async getTraineeReservations(traineeId: string): Promise<Reservation[]> {
    const reservationsRef = collection(this.db, 'reservations');
    const q = query(reservationsRef, where('traineeId', '==', traineeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Reservation));
  }

  async getClassReservations(classId: string): Promise<Reservation[]> {
    const reservationsRef = collection(this.db, 'reservations');
    const q = query(reservationsRef, where('classId', '==', classId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Reservation));
  }

  async createReservation(reservation: Omit<Reservation, 'id'>): Promise<string> {
    const reservationsRef = collection(this.db, 'reservations');
    const docRef = await addDoc(reservationsRef, {
      ...reservation,
      bookedAt: new Date().toISOString()
    });

    // Update class attendees
    const classRef = doc(this.db, 'classes', reservation.classId);
    const classDoc = await getDoc(classRef);
    if (classDoc.exists()) {
      const currentAttendees = classDoc.data()['attendees'] || [];
      await updateDoc(classRef, {
        attendees: [...currentAttendees, reservation.traineeId]
      });
    }

    return docRef.id;
  }

  async deleteReservation(reservationId: string, classId: string, traineeId: string): Promise<void> {
    const reservationRef = doc(this.db, 'reservations', reservationId);
    await deleteDoc(reservationRef);

    // Update class attendees
    const classRef = doc(this.db, 'classes', classId);
    const classDoc = await getDoc(classRef);
    if (classDoc.exists()) {
      const currentAttendees = classDoc.data()['attendees'] || [];
      await updateDoc(classRef, {
        attendees: currentAttendees.filter((id: string) => id !== traineeId)
      });
    }
  }

  // Helper methods
  isClassFull(gymClass: GymClass): boolean {
    const attendees = gymClass.attendees || [];
    return attendees.length >= gymClass.capacity;
  }

  hasClassStarted(gymClass: GymClass): boolean {
    const classDateTime = new Date(`${gymClass.startDate}T${gymClass.startTime}`);
    return classDateTime <= new Date();
  }

  canEditOrCancelClass(gymClass: GymClass): boolean {
    return !this.hasClassStarted(gymClass);
  }

async getTrainees(): Promise<User[]> {
    // Return a fake trainee immediately without touching Firebase
    return [{
      id: this.FIXED_TRAINEE_ID,
      email: 'trainee@gym.com',
      name: 'Test Trainee',
      role: 'trainee'
    }];
  }

  async assignWorkoutPlan(plan: WorkoutPlan): Promise<string> {
    const fakeId = 'plan-' + Math.random().toString(36).substring(2, 9);
    
    const newPlan = {
      ...plan,
      id: fakeId,
      createdAt: new Date()
    };

    this.localWorkoutPlans.push(newPlan);
    
    // FIX: Comprobar que estamos en el navegador antes de guardar
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('gym_workout_plans', JSON.stringify(this.localWorkoutPlans));
    }
    
    return fakeId;
  }

  async getTrainerWorkoutPlans(trainerId: string): Promise<WorkoutPlan[]> {
    // Filter our local array to only show plans made by this trainer
    return this.localWorkoutPlans.filter(plan => plan.trainerId === trainerId);
  }

  async getTraineeWorkoutPlans(traineeId: string): Promise<WorkoutPlan[]> {
    return this.localWorkoutPlans.filter(plan => plan.traineeId === traineeId);
  }

  async deleteWorkoutPlan(planId: string): Promise<void> {
    // Filtramos el array para quedarnos con todos los planes EXCEPTO el que queremos borrar
    this.localWorkoutPlans = this.localWorkoutPlans.filter(plan => plan.id !== planId);
    
    // Guardamos el nuevo estado en el buscador
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('gym_workout_plans', JSON.stringify(this.localWorkoutPlans));
    }
  }

  async updateWorkoutPlan(planId: string, updates: Partial<WorkoutPlan>): Promise<void> {
    const index = this.localWorkoutPlans.findIndex(p => p.id === planId);
    if (index !== -1) {
      // Mezclamos los datos antiguos con los nuevos
      this.localWorkoutPlans[index] = { ...this.localWorkoutPlans[index], ...updates };
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('gym_workout_plans', JSON.stringify(this.localWorkoutPlans));
      }
    }
  }
}
