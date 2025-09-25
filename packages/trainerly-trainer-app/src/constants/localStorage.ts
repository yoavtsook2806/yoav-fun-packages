/**
 * Centralized localStorage keys for the Matan Trainings app
 * All localStorage keys should be defined here to ensure consistency
 * and make it easier to manage data clearing operations
 */

// Exercise-related keys
export const EXERCISE_HISTORY_KEY = 'matan-trainings-exercise-history';
export const TRAINING_PROGRESS_KEY = 'matan-trainings-daily-progress';
export const EXERCISE_DEFAULTS_KEY = 'matan-trainings-exercise-defaults';
export const CUSTOM_EXERCISE_DATA_KEY = 'matan-trainings-custom-exercise-data';

// Server-related keys
export const LAST_FETCH_DATE_KEY = 'lastTrainingsFetchDate';
export const SERVER_TRAINING_PLAN_KEY = 'serverTrainingPlan';
export const USER_EXERCISE_DATA_KEY = 'userExerciseData';
export const USER_ID_KEY = 'userId';

// App settings keys
export const VOLUME_STORAGE_KEY = 'matan-trainings-volume';

/**
 * Array of all localStorage keys used in the app
 * This should be kept in sync with the individual key constants above
 */
export const ALL_LOCALSTORAGE_KEYS = [
  EXERCISE_HISTORY_KEY,
  TRAINING_PROGRESS_KEY,
  EXERCISE_DEFAULTS_KEY,
  CUSTOM_EXERCISE_DATA_KEY,
  LAST_FETCH_DATE_KEY,
  SERVER_TRAINING_PLAN_KEY,
  USER_EXERCISE_DATA_KEY,
  USER_ID_KEY,
  VOLUME_STORAGE_KEY,
] as const;

/**
 * Clear all localStorage data used by the app
 */
export const clearAllLocalStorageData = (): void => {
  try {
    ALL_LOCALSTORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('All localStorage data cleared successfully');
  } catch (error) {
    console.error('Error clearing localStorage data:', error);
  }
};
