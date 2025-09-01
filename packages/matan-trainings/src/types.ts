export interface Exercise {
  numberOfSets: number;
  link?: string;
}

export interface Training {
  [exerciseName: string]: Exercise;
}

export interface Trainings {
  [trainingType: string]: Training;
}

export interface ExerciseState {
  currentSet: number;
  completed: boolean;
  isActive: boolean;
  isResting: boolean;
  timeLeft: number;
  customRestTime?: number; // Optional custom rest time for this exercise
  weight?: number; // Current weight being used for this exercise
}

export interface TrainingState {
  selectedTraining: string | null;
  restTime: number;
  currentExerciseIndex: number;
  exercises: string[];
  exerciseStates: { [exerciseName: string]: ExerciseState };
  isTrainingComplete: boolean;
}

export interface ExerciseHistoryEntry {
  date: string; // ISO date string
  weight?: number;
  restTime: number;
  completedSets: number;
  totalSets: number;
}

export interface ExerciseHistory {
  [exerciseName: string]: ExerciseHistoryEntry[];
}

export interface DailyTrainingProgress {
  date: string; // YYYY-MM-DD format
  trainingType: string;
  exerciseProgress: {
    [exerciseName: string]: number; // number of completed sets
  };
}

export interface TrainingProgressStorage {
  [trainingType: string]: DailyTrainingProgress;
}

export interface ExerciseDefaults {
  weight?: number;
  restTime?: number;
}

export interface ExerciseDefaultsStorage {
  [exerciseName: string]: ExerciseDefaults;
}
