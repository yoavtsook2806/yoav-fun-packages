import { TrainingPlan, getLatestTrainingPlan, getLatestTrainingUpdates } from '../data/trainingPlans';
import { getAppConfig } from '../utils/urlParams';

/**
 * Interface for exercise completion data
 */
export interface ExerciseCompletionData {
  userId?: string;
  exerciseName: string;
  trainingType: string;
  date: string;
  weight?: number;
  repeats?: number;
  restTime: number;
  setsData?: { weight?: number; repeats?: number }[];
  completed: boolean;
}

/**
 * Interface for server response
 */
export interface ServerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Local storage keys for server-related data
 */
const LAST_FETCH_DATE_KEY = 'lastTrainingsFetchDate';

/**
 * Check if we need to fetch new trainings (once per day)
 */
const shouldFetchTrainings = (): boolean => {
  const lastFetchDate = localStorage.getItem(LAST_FETCH_DATE_KEY);
  if (!lastFetchDate) return true;
  
  const today = new Date().toDateString();
  return lastFetchDate !== today;
};

/**
 * Mark trainings as fetched today
 */
const markTrainingsFetched = (): void => {
  const today = new Date().toDateString();
  localStorage.setItem(LAST_FETCH_DATE_KEY, today);
};

/**
 * Fetch new trainings from server or local data
 * This function gets trainings newer than the current version
 */
export const fetchNewTrainings = async (currentVersion?: string): Promise<ServerResponse<TrainingPlan[]>> => {
  const config = getAppConfig();
  
  // Check if we already fetched today
  if (!shouldFetchTrainings()) {
    console.log('Trainings already fetched today, skipping...');
    // Return newer trainings based on current version
    const newerTrainings = currentVersion ? getLatestTrainingUpdates(currentVersion) : [getLatestTrainingPlan()];
    return {
      success: true,
      data: newerTrainings
    };
  }
  
  try {
    if (config.useServerData) {
      // TODO: Call real server endpoint
      // const response = await fetch('/api/trainings/latest');
      // const data = await response.json();
      // 
      // if (response.ok) {
      //   // Update local storage with server data
      //   localStorage.setItem('serverTrainingPlan', JSON.stringify(data));
      //   markTrainingsFetched();
      //   return { success: true, data };
      // } else {
      //   throw new Error(data.error || 'Failed to fetch trainings');
      // }
      
      // For now, simulate server call with local data
      console.log('Simulating server call for fetchNewTrainings...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      const newerTrainings = currentVersion ? getLatestTrainingUpdates(currentVersion) : [getLatestTrainingPlan()];
      markTrainingsFetched();
      
      return {
        success: true,
        data: newerTrainings
      };
    } else {
      // Use local data
      const newerTrainings = currentVersion ? getLatestTrainingUpdates(currentVersion) : [getLatestTrainingPlan()];
      markTrainingsFetched();
      
      return {
        success: true,
        data: newerTrainings
      };
    }
  } catch (error) {
    console.error('Error fetching trainings:', error);
    
    // Fallback to local data
    const newerTrainings = currentVersion ? getLatestTrainingUpdates(currentVersion) : [getLatestTrainingPlan()];
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: newerTrainings // Return local data as fallback
    };
  }
};

/**
 * Update user exercise data on server or local storage
 * Called every time an exercise is completed/edited
 */
export const updateUserData = async (exerciseData: ExerciseCompletionData): Promise<ServerResponse> => {
  const config = getAppConfig();
  
  try {
    if (config.useServerData) {
      // TODO: Call real server endpoint
      // const response = await fetch('/api/user/exercise-data', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(exerciseData)
      // });
      // 
      // const data = await response.json();
      // 
      // if (response.ok) {
      //   return { success: true, data };
      // } else {
      //   throw new Error(data.error || 'Failed to update user data');
      // }
      
      // For now, simulate server call
      console.log('Simulating server call for updateUserData:', exerciseData);
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
      
      // Also save to local storage as backup
      const existingData = JSON.parse(localStorage.getItem('userExerciseData') || '[]');
      existingData.push({
        ...exerciseData,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('userExerciseData', JSON.stringify(existingData));
      
      return {
        success: true,
        data: { message: 'Exercise data updated successfully' }
      };
    } else {
      // Save to local storage only
      const existingData = JSON.parse(localStorage.getItem('userExerciseData') || '[]');
      existingData.push({
        ...exerciseData,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('userExerciseData', JSON.stringify(existingData));
      
      return {
        success: true,
        data: { message: 'Exercise data saved locally' }
      };
    }
  } catch (error) {
    console.error('Error updating user data:', error);
    
    // Fallback: save to local storage
    try {
      const existingData = JSON.parse(localStorage.getItem('userExerciseData') || '[]');
      existingData.push({
        ...exerciseData,
        timestamp: new Date().toISOString(),
        fallback: true
      });
      localStorage.setItem('userExerciseData', JSON.stringify(existingData));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { message: 'Saved to local storage as fallback' }
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: 'Failed to save data both to server and locally'
      };
    }
  }
};

/**
 * Get user ID from local storage or generate one
 */
export const getUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};
