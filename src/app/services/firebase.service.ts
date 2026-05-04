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
import { GymClass, Reservation, User, UserNotification, UserRole, WorkoutPlan } from '../models/gym.models';

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
  private localWorkoutPlans: WorkoutPlan[] = []; 

  // Array local de usuarios simulando una base de datos para los puntos
  private localUsers: Array<User & { points?: number }> = [
    { id: this.FIXED_TRAINER_ID, email: 'trainer@gym.com', name: 'Default Trainer', role: 'trainer' },
    { id: this.FIXED_TRAINEE_ID, email: 'trainee@gym.com', name: 'Test Trainee', role: 'trainee', points: 120 },
    { id: 'trainee-002', email: 'alex@gym.com', name: 'Alex Fitness', role: 'trainee', points: 450 },
    { id: 'trainee-003', email: 'sarah@gym.com', name: 'Sarah Connor', role: 'trainee', points: 310 },
    { id: 'trainee-004', email: 'mike@gym.com', name: 'Mike Tyson', role: 'trainee', points: 50 }
  ];

  private localNotifications: UserNotification[] = [];

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
      // Cargar planes
      const savedPlans = localStorage.getItem('gym_workout_plans');
      const savedNotifs = localStorage.getItem('gym_notifs');
      if (savedNotifs) {
        this.localNotifications = JSON.parse(savedNotifs);
      }
      if (savedPlans) {
        this.localWorkoutPlans = JSON.parse(savedPlans);
      }
      
      // Cargar usuarios y puntos para que no se pierdan al recargar
      const savedUsers = localStorage.getItem('gym_users');
      if (savedUsers) {
        this.localUsers = JSON.parse(savedUsers);
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
    const reservations = await this.getClassReservations(id);
    const deletePromises = reservations.map(reservation => {
      const reservationRef = doc(this.db, 'reservations', reservation.id!);
      return deleteDoc(reservationRef);
    });
    await Promise.all(deletePromises);

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

  // ==========================================
  // LOCAL MOCK METHODS (Workouts y Puntos)
  // ==========================================

  async getTrainees(): Promise<User[]> {
    // ACTUALIZADO: Ahora lee de nuestro array de memoria en lugar de un solo usuario hardcodeado
    return this.localUsers.filter(u => u.role === 'trainee');
  }

  async getLeaderboard(): Promise<User[]> {
    // Obtener y ordenar por puntos (de mayor a menor)
    const trainees = await this.getTrainees();
    return trainees.sort((a, b) => (b.points || 0) - (a.points || 0));
  }

  async assignWorkoutPlan(plan: WorkoutPlan): Promise<string> {
    const fakeId = 'plan-' + Math.random().toString(36).substring(2, 9);
    
    const newPlan = {
      ...plan,
      id: fakeId,
      createdAt: new Date() // Corregido a ISO string
    };

    this.localWorkoutPlans.push(newPlan);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('gym_workout_plans', JSON.stringify(this.localWorkoutPlans));
    }
    
    return fakeId;
  }

  async getTrainerWorkoutPlans(trainerId: string): Promise<WorkoutPlan[]> {
    return this.localWorkoutPlans.filter(plan => plan.trainerId === trainerId);
  }

  async getTraineeWorkoutPlans(traineeId: string): Promise<WorkoutPlan[]> {
    return this.localWorkoutPlans.filter(plan => plan.traineeId === traineeId);
  }

  async deleteWorkoutPlan(planId: string): Promise<void> {
    this.localWorkoutPlans = this.localWorkoutPlans.filter(plan => plan.id !== planId);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('gym_workout_plans', JSON.stringify(this.localWorkoutPlans));
    }
  }

  async updateWorkoutPlan(planId: string, updates: Partial<WorkoutPlan>): Promise<void> {
    const index = this.localWorkoutPlans.findIndex(p => p.id === planId);
    if (index !== -1) {
      this.localWorkoutPlans[index] = { ...this.localWorkoutPlans[index], ...updates };
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('gym_workout_plans', JSON.stringify(this.localWorkoutPlans));
      }
    }
  }

async awardPoints(traineeId: string, pointsToAdd: number, reason: string): Promise<void> {
    const userIndex = this.localUsers.findIndex(u => u.id === traineeId);
    if (userIndex !== -1) {
      const currentPoints = this.localUsers[userIndex].points || 0;
      this.localUsers[userIndex].points = currentPoints + pointsToAdd;
      
      // NUEVO: Crear la notificación de éxito (PREMIO)
      const newNotif: UserNotification = {
        id: 'notif-' + Math.random().toString(36).substring(2, 9),
        traineeId: traineeId,
        message: `You have earned ${pointsToAdd} points! Reason: ${reason}`,
        date: new Date().toISOString(),
        isRead: false,
        type: 'success'
      };
      this.localNotifications.push(newNotif);

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('gym_users', JSON.stringify(this.localUsers));
        localStorage.setItem('gym_notifs', JSON.stringify(this.localNotifications));
      }
    }
  }

  async deductPoints(traineeId: string, pointsToDeduct: number, reason: string): Promise<void> {
    const userIndex = this.localUsers.findIndex(u => u.id === traineeId);
    if (userIndex !== -1) {
      const currentPoints = this.localUsers[userIndex].points || 0;
      this.localUsers[userIndex].points = Math.max(0, currentPoints - pointsToDeduct);
      
      // Actualizamos la notificación de castigo para añadir el type
      const newNotif: UserNotification = {
        id: 'notif-' + Math.random().toString(36).substring(2, 9),
        traineeId: traineeId,
        message: `You have lost ${pointsToDeduct} points. Reason: ${reason}`,
        date: new Date().toISOString(),
        isRead: false,
        type: 'deduction'
      };
      this.localNotifications.push(newNotif);

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('gym_users', JSON.stringify(this.localUsers));
        localStorage.setItem('gym_notifs', JSON.stringify(this.localNotifications));
      }
    }
  }

  async getUnreadNotifications(traineeId: string): Promise<UserNotification[]> {
    return this.localNotifications.filter(n => n.traineeId === traineeId && !n.isRead);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notif = this.localNotifications.find(n => n.id === notificationId);
    if (notif) {
      notif.isRead = true;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('gym_notifs', JSON.stringify(this.localNotifications));
      }
    }
  }
}