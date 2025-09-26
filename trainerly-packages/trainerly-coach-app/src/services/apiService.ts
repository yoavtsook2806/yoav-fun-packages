import { getApiBaseUrl } from '../config/api';

// Types matching server schema
export interface Exercise {
  exerciseId: string;
  coachId: string;
  name: string;
  muscleGroup: string; // muscle group in Hebrew
  link?: string; // video URL
  note?: string; // instructions/notes
  isAdminExercise?: boolean; // True if created by admin, available to all coaches
  originalExerciseId?: string; // Reference to original admin exercise if this is a copy
  createdAt: string;
}

export interface TrainingPlan {
  planId: string;
  coachId: string;
  name: string;
  description?: string;
  trainings: TrainingItem[];
  isAdminPlan?: boolean; // True if created by admin, available to all coaches
  originalPlanId?: string; // Reference to original admin plan if this is a copy
  customTrainee?: string; // Trainee name if this is a custom plan for specific trainee
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlanSummary {
  planId: string;
  name: string;
  description?: string;
  trainingsCount: number;
  isAdminPlan?: boolean; // True if created by admin, available to all coaches
  originalPlanId?: string; // Reference to original admin plan if this is a copy
  customTrainee?: string; // Trainee name if this is a custom plan for specific trainee
  createdAt: string;
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

export interface Coach {
  coachId: string;
  name: string;
  email: string;
  nickname: string;
  phone?: string;
  age?: number;
  isAdmin?: boolean; // Admin coaches can create exercises/plans for all coaches
  createdAt: string;
  valid: boolean;
}

export interface Trainee {
  trainerId: string;
  coachId: string;
  firstName: string;
  lastName: string;
  email?: string;
  plans?: string[]; // Array of planIds, last one is current active plan
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
      let errorMessage = `Failed to create exercise: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      throw new Error(errorMessage);
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

    const data = await response.json();
    // Server returns { items: Exercise[] }, we need just the array
    return data.items || [];
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

  async getTrainingPlans(coachId: string, token: string): Promise<TrainingPlanSummary[]> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/plans`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch training plans: ${response.statusText}`);
    }

    const data = await response.json();
    // Server returns { items: TrainingPlanSummary[] }, we need just the array
    return data.items || [];
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

    const data = await response.json();
    // Server returns { items: Trainee[] }, we need just the array
    return data.items || [];
  }

  async assignPlanToTrainee(coachId: string, traineeId: string, planId: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/trainers/${traineeId}/plans/${planId}/assign`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      let errorMessage = `Failed to assign plan to trainee: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If can't parse JSON, use default message
      }
      
      throw new Error(errorMessage);
    }
  }

  // Coach Profile Management
  async getCoach(coachId: string, token: string): Promise<Coach> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch coach profile: ${response.statusText}`);
    }

    return response.json();
  }

  async updateCoach(coachId: string, token: string, updateData: Partial<Pick<Coach, 'name' | 'phone' | 'age'>>): Promise<Coach> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update coach profile: ${response.statusText}`);
    }

    return response.json();
  }

  // Trainee Exercise Sessions (for viewing history)
  async getTraineeExerciseSessions(coachId: string, traineeId: string, token: string, limit?: number): Promise<any[]> {
    const url = `${this.baseUrl}/coaches/${coachId}/trainers/${traineeId}/exercise-sessions${limit ? `?limit=${limit}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trainee exercise sessions: ${response.statusText}`);
    }

    const result = await response.json();
    return result.items || [];
  }

  // Admin Exercise Bank (בנק התרגילים)
  async getAdminExercises(token: string): Promise<Exercise[]> {
    const response = await fetch(`${this.baseUrl}/admin/exercises`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin exercises: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  async copyAdminExercise(coachId: string, adminExerciseId: string, token: string): Promise<Exercise> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/exercises/copy-admin/${adminExerciseId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to copy admin exercise: ${response.statusText}`);
    }

    return response.json();
  }

  async updateExercise(coachId: string, exerciseId: string, token: string, exerciseData: Omit<Exercise, 'exerciseId' | 'coachId' | 'createdAt'>): Promise<Exercise> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/exercises/${exerciseId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(exerciseData),
    });

    if (!response.ok) {
      let errorMessage = `Failed to update exercise: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If can't parse JSON, use default message
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Admin Training Plan Bank
  async getAdminTrainingPlans(token: string): Promise<TrainingPlanSummary[]> {
    const response = await fetch(`${this.baseUrl}/admin/training-plans`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin training plans: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  async copyAdminTrainingPlan(coachId: string, adminPlanId: string, token: string): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/training-plans/copy-admin/${adminPlanId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to copy admin training plan: ${response.statusText}`);
    }

    return response.json();
  }

  // Custom Trainee Training Plans
  async createCustomTrainingPlan(
    coachId: string, 
    traineeId: string, 
    traineeName: string,
    basePlanId: string, 
    token: string
  ): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/trainers/${traineeId}/custom-plan`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ 
        basePlanId, 
        traineeName 
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create custom training plan: ${response.statusText}`);
    }

    return response.json();
  }

  async makeCustomPlanGeneric(coachId: string, planId: string, token: string): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/training-plans/${planId}/make-generic`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to make custom plan generic: ${response.statusText}`);
    }

    return response.json();
  }

  // Get custom plans for specific trainee
  async getTraineeCustomPlans(coachId: string, traineeId: string, token: string): Promise<TrainingPlanSummary[]> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/trainers/${traineeId}/custom-plans`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trainee custom plans: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  // Delete training plan
  async deleteTrainingPlan(coachId: string, planId: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/training-plans/${planId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete training plan: ${response.statusText}`);
    }
  }

  // Get single training plan with full details
  async getTrainingPlan(coachId: string, planId: string, token: string): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/training-plans/${planId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch training plan: ${response.statusText}`);
    }

    return response.json();
  }

  // Update training plan
  async updateTrainingPlan(coachId: string, planId: string, token: string, planData: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const response = await fetch(`${this.baseUrl}/coaches/${coachId}/training-plans/${planId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(planData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update training plan: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();