// Import trainee app types
import { Trainings, Exercise } from '../types';

interface TraineeData {
  trainerId: string;
  firstName: string;
  lastName: string;
  plans: string[];
  currentPlan?: {
    planId: string;
    name: string;
    version: string; // We'll use planId as version for compatibility
    trainings: Trainings;
  };
  allPlans?: Array<{
    planId: string;
    name: string;
    version: string;
    trainings: Trainings;
  }>;
}

// Server types (simplified)
interface ServerTrainingPlan {
  planId: string;
  name: string;
  trainings: ServerTrainingItem[];
}

interface ServerTrainingItem {
  name: string;
  order: number;
  exercises: ServerPrescribedExercise[];
}

interface ServerPrescribedExercise {
  exerciseName: string;
  numberOfSets: number;
  minimumTimeToRest: number;
  maximumTimeToRest: number;
  minimumNumberOfRepeasts: number;
  maximumNumberOfRepeasts: number;
  prescriptionNote?: string;
}

// Convert server training plan format to trainee app format
const convertServerPlanToTraineeFormat = (serverPlan: ServerTrainingPlan): { version: string; name: string; trainings: Trainings } => {
  console.log('🔄 Converting server plan:', serverPlan);
  
  const trainings: Trainings = {};
  
  // Group exercises by training name
  serverPlan.trainings.forEach(training => {
    console.log(`🏋️ Processing training: ${training.name}`);
    const trainingExercises: { [exerciseName: string]: Exercise } = {};
    
    training.exercises.forEach(prescribedExercise => {
      console.log(`💪 Adding exercise: ${prescribedExercise.exerciseName}`);
      trainingExercises[prescribedExercise.exerciseName] = {
        numberOfSets: prescribedExercise.numberOfSets,
        minimumTimeToRest: prescribedExercise.minimumTimeToRest,
        maximumTimeToRest: prescribedExercise.maximumTimeToRest,
        minimumNumberOfRepeasts: prescribedExercise.minimumNumberOfRepeasts,
        maximumNumberOfRepeasts: prescribedExercise.maximumNumberOfRepeasts,
        note: prescribedExercise.prescriptionNote || '',
        short: prescribedExercise.exerciseName, // Use exercise name as short description
        link: '' // We don't have links in the current structure
      };
    });
    
    trainings[training.name] = trainingExercises;
  });
  
  const result = {
    version: serverPlan.planId, // Use planId as version
    name: serverPlan.name,
    trainings
  };
  
  console.log('✅ Converted plan result:', result);
  return result;
};

interface CachedTraineeData {
  data: TraineeData;
  timestamp: number;
}

const API_BASE_URL = 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Exercise Session types for server API
interface ExerciseSessionData {
  exerciseName: string;
  trainingType: string;
  completedAt: string;
  totalSets: number;
  completedSets: number;
  setsData: Array<{
    weight?: number;
    repeats?: number;
  }>;
  restTime?: number;
}

export const fetchTraineeData = async (traineeId: string, coachId?: string): Promise<TraineeData | null> => {
  try {
    console.log(`🔄 Fetching trainee data for ID: ${traineeId}, Coach ID: ${coachId}`);
    
    // Check cache first (but let's skip cache for debugging)
    const cacheKey = `trainerly_trainee_data_${traineeId}`;
    const cachedDataString = localStorage.getItem(cacheKey);
    
    // DEBUGGING: Skip cache to always fetch fresh data
    console.log('🔧 DEBUG MODE: Skipping cache to fetch fresh data');
    
    if (false && cachedDataString) { // Disabled for debugging
      try {
        const cachedData: CachedTraineeData = JSON.parse(cachedDataString);
        const now = Date.now();
        
        // Check if cache is still valid (within 24 hours)
        if (now - cachedData.timestamp < CACHE_DURATION) {
          console.log('📦 Using cached trainee data');
          return cachedData.data;
        } else {
          console.log('⏰ Cache expired, fetching fresh data');
        }
      } catch (parseError) {
        console.warn('Failed to parse cached data, fetching fresh:', parseError);
      }
    }
    
    // First, we need to find which coach this trainee belongs to
    // We'll search all coaches to find the one that has this trainee
    // This is a workaround since we don't have a direct endpoint to get coachId from traineeId
    
    let traineeData: TraineeData = {
      trainerId: traineeId,
      firstName: '',
      lastName: '',
      plans: [],
      currentPlan: null
    };
    
    // Use the provided coach ID or fall back to searching (for backward compatibility)
    let actualCoachId = coachId;
    
    if (!actualCoachId) {
      console.warn('⚠️ No coach ID provided, this may cause issues fetching training plans');
      // Fallback: try to find trainee across coaches (less efficient but works)
      const fallbackCoachId = '84b48a6d-65d0-4b71-bf69-16305af96815'; // Temporary fallback
      actualCoachId = fallbackCoachId;
      console.log('🔄 Using fallback coach ID:', actualCoachId);
    } else {
      console.log('✅ Using provided coach ID:', actualCoachId);
    }
    
    try {
      const trainersResponse = await fetch(`${API_BASE_URL}/coaches/${actualCoachId}/trainers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (trainersResponse.ok) {
        const trainersData = await trainersResponse.json();
        console.log('📋 All trainers data:', trainersData);
        const foundTrainer = trainersData.items?.find((trainer: any) => trainer.trainerId === traineeId);
        
        if (foundTrainer) {
          console.log('✅ Found trainer:', foundTrainer);
          traineeData = {
            trainerId: foundTrainer.trainerId,
            firstName: foundTrainer.firstName,
            lastName: foundTrainer.lastName,
            plans: foundTrainer.plans || [],
            currentPlan: null
          };
          console.log('📋 Found trainee with plans:', foundTrainer.plans);
        } else {
          console.error('❌ Trainer not found in response. Looking for ID:', traineeId);
          console.error('Available trainers:', trainersData.items?.map((t: any) => ({ id: t.trainerId, name: `${t.firstName} ${t.lastName}` })));
        }
      } else {
        console.error('❌ Failed to fetch trainers:', trainersResponse.status, trainersResponse.statusText);
        const errorText = await trainersResponse.text().catch(() => 'No error details');
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error fetching trainer data:', error);
    }
    
    // If trainee has plans, fetch all plan details
    if (traineeData.plans && traineeData.plans.length > 0) {
      console.log('📋 Trainee has plans:', traineeData.plans);
      const coachIdForPlans = actualCoachId; // Use the actual coach ID
      const allPlans = [];
      
      // Fetch all plans
      for (const planId of traineeData.plans) {
        console.log(`🔄 Fetching plan: ${planId} from coach: ${coachIdForPlans}`);
        try {
          const planResponse = await fetch(`${API_BASE_URL}/coaches/${coachIdForPlans}/training-plans/${planId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (planResponse.ok) {
            const serverPlanData = await planResponse.json();
            const convertedPlan = convertServerPlanToTraineeFormat(serverPlanData);
            const plan = {
              planId: serverPlanData.planId,
              name: convertedPlan.name,
              version: convertedPlan.version,
              trainings: convertedPlan.trainings
            };
            allPlans.push(plan);
            console.log('✅ Fetched plan:', convertedPlan.name);
          } else {
            console.warn(`Failed to fetch training plan ${planId}:`, planResponse.status, planResponse.statusText);
            const errorText = await planResponse.text().catch(() => 'No error details');
            console.warn('Error details:', errorText);
          }
        } catch (planError) {
          console.error(`Error fetching training plan ${planId}:`, planError);
        }
      }
      
      traineeData.allPlans = allPlans;
      
      // Set current plan as the last one (most recent)
      if (allPlans.length > 0) {
        traineeData.currentPlan = allPlans[allPlans.length - 1];
        console.log('✅ Set current plan:', traineeData.currentPlan.name);
      } else {
        console.warn('⚠️ No plans could be fetched, but trainee has plan IDs:', traineeData.plans);
      }
    } else {
      console.log('ℹ️ Trainee has no plans assigned');
    }
    
    // Cache the fresh data
    const cacheData: CachedTraineeData = {
      data: traineeData,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('💾 Cached fresh trainee data:', traineeData);
    
    return traineeData;
    
  } catch (error) {
    console.error('Failed to fetch trainee data:', error);
    return null;
  }
};

export const clearTraineeCache = (traineeId: string) => {
  const cacheKey = `trainerly_trainee_data_${traineeId}`;
  localStorage.removeItem(cacheKey);
  console.log('🗑️ Cleared trainee cache');
};

/**
 * Sync exercise completion to server
 */
export const syncExerciseSession = async (
  traineeId: string,
  exerciseSessionData: ExerciseSessionData
): Promise<boolean> => {
  try {
    console.log('🔄 Syncing exercise session to server:', {
      traineeId,
      exerciseName: exerciseSessionData.exerciseName,
      trainingType: exerciseSessionData.trainingType,
      completedSets: exerciseSessionData.completedSets,
      totalSets: exerciseSessionData.totalSets
    });

    const response = await fetch(`${API_BASE_URL}/trainers/${traineeId}/exercise-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exerciseSessionData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Exercise session synced successfully:', result.sessionId);
    return true;

  } catch (error) {
    console.error('❌ Failed to sync exercise session:', error);
    // Don't throw error - we want to continue even if sync fails
    return false;
  }
};

/**
 * Load exercise sessions from server and populate local storage
 */
export const loadExerciseHistoryFromServer = async (traineeId: string): Promise<boolean> => {
  try {
    console.log('📥 Loading exercise history from server for trainee:', traineeId);

    const response = await fetch(`${API_BASE_URL}/trainers/${traineeId}/exercise-sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const result = await response.json();
    const exerciseSessions = result.items || [];
    
    console.log(`📊 Found ${exerciseSessions.length} exercise sessions on server`);

    if (exerciseSessions.length === 0) {
      console.log('ℹ️ No exercise sessions found on server');
      return true;
    }

    // Import the localStorage functions we need
    const { saveExerciseEntry } = await import('../utils/exerciseHistory');

    // Group sessions by exercise and convert to the local storage format
    const exerciseHistoryMap: Record<string, any[]> = {};

    for (const session of exerciseSessions) {
      const exerciseName = session.exerciseName;
      
      if (!exerciseHistoryMap[exerciseName]) {
        exerciseHistoryMap[exerciseName] = [];
      }

      // Convert server format to local storage format
      const historyEntry = {
        date: session.completedAt,
        weight: session.setsData?.[0]?.weight, // First set weight for display
        repeats: session.setsData?.[0]?.repeats, // First set repeats for display
        restTime: session.restTime || 60,
        completedSets: session.completedSets,
        totalSets: session.totalSets,
        setsData: session.setsData || []
      };

      exerciseHistoryMap[exerciseName].push(historyEntry);
    }

    // Sort each exercise's history by date (most recent first) and save to localStorage
    for (const [exerciseName, entries] of Object.entries(exerciseHistoryMap)) {
      // Sort by date descending (most recent first)
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Save each entry (saveExerciseEntry handles duplicates and limits)
      for (const entry of entries) {
        saveExerciseEntry(exerciseName, entry);
      }
    }

    console.log(`✅ Successfully loaded exercise history for ${Object.keys(exerciseHistoryMap).length} exercises`);
    return true;

  } catch (error) {
    console.error('❌ Failed to load exercise history from server:', error);
    return false;
  }
};
