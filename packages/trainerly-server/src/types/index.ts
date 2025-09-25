// Shared types between client and server
// Core entities based on OpenAPI spec
export interface Coach {
  coachId: string;
  name: string;
  email: string;
  nickname: string; // canonical form (lowercase, underscores)
  passwordHash: string;
  valid: boolean;
  phone?: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Trainer {
  trainerId: string;
  coachId: string;
  firstName: string;
  lastName: string;
  email?: string;
  trainerCode?: string; // auto-generated for easy identification
  createdAt: string;
}

// Exercise definition - just the exercise info
export interface Exercise {
  exerciseId: string;
  coachId: string;
  name: string; // e.g., "פרפר, מ. יד/מכונה"
  link?: string; // video URL
  note?: string; // exercise instructions/notes
  short: string; // short description, e.g., "פרפר"
  muscleGroup?: 'legs' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core' | 'full_body' | 'other';
  createdAt: string;
}

// Prescribed exercise in a training plan - references exercise by name + adds prescription
export interface PrescribedExercise {
  exerciseName: string; // references Exercise.name
  numberOfSets: number;
  minimumTimeToRest: number;
  maximumTimeToRest: number;
  minimumNumberOfRepeasts: number; // keeping original typo for compatibility
  maximumNumberOfRepeasts: number;
  // Optional overrides for this specific prescription
  prescriptionNote?: string; // additional notes specific to this training plan
}

export interface TrainingItem {
  trainingId: string;
  name: string;
  order: number;
  exercises: PrescribedExercise[];
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

export interface PlanAssignment {
  assignmentId: string;
  trainerId: string;
  planId: string;
  assignedAt: string;
  active: boolean;
}

export interface SetResult {
  setIndex: number;
  repsDone?: number;
  timeSecDone?: number;
  weightKg?: number;
  rpe?: number; // 1-10
  notes?: string;
}

export interface ExerciseProgressItem {
  exerciseId: string;
  results: SetResult[];
}

export interface TrainingProgress {
  progressId: string;
  trainerId: string;
  planId: string;
  trainingId: string;
  performedAt: string;
  exercises: ExerciseProgressItem[];
  createdAt: string;
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

// New API Request/Response types based on OpenAPI spec

// Nickname validation
export interface NicknameCheckResponse {
  input: string;
  canonical: string;
  valid: boolean;
  available: boolean;
  reason?: string;
}

// Coach authentication
export interface CoachCreateRequest {
  name: string;
  email: string;
  password: string;
  nickname: string;
}

export interface CoachCreateResponse {
  coachId: string;
  token: string;
  valid: boolean;
  nickname: string;
}

export interface CoachLoginRequest {
  email: string;
  password: string;
}

export interface CoachLoginResponse {
  coachId: string;
  token: string;
  valid: boolean;
}

export interface CoachGetResponse {
  coachId: string;
  name: string;
  email: string;
  createdAt: string;
  valid: boolean;
  nickname: string;
  phone?: string;
  age?: number;
}

export interface CoachUpdateRequest {
  name?: string;
  phone?: string;
  age?: number;
}

export interface CoachUpdateResponse {
  coachId: string;
  name: string;
  email: string;
  nickname: string;
  phone?: string;
  age?: number;
  updatedAt: string;
}

// Trainer management
export interface TrainerCreateRequest {
  firstName: string;
  lastName: string;
  email?: string;
}

export interface TrainerCreateResponse {
  trainerId: string;
}

export interface TrainerIdentifyRequest {
  // Option 1: by coach nickname + trainer name
  coachNickname?: string;
  firstName?: string;
  lastName?: string;
  // Option 2: by trainer code
  trainerCode?: string;
}

export interface TrainerIdentifyResponse {
  trainerId: string;
}

export interface TrainerListResponse {
  items: Array<{
    trainerId: string;
    firstName: string;
    lastName: string;
    email?: string;
    createdAt: string;
  }>;
}

// Exercise management
export interface ExerciseCreateRequest {
  name: string; // e.g., "פרפר, מ. יד/מכונה"
  link?: string; // video URL
  note?: string; // exercise instructions
  short: string; // short description, e.g., "פרפר"
  muscleGroup?: string;
}

export interface ExerciseCreateResponse {
  exerciseId: string;
}

export interface ExerciseListResponse {
  items: Array<{
    exerciseId: string;
    name: string;
    link?: string;
    note?: string;
    short: string;
    muscleGroup?: string;
    createdAt: string;
  }>;
}

// Training plan management
export interface PlanCreateRequest {
  name: string;
  description?: string;
  trainings: TrainingItem[];
}

export interface PlanCreateResponse {
  planId: string;
}

export interface PlanListResponse {
  items: Array<{
    planId: string;
    name: string;
    description?: string;
    trainingsCount: number;
    createdAt: string;
  }>;
}

export interface PlanAssignResponse {
  assignmentId: string;
  trainerId: string;
  planId: string;
  assignedAt: string;
  active: boolean;
}

export interface TrainerPlansListResponse {
  items: Array<{
    planId: string;
    name: string;
    description?: string;
    trainings: TrainingItem[];
  }>;
}

// Progress tracking
export interface ProgressCreateRequest {
  planId: string;
  trainingId: string;
  performedAt: string;
  exercises: ExerciseProgressItem[];
}

export interface ProgressCreateResponse {
  progressId: string;
}
