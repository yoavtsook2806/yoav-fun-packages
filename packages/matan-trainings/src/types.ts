export interface Exercise {
  numberOfSets: number;
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
}

export interface TrainingState {
  selectedTraining: string | null;
  restTime: number;
  currentExerciseIndex: number;
  exercises: string[];
  exerciseStates: { [exerciseName: string]: ExerciseState };
  isTrainingComplete: boolean;
}
