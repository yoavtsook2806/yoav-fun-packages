import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseHistory, ExerciseHistoryEntry, DailyTrainingProgress, TrainingProgressStorage, ExerciseDefaults, ExerciseDefaultsStorage, Exercise } from '../types';

const EXERCISE_HISTORY_KEY = 'matan-trainings-exercise-history';
const TRAINING_PROGRESS_KEY = 'matan-trainings-daily-progress';
const EXERCISE_DEFAULTS_KEY = 'matan-trainings-exercise-defaults';
const CUSTOM_EXERCISE_DATA_KEY = 'matan-trainings-custom-exercise-data';

export const getExerciseHistory = async (): Promise<ExerciseHistory> => {
  try {
    const stored = await AsyncStorage.getItem(EXERCISE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading exercise history:', error);
    return {};
  }
};

export const saveExerciseEntry = async (
  exerciseName: string,
  entry: ExerciseHistoryEntry
): Promise<void> => {
  try {
    const history = await getExerciseHistory();
    
    if (!history[exerciseName]) {
      history[exerciseName] = [];
    }
    
    // Check if we already have an entry with the same date (to prevent duplicates)
    const existingEntryIndex = history[exerciseName].findIndex(
      existing => Math.abs(new Date(existing.date).getTime() - new Date(entry.date).getTime()) < 1000 // Within 1 second
    );
    
    if (existingEntryIndex !== -1) {
      // Update existing entry instead of adding duplicate
      history[exerciseName][existingEntryIndex] = entry;
    } else {
      // Add new entry at the beginning (most recent first)
      history[exerciseName].unshift(entry);
    }
    
    // Keep only the last 50 entries per exercise
    if (history[exerciseName].length > 50) {
      history[exerciseName] = history[exerciseName].slice(0, 50);
    }
    
    await AsyncStorage.setItem(EXERCISE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving exercise history:', error);
  }
};

export const getExerciseLastEntry = async (exerciseName: string): Promise<ExerciseHistoryEntry | null> => {
  const history = await getExerciseHistory();
  const exerciseHistory = history[exerciseName];
  
  return exerciseHistory && exerciseHistory.length > 0 ? exerciseHistory[0] : null;
};

export const getLastUsedWeight = async (exerciseName: string): Promise<number | undefined> => {
  const lastEntry = await getExerciseLastEntry(exerciseName);
  return lastEntry?.weight;
};

export const getLastUsedRepeats = async (exerciseName: string): Promise<number | undefined> => {
  const lastEntry = await getExerciseLastEntry(exerciseName);
  return lastEntry?.repeats;
};

export const clearExerciseHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(EXERCISE_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing exercise history:', error);
  }
};

// Training Progress Functions
const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getTrainingProgress = async (): Promise<TrainingProgressStorage> => {
  try {
    const stored = await AsyncStorage.getItem(TRAINING_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading training progress:', error);
    return {};
  }
};

export const getDailyTrainingProgress = async (trainingType: string): Promise<DailyTrainingProgress | null> => {
  const progress = await getTrainingProgress();
  const todayProgress = progress[trainingType];
  
  // Return progress only if it's from today
  if (todayProgress && todayProgress.date === getTodayDateString()) {
    return todayProgress;
  }
  
  return null;
};

export const saveTrainingProgress = async (
  trainingType: string,
  exerciseName: string,
  completedSets: number
): Promise<void> => {
  try {
    const progress = await getTrainingProgress();
    const today = getTodayDateString();
    
    if (!progress[trainingType] || progress[trainingType].date !== today) {
      // Initialize new daily progress
      progress[trainingType] = {
        date: today,
        trainingType,
        exerciseProgress: {}
      };
    }
    
    // Update the exercise progress
    progress[trainingType].exerciseProgress[exerciseName] = completedSets;
    
    await AsyncStorage.setItem(TRAINING_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving training progress:', error);
  }
};

export const getExerciseProgress = async (trainingType: string, exerciseName: string): Promise<number> => {
  const dailyProgress = await getDailyTrainingProgress(trainingType);
  return dailyProgress?.exerciseProgress[exerciseName] || 0;
};

export const clearTrainingProgress = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TRAINING_PROGRESS_KEY);
  } catch (error) {
    console.error('Error clearing training progress:', error);
  }
};

// Exercise Defaults Functions
export const getExerciseDefaults = async (): Promise<ExerciseDefaultsStorage> => {
  try {
    const stored = await AsyncStorage.getItem(EXERCISE_DEFAULTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading exercise defaults:', error);
    return {};
  }
};

export const getExerciseDefaultSettings = async (exerciseName: string): Promise<ExerciseDefaults> => {
  const defaults = await getExerciseDefaults();
  return defaults[exerciseName] || {};
};

export const saveExerciseDefaults = async (
  exerciseName: string,
  weight?: number,
  restTime?: number,
  repeats?: number
): Promise<void> => {
  try {
    const defaults = await getExerciseDefaults();
    
    if (!defaults[exerciseName]) {
      defaults[exerciseName] = {};
    }
    
    if (weight !== undefined && weight > 0) {
      defaults[exerciseName].weight = weight;
    }
    
    if (restTime !== undefined && restTime > 0) {
      defaults[exerciseName].restTime = restTime;
    }
    
    if (repeats !== undefined && repeats > 0) {
      defaults[exerciseName].repeats = repeats;
    }
    
    await AsyncStorage.setItem(EXERCISE_DEFAULTS_KEY, JSON.stringify(defaults));
  } catch (error) {
    console.error('Error saving exercise defaults:', error);
  }
};

export const getDefaultWeight = async (exerciseName: string): Promise<number | undefined> => {
  const defaults = await getExerciseDefaultSettings(exerciseName);
  return defaults.weight;
};

export const getDefaultRestTime = async (exerciseName: string): Promise<number | undefined> => {
  const defaults = await getExerciseDefaultSettings(exerciseName);
  return defaults.restTime;
};

export const getDefaultRepeats = async (exerciseName: string): Promise<number | undefined> => {
  const defaults = await getExerciseDefaultSettings(exerciseName);
  return defaults.repeats;
};

export const clearExerciseDefaults = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(EXERCISE_DEFAULTS_KEY);
  } catch (error) {
    console.error('Error clearing exercise defaults:', error);
  }
};

// Helper functions to calculate defaults from exercise data
export const calculateDefaultRestTime = (exercise: Exercise): number => {
  return exercise.maximumTimeToRest; // Use maximum rest time as default
};

export const calculateDefaultRepeats = (exercise: Exercise): number => {
  return exercise.minimumNumberOfRepeasts; // Use minimum repeats as default
};

// Custom Exercise Data Functions
interface CustomExerciseData {
  [exerciseName: string]: {
    customTitle?: string;
    customNote?: string;
  };
}

export const getCustomExerciseData = async (): Promise<CustomExerciseData> => {
  try {
    const stored = await AsyncStorage.getItem(CUSTOM_EXERCISE_DATA_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading custom exercise data:', error);
    return {};
  }
};

export const saveCustomExerciseData = async (exerciseName: string, customTitle: string, customNote: string): Promise<void> => {
  try {
    const customData = await getCustomExerciseData();
    customData[exerciseName] = {
      customTitle: customTitle || undefined,
      customNote: customNote || undefined,
    };
    await AsyncStorage.setItem(CUSTOM_EXERCISE_DATA_KEY, JSON.stringify(customData));
  } catch (error) {
    console.error('Error saving custom exercise data:', error);
  }
};

export const getCustomExerciseTitle = async (exerciseName: string): Promise<string> => {
  const customData = await getCustomExerciseData();
  return customData[exerciseName]?.customTitle || exerciseName;
};

export const getCustomExerciseNote = async (exerciseName: string, originalNote?: string): Promise<string> => {
  const customData = await getCustomExerciseData();
  return customData[exerciseName]?.customNote || originalNote || '';
};

export const clearCustomExerciseData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CUSTOM_EXERCISE_DATA_KEY);
  } catch (error) {
    console.error('Error clearing custom exercise data:', error);
  }
};

export const isFirstTimeExperience = async (_trainingType: string, exercises: string[]): Promise<boolean> => {
  for (const exerciseName of exercises) {
    const defaultWeight = await getDefaultWeight(exerciseName);
    const defaultRestTime = await getDefaultRestTime(exerciseName);
    const defaultRepeats = await getDefaultRepeats(exerciseName);

    if (defaultWeight !== undefined || defaultRestTime !== undefined || defaultRepeats !== undefined) {
      return false;
    }
  }
  return true;
};
