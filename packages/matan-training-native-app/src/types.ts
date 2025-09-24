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
  startTimestamp?: number;
  restDuration?: number;
  customRestTime?: number;
  weight?: number;
  repeats?: number;
  setsData?: SetData[];
}

export interface TrainingState {
  selectedTraining: string | null;
  restTime: number;
  currentExerciseIndex: number;
  exercises: string[];
  exerciseStates: { [exerciseName: string]: ExerciseState };
  isTrainingComplete: boolean;
  trainingPlanVersion?: string;
}

export interface SetData {
  weight?: number;
  repeats?: number;
}

export interface ExerciseHistoryEntry {
  date: string;
  weight?: number;
  restTime: number;
  completedSets: number;
  totalSets: number;
  repeats?: number;
  setsData?: SetData[];
}

export interface ExerciseHistory {
  [exerciseName: string]: ExerciseHistoryEntry[];
}

export interface DailyTrainingProgress {
  date: string;
  trainingType: string;
  exerciseProgress: {
    [exerciseName: string]: number;
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
