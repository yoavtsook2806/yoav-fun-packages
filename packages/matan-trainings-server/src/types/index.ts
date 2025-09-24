// Shared types between client and server
export interface TrainingPlan {
  version: string;
  name?: string;
  trainings: Record<string, Record<string, Exercise>>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Exercise {
  numberOfSets: number;
  link?: string;
  minimumTimeToRest: number;
  maximumTimeToRest: number;
  minimumNumberOfRepeasts: number;
  maximumNumberOfRepeasts: number;
  note: string;
  short: string;
}

export interface ExerciseCompletionData {
  userId: string;
  exerciseName: string;
  trainingType: string;
  date: string;
  weight?: number;
  repeats?: number;
  restTime: number;
  setsData?: { weight?: number; repeats?: number }[];
  completed: boolean;
  timestamp: string;
}

export interface UserProfile {
  userId: string;
  createdAt: string;
  lastActive: string;
  preferences?: {
    defaultRestTime?: number;
    preferredWeights?: Record<string, number>;
  };
}

export interface ServerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// API Request/Response types
export interface GetTrainingPlansRequest {
  currentVersion?: string;
}

export interface GetTrainingPlansResponse extends ServerResponse<TrainingPlan[]> {}

export interface SaveExerciseDataRequest {
  exerciseData: ExerciseCompletionData;
}

export interface SaveExerciseDataResponse extends ServerResponse<{ saved: boolean }> {}

export interface GetUserDataRequest {
  userId: string;
  fromDate?: string;
  toDate?: string;
}

export interface GetUserDataResponse extends ServerResponse<{
  profile: UserProfile;
  exerciseData: ExerciseCompletionData[];
}> {}

export interface AddTrainingPlanRequest {
  trainingId: string;
  trainingData: Record<string, Record<string, Exercise>>;
  name?: string;
}

export interface AddTrainingPlanResponse extends ServerResponse<{ saved: boolean, version: string }> {}
