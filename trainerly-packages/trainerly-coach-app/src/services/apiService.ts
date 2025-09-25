import { getApiBaseUrl } from '../config/api';

// Types matching server schema
export interface Exercise {
  exerciseId: string;
  coachId: string;
  name: string;
  short: string; // short description
  link?: string; // video URL
  note?: string; // instructions/notes
  muscleGroup?: 'legs' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core' | 'full_body' | 'other';
  createdAt: string;
}

export interface TrainingPlan {
  planId: string;
  coachId: string;
  name: string;
  description?: string;
  trainings: TrainingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingItem {
  trainingId: string;
  name: string;
  order: number;
  exercises: PrescribedExercise[];
}

export interface PrescribedExercise {
  exerciseName: string; // references Exercise.name
  numberOfSets: number;
  minimumTimeToRest: number;
  maximumTimeToRest: number;
  minimumNumberOfRepeasts: number; // keeping original typo for compatibility
  maximumNumberOfRepeasts: number;
  prescriptionNote?: string; // additional notes specific to this training plan
}

export interface Trainee {
  trainerId: string;
  coachId: string;
  firstName: string;
  lastName: string;
  email?: string;
  trainerCode?: string; // auto-generated for easy identification
  assignedPlanId?: string;
  createdAt: string;
}

// API Service Class
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  private getAuthHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Exercise Management
  async createExercise(coachId: string, token: string, exerciseData: Omit<Exercise, 'exerciseId' | 'coachId' | 'createdAt'>): Promise<Exercise> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/exercises`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(exerciseData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create exercise: ${response.statusText}`);
    }

    return response.json();
  }

  async getExercises(coachId: string, token: string): Promise<Exercise[]> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/exercises`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch exercises: ${response.statusText}`);
    }

    return response.json();
  }

  // Training Plan Management
  async createTrainingPlan(coachId: string, token: string, planData: Omit<TrainingPlan, 'planId' | 'coachId' | 'createdAt' | 'updatedAt'>): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/plans`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(planData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create training plan: ${response.statusText}`);
    }

    return response.json();
  }

  async getTrainingPlans(coachId: string, token: string): Promise<TrainingPlan[]> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/plans`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch training plans: ${response.statusText}`);
    }

    return response.json();
  }

  // Trainee Management
  async createTrainee(coachId: string, token: string, traineeData: Omit<Trainee, 'trainerId' | 'coachId' | 'createdAt'>): Promise<Trainee> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/trainers`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(traineeData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create trainee: ${response.statusText}`);
    }

    return response.json();
  }

  async getTrainees(coachId: string, token: string): Promise<Trainee[]> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/trainers`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trainees: ${response.statusText}`);
    }

    return response.json();
  }

  async assignPlanToTrainee(coachId: string, traineeId: string, planId: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/trainers/${traineeId}/plans/${planId}/assign`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign plan to trainee: ${response.statusText}`);
    }
  }

  // Trainee Progress (for viewing)
  async getTraineeProgress(coachId: string, traineeId: string, token: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/trainers/${traineeId}/progress`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trainee progress: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();