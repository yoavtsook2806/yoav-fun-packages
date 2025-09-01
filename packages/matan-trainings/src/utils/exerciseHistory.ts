import { ExerciseHistory, ExerciseHistoryEntry, DailyTrainingProgress, TrainingProgressStorage, ExerciseDefaults, ExerciseDefaultsStorage } from '../types';

const EXERCISE_HISTORY_KEY = 'matan-trainings-exercise-history';
const TRAINING_PROGRESS_KEY = 'matan-trainings-daily-progress';
const EXERCISE_DEFAULTS_KEY = 'matan-trainings-exercise-defaults';

export const getExerciseHistory = (): ExerciseHistory => {
  try {
    const stored = localStorage.getItem(EXERCISE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading exercise history:', error);
    return {};
  }
};

export const saveExerciseEntry = (
  exerciseName: string,
  entry: ExerciseHistoryEntry
): void => {
  try {
    const history = getExerciseHistory();
    
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
    
    localStorage.setItem(EXERCISE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving exercise history:', error);
  }
};

export const getExerciseLastEntry = (exerciseName: string): ExerciseHistoryEntry | null => {
  const history = getExerciseHistory();
  const exerciseHistory = history[exerciseName];
  
  return exerciseHistory && exerciseHistory.length > 0 ? exerciseHistory[0] : null;
};

export const getLastUsedWeight = (exerciseName: string): number | undefined => {
  const lastEntry = getExerciseLastEntry(exerciseName);
  return lastEntry?.weight;
};

export const clearExerciseHistory = (): void => {
  try {
    localStorage.removeItem(EXERCISE_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing exercise history:', error);
  }
};

export const removeDuplicateHistoryEntries = (): void => {
  try {
    const history = getExerciseHistory();
    let hasChanges = false;
    
    Object.keys(history).forEach(exerciseName => {
      const entries = history[exerciseName];
      const uniqueEntries: ExerciseHistoryEntry[] = [];
      
      entries.forEach(entry => {
        // Check if we already have an entry within 1 second of this one
        const isDuplicate = uniqueEntries.some(existing => 
          Math.abs(new Date(existing.date).getTime() - new Date(entry.date).getTime()) < 1000
        );
        
        if (!isDuplicate) {
          uniqueEntries.push(entry);
        } else {
          hasChanges = true;
        }
      });
      
      history[exerciseName] = uniqueEntries;
    });
    
    if (hasChanges) {
      localStorage.setItem(EXERCISE_HISTORY_KEY, JSON.stringify(history));
      console.log('Removed duplicate history entries');
    }
  } catch (error) {
    console.error('Error removing duplicate history entries:', error);
  }
};

// Training Progress Functions
const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getTrainingProgress = (): TrainingProgressStorage => {
  try {
    const stored = localStorage.getItem(TRAINING_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading training progress:', error);
    return {};
  }
};

export const getDailyTrainingProgress = (trainingType: string): DailyTrainingProgress | null => {
  const progress = getTrainingProgress();
  const todayProgress = progress[trainingType];
  
  // Return progress only if it's from today
  if (todayProgress && todayProgress.date === getTodayDateString()) {
    return todayProgress;
  }
  
  return null;
};

export const saveTrainingProgress = (
  trainingType: string,
  exerciseName: string,
  completedSets: number
): void => {
  try {
    const progress = getTrainingProgress();
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
    
    localStorage.setItem(TRAINING_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving training progress:', error);
  }
};

export const getExerciseProgress = (trainingType: string, exerciseName: string): number => {
  const dailyProgress = getDailyTrainingProgress(trainingType);
  return dailyProgress?.exerciseProgress[exerciseName] || 0;
};

export const clearTrainingProgress = (): void => {
  try {
    localStorage.removeItem(TRAINING_PROGRESS_KEY);
  } catch (error) {
    console.error('Error clearing training progress:', error);
  }
};

// Exercise Defaults Functions
export const getExerciseDefaults = (): ExerciseDefaultsStorage => {
  try {
    const stored = localStorage.getItem(EXERCISE_DEFAULTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading exercise defaults:', error);
    return {};
  }
};

export const getExerciseDefaultSettings = (exerciseName: string): ExerciseDefaults => {
  const defaults = getExerciseDefaults();
  return defaults[exerciseName] || {};
};

export const saveExerciseDefaults = (
  exerciseName: string,
  weight?: number,
  restTime?: number
): void => {
  try {
    const defaults = getExerciseDefaults();
    
    if (!defaults[exerciseName]) {
      defaults[exerciseName] = {};
    }
    
    if (weight !== undefined && weight > 0) {
      defaults[exerciseName].weight = weight;
    }
    
    if (restTime !== undefined && restTime > 0) {
      defaults[exerciseName].restTime = restTime;
    }
    
    localStorage.setItem(EXERCISE_DEFAULTS_KEY, JSON.stringify(defaults));
  } catch (error) {
    console.error('Error saving exercise defaults:', error);
  }
};

export const getDefaultWeight = (exerciseName: string): number | undefined => {
  const defaults = getExerciseDefaultSettings(exerciseName);
  return defaults.weight;
};

export const getDefaultRestTime = (exerciseName: string): number | undefined => {
  const defaults = getExerciseDefaultSettings(exerciseName);
  return defaults.restTime;
};

export const clearExerciseDefaults = (): void => {
  try {
    localStorage.removeItem(EXERCISE_DEFAULTS_KEY);
  } catch (error) {
    console.error('Error clearing exercise defaults:', error);
  }
};
