import { ExerciseHistory, ExerciseHistoryEntry } from '../types';

const EXERCISE_HISTORY_KEY = 'matan-trainings-exercise-history';

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
