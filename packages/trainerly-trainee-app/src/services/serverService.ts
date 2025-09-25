import { TrainingPlan, getLatestTrainingPlan, getLatestTrainingUpdates, getAllTrainingPlans } from '../data/trainingPlans';
import { 
  LAST_FETCH_DATE_KEY, 
  SERVER_TRAINING_PLAN_KEY, 
  USER_EXERCISE_DATA_KEY, 
  USER_ID_KEY,
  clearAllLocalStorageData 
} from '../constants/localStorage';

/**
 * Get the version of the currently stored training plan
 */
const getCurrentStoredVersion = (): string | undefined => {
  try {
    const storedPlan = localStorage.getItem(SERVER_TRAINING_PLAN_KEY);
    console.log(`🔍 Looking for stored plan in key: ${SERVER_TRAINING_PLAN_KEY}`);
    console.log(`🔍 Found stored plan: ${storedPlan ? 'YES' : 'NO'}`);
    
    if (storedPlan) {
      const plan: TrainingPlan = JSON.parse(storedPlan);
      console.log(`🔍 Stored plan version: ${plan.version}`);
      return plan.version;
    }
  } catch (error) {
    console.error('Error getting stored training plan version:', error);
  }
  console.log(`🔍 Returning undefined - no stored plan found`);
  return undefined;
};

/**
 * Save the latest training plan to local storage
 */
const saveLatestTrainingPlan = (trainingPlans: TrainingPlan[]): void => {
  console.log(`💾 saveLatestTrainingPlan called with ${trainingPlans.length} plans`);
  if (trainingPlans.length > 0) {
    const latestPlan = trainingPlans[trainingPlans.length - 1];
    try {
      localStorage.setItem(SERVER_TRAINING_PLAN_KEY, JSON.stringify(latestPlan));
      console.log(`💾 Saved training plan v${latestPlan.version} to key: ${SERVER_TRAINING_PLAN_KEY}`);
      
      // Verify it was saved
      const verification = localStorage.getItem(SERVER_TRAINING_PLAN_KEY);
      console.log(`💾 Verification - plan saved successfully: ${verification ? 'YES' : 'NO'}`);
    } catch (error) {
      console.error('Error saving training plan:', error);
    }
  } else {
    console.log(`💾 No training plans to save`);
  }
};

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
 * Check if we need to fetch new trainings (once per minute for testing - will be changed back to 24 hours)
 */
const shouldFetchTrainings = (): boolean => {
  const lastFetchTimestamp = localStorage.getItem(LAST_FETCH_DATE_KEY);
  if (!lastFetchTimestamp) return true;
  
  const lastFetch = new Date(parseInt(lastFetchTimestamp));
  const now = new Date();
  const oneMinute = 60 * 1000; // 1 minute in milliseconds
  
  return (now.getTime() - lastFetch.getTime()) >= oneMinute;
};

/**
 * Mark trainings as fetched now
 */
const markTrainingsFetched = (): void => {
  const now = new Date().getTime().toString();
  localStorage.setItem(LAST_FETCH_DATE_KEY, now);
};

/**
 * Fetch new trainings from server or local data
 * This function gets trainings newer than the current version
 */
export const fetchNewTrainings = async (currentVersion?: string): Promise<ServerResponse<TrainingPlan[]>> => {
  // Trainerly always uses server data (hardcoded)
  
  console.log(`🔄 fetchNewTrainings called with currentVersion: ${currentVersion || 'undefined'}`);
  
  // Check if we already fetched today
  if (!shouldFetchTrainings()) {
    console.log('Trainings already fetched today, skipping...');
    // Return newer trainings based on current version, or all trainings if no version specified
    const newerTrainings = currentVersion ? getLatestTrainingUpdates(currentVersion) : getAllTrainingPlans();
    
    // Save the latest training plan even in cached path (in case it wasn't saved before)
    saveLatestTrainingPlan(newerTrainings);
    
    console.log(`📦 Returning cached data: ${newerTrainings.length} training plan(s) ${currentVersion ? `(newer than ${currentVersion})` : '(all available)'}`);
    if (newerTrainings.length > 0) {
      console.log(`📋 Training plans returned:`, newerTrainings.map(tp => `${tp.name} (v${tp.version})`));
    }
    return {
      success: true,
      data: newerTrainings
    };
  }
  
  try {
    if (true) { // Always use server data in Trainerly
      // TODO: Call real server endpoint
      // const response = await fetch('/api/trainings/latest');
      // const data = await response.json();
      // 
      // if (response.ok) {
      //   // Update local storage with server data
      //   localStorage.setItem(SERVER_TRAINING_PLAN_KEY, JSON.stringify(data));
      //   markTrainingsFetched();
      //   return { success: true, data };
      // } else {
      //   throw new Error(data.error || 'Failed to fetch trainings');
      // }
      
      // For now, simulate server call with local data
      console.log('🔄 Fetching new trainings from server...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      const newerTrainings = currentVersion ? getLatestTrainingUpdates(currentVersion) : getAllTrainingPlans();
      markTrainingsFetched();
      
      // Save the latest training plan to local storage
      saveLatestTrainingPlan(newerTrainings);
      
      console.log(`✅ Successfully fetched ${newerTrainings.length} training plan(s) ${currentVersion ? `(newer than ${currentVersion})` : '(all available)'}`);
      if (newerTrainings.length > 0) {
        console.log(`📋 Training plans fetched:`, newerTrainings.map(tp => ({
          name: tp.name,
          version: tp.version,
          trainingTypes: Object.keys(tp.trainings).length
        })));
      } else {
        console.log(`📭 No ${currentVersion ? 'newer' : ''} training plans available`);
      }
      
      return {
        success: true,
        data: newerTrainings
      };
    } else {
      // Use local data
      console.log(`🔄 Fetching new trainings from local data...currentVersion: ${currentVersion}`);
      let newerTrainings: TrainingPlan[];
      if (currentVersion && (currentVersion as string).length > 0) {
        newerTrainings = getLatestTrainingUpdates(currentVersion as string);
      } else {
        newerTrainings = getAllTrainingPlans();
      }
      markTrainingsFetched();
      
      // Save the latest training plan to local storage
      saveLatestTrainingPlan(newerTrainings);
      
      console.log(`✅ Successfully fetched ${newerTrainings.length} training plan(s) from local data ${currentVersion ? `(newer than ${currentVersion})` : '(all available)'}`);
      if (newerTrainings.length > 0) {
        console.log(`📋 Training plans from local data:`, newerTrainings.map(tp => ({
          name: tp.name,
          version: tp.version,
          trainingTypes: Object.keys(tp.trainings).length
        })));
      } else {
        console.log(`📭 No ${currentVersion ? 'newer' : ''} training plans available in local data`);
      }
      
      return {
        success: true,
        data: newerTrainings
      };
    }
  } catch (error) {
    console.error('❌ Error fetching trainings:', error);
    
    // Fallback to local data
    console.log('🔄 Falling back to local data...');
    const newerTrainings = currentVersion ? getLatestTrainingUpdates(currentVersion) : [getLatestTrainingPlan()];
    
    console.log(`⚠️ Fallback: returning ${newerTrainings.length} training plan(s) from local data`);
    if (newerTrainings.length > 0) {
      console.log(`📋 Fallback training plans:`, newerTrainings.map(tp => ({
        name: tp.name,
        version: tp.version,
        trainingTypes: Object.keys(tp.trainings).length
      })));
    }
    
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
  // Trainerly always uses server data (hardcoded)
  
  try {
    if (true) { // Always use server data in Trainerly
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
      const existingData = JSON.parse(localStorage.getItem(USER_EXERCISE_DATA_KEY) || '[]');
      existingData.push({
        ...exerciseData,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(USER_EXERCISE_DATA_KEY, JSON.stringify(existingData));
      
      return {
        success: true,
        data: { message: 'Exercise data updated successfully' }
      };
    } else {
      // Save to local storage only
      const existingData = JSON.parse(localStorage.getItem(USER_EXERCISE_DATA_KEY) || '[]');
      existingData.push({
        ...exerciseData,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(USER_EXERCISE_DATA_KEY, JSON.stringify(existingData));
      
      return {
        success: true,
        data: { message: 'Exercise data saved locally' }
      };
    }
  } catch (error) {
    console.error('Error updating user data:', error);
    
    // Fallback: save to local storage
    try {
      const existingData = JSON.parse(localStorage.getItem(USER_EXERCISE_DATA_KEY) || '[]');
      existingData.push({
        ...exerciseData,
        timestamp: new Date().toISOString(),
        fallback: true
      });
      localStorage.setItem(USER_EXERCISE_DATA_KEY, JSON.stringify(existingData));
      
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
 * Get the current version to use for fetching new trainings
 * Returns undefined for first time, stored version for subsequent times
 */
export const getCurrentVersionForFetch = (): string | undefined => {
  // Check if we have a stored training plan to determine if this is first time
  try {
    console.log('🔍 Getting stored version...');
    const storedVersion = getCurrentStoredVersion();
    
    if (!storedVersion) {
      console.log('🆕 First time user (no stored training plan) - will fetch all training plans');
      return undefined;
    }
    
    console.log(`🔄 Returning user - will check for plans newer than: ${storedVersion}`);
    return storedVersion;
  } catch (error) {
    console.error('Error determining current version:', error);
    return undefined;
  }
};

/**
 * Clear all app data from local storage
 * This is now just an alias to the centralized clearing function
 */
export const clearServerData = clearAllLocalStorageData;

/**
 * Get user ID from local storage or generate one
 */
export const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};
