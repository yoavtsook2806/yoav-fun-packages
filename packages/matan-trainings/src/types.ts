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
  startTimestamp?: number; // Timestamp when rest timer started (for accurate background timing)
  restDuration?: number; // Duration of the rest period in seconds
  customRestTime?: number; // Optional custom rest time for this exercise
  weight?: number; // Current weight being used for this exercise
  repeats?: number; // Current repeats being used for this exercise
  setsData?: SetData[]; // Track weight/reps for each completed set
}

export interface TrainingState {
  selectedTraining: string | null;
  restTime: number;
  currentExerciseIndex: number;
  exercises: string[];
  exerciseStates: { [exerciseName: string]: ExerciseState };
  isTrainingComplete: boolean;
  trainingPlanVersion?: string; // Current training plan version
}

export interface SetData {
  weight?: number;
  repeats?: number;
}

export interface ExerciseHistoryEntry {
  date: string; // ISO date string
  weight?: number; // First set weight (for backward compatibility and display)
  restTime: number;
  completedSets: number;
  totalSets: number;
  repeats?: number; // First set repeats (for backward compatibility and display)
  setsData?: SetData[]; // Per-set data (weight and repeats for each set)
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
  repeats?: number;
}

export interface ExerciseDefaultsStorage {
  [exerciseName: string]: ExerciseDefaults;
}
