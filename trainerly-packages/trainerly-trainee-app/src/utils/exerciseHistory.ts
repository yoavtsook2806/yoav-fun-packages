import { ExerciseHistory, ExerciseHistoryEntry, DailyTrainingProgress, TrainingProgressStorage, ExerciseDefaults, ExerciseDefaultsStorage, Exercise } from '../types';
import { 
  EXERCISE_HISTORY_KEY, 
  TRAINING_PROGRESS_KEY, 
  EXERCISE_DEFAULTS_KEY, 
  CUSTOM_EXERCISE_DATA_KEY 
} from '../constants/localStorage';

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

// New function to update today's exercise entry
export const updateTodaysExerciseEntry = (
  exerciseName: string,
  updatedSetsData: {weight?: number, repeats?: number}[]
): void => {
  try {
    const history = getExerciseHistory();
    
    if (!history[exerciseName] || history[exerciseName].length === 0) {
      return; // No history to update
    }
    
    // Find today's entry (most recent entry should be today's)
    const today = new Date().toDateString();
    const entryIndex = history[exerciseName].findIndex(entry => {
      const entryDate = new Date(entry.date).toDateString();
      return entryDate === today;
    });
    
    if (entryIndex !== -1) {
      // Update the existing entry with new sets data
      const existingEntry = history[exerciseName][entryIndex];
      
      // Get first set data for backward compatibility (weight/repeats display in history)
      const firstSetData = updatedSetsData[0];
      const firstSetWeight = firstSetData?.weight;
      const firstSetRepeats = firstSetData?.repeats;
      
      const updatedEntry = {
        ...existingEntry,
        weight: firstSetWeight, // First set weight for display
        repeats: firstSetRepeats, // First set repeats for display
        setsData: updatedSetsData, // Complete per-set data
      };
      
      history[exerciseName][entryIndex] = updatedEntry;
      localStorage.setItem(EXERCISE_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error updating exercise history:', error);
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

export const getLastUsedRepeats = (exerciseName: string): number | undefined => {
  const lastEntry = getExerciseLastEntry(exerciseName);
  return lastEntry?.repeats;
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
  // TEMP: Reset every 20 seconds for testing
  const now = new Date();
  const twentySecondBlocks = Math.floor(now.getTime() / (20 * 1000)); // Every 20 seconds
  return `20s-${twentySecondBlocks}`; // Format: 20s-12345
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

export const getExerciseDefaultSettings = (exerciseName: string, trainingPlanId: string): ExerciseDefaults => {
  const defaults = getExerciseDefaults();
  return defaults[trainingPlanId]?.[exerciseName] || {};
};

export const saveExerciseDefaults = (
  exerciseName: string,
  trainingPlanId: string,
  weight?: number,
  restTime?: number,
  repeats?: number
): void => {
  try {
    const defaults = getExerciseDefaults();
    
    if (!defaults[trainingPlanId]) {
      defaults[trainingPlanId] = {};
    }
    
    if (!defaults[trainingPlanId][exerciseName]) {
      defaults[trainingPlanId][exerciseName] = {};
    }
    
    if (weight !== undefined && weight > 0) {
      defaults[trainingPlanId][exerciseName].weight = weight;
    }
    
    if (restTime !== undefined && restTime > 0) {
      defaults[trainingPlanId][exerciseName].restTime = restTime;
    }
    
    if (repeats !== undefined && repeats > 0) {
      defaults[trainingPlanId][exerciseName].repeats = repeats;
    }
    
    localStorage.setItem(EXERCISE_DEFAULTS_KEY, JSON.stringify(defaults));
  } catch (error) {
    console.error('Error saving exercise defaults:', error);
  }
};

export const getDefaultWeight = (exerciseName: string, trainingPlanId: string): number | undefined => {
  const defaults = getExerciseDefaultSettings(exerciseName, trainingPlanId);
  return defaults.weight;
};

export const getDefaultRestTime = (exerciseName: string, trainingPlanId: string): number | undefined => {
  const defaults = getExerciseDefaultSettings(exerciseName, trainingPlanId);
  return defaults.restTime;
};

export const getDefaultRepeats = (exerciseName: string, trainingPlanId: string): number | undefined => {
  const defaults = getExerciseDefaultSettings(exerciseName, trainingPlanId);
  return defaults.repeats;
};

export const clearExerciseDefaults = (): void => {
  try {
    localStorage.removeItem(EXERCISE_DEFAULTS_KEY);
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

export const getCustomExerciseData = (): CustomExerciseData => {
  try {
    const stored = localStorage.getItem(CUSTOM_EXERCISE_DATA_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading custom exercise data:', error);
    return {};
  }
};

export const saveCustomExerciseData = (exerciseName: string, customTitle: string, customNote: string): void => {
  try {
    const customData = getCustomExerciseData();
    customData[exerciseName] = {
      customTitle: customTitle || undefined,
      customNote: customNote || undefined,
    };
    localStorage.setItem(CUSTOM_EXERCISE_DATA_KEY, JSON.stringify(customData));
  } catch (error) {
    console.error('Error saving custom exercise data:', error);
  }
};

export const getCustomExerciseTitle = (exerciseName: string): string => {
  const customData = getCustomExerciseData();
  return customData[exerciseName]?.customTitle || exerciseName;
};

export const getCustomExerciseNote = (exerciseName: string, originalNote?: string): string => {
  const customData = getCustomExerciseData();
  return customData[exerciseName]?.customNote || originalNote || '';
};

export const clearCustomExerciseData = (): void => {
  try {
    localStorage.removeItem(CUSTOM_EXERCISE_DATA_KEY);
  } catch (error) {
    console.error('Error clearing custom exercise data:', error);
  }
};

export const isFirstTimeExperience = (trainingType: string, exercises: string[], trainingPlanId: string): boolean => {
  console.log(`🔍 Checking first-time experience for training: ${trainingType} in plan: ${trainingPlanId}`);

  // Check if user has exercise history for ANY of the exercises in this training IN THIS PLAN AND TRAINING TYPE
  const history = getExerciseHistory();
  for (const exerciseName of exercises) {
    if (history[exerciseName] && history[exerciseName].length > 0) {
      // Check if any history entry is from the current plan AND training type
      const hasHistoryInCurrentTraining = history[exerciseName].some(entry =>
        entry.trainingPlanId === trainingPlanId && entry.trainingType === trainingType
      );
      if (hasHistoryInCurrentTraining) {
        console.log(`✅ User has history for exercise "${exerciseName}" in training "${trainingType}" of plan "${trainingPlanId}", not first time for this training`);
        return false;
      }
    }
  }

  // Check if ALL exercises in this training have defaults (meaning FTE was completed for this training)
  // OR if any exercise has been completed in this specific training type
  let allExercisesHaveDefaults = true;

  for (const exerciseName of exercises) {
    // Check if this exercise has defaults (user configured it via FTE)
    const defaultWeight = getDefaultWeight(exerciseName, trainingPlanId);
    const defaultRestTime = getDefaultRestTime(exerciseName, trainingPlanId);
    const defaultRepeats = getDefaultRepeats(exerciseName, trainingPlanId);
    const hasDefaults = defaultWeight !== undefined || defaultRestTime !== undefined || defaultRepeats !== undefined;

    if (!hasDefaults) {
      allExercisesHaveDefaults = false;
      console.log(`🆕 Exercise "${exerciseName}" has no defaults in training "${trainingType}" of plan "${trainingPlanId}", training is still first-time`);
      break; // No need to check further
    }
  }

  if (allExercisesHaveDefaults) {
    console.log(`✅ All exercises have defaults in training "${trainingType}" of plan "${trainingPlanId}", FTE was already completed for this training`);
    return false;
  }

  console.log(`🆕 This is a first-time experience for training: ${trainingType} in plan: ${trainingPlanId}`);
  return true;
};
