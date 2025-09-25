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
  const trainings: Trainings = {};
  
  // Group exercises by training name
  serverPlan.trainings.forEach(training => {
    const trainingExercises: { [exerciseName: string]: Exercise } = {};
    
    training.exercises.forEach(prescribedExercise => {
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
  
  return {
    version: serverPlan.planId, // Use planId as version
    name: serverPlan.name,
    trainings
  };
};

interface CachedTraineeData {
  data: TraineeData;
  timestamp: number;
}

const API_BASE_URL = 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const fetchTraineeData = async (traineeId: string): Promise<TraineeData | null> => {
  try {
    console.log(`🔄 Fetching trainee data for ID: ${traineeId}`);
    
    // Check cache first
    const cacheKey = `trainerly_trainee_data_${traineeId}`;
    const cachedDataString = localStorage.getItem(cacheKey);
    
    if (cachedDataString) {
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
    
    // Fetch trainee plans from server
    const plansResponse = await fetch(`${API_BASE_URL}/trainers/${traineeId}/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!plansResponse.ok) {
      throw new Error(`Failed to fetch trainee plans: ${plansResponse.status}`);
    }

    const plansData = await plansResponse.json();
    console.log('📋 Fetched trainee plans:', plansData);
    
    // Create trainee data structure
    const traineeData: TraineeData = {
      trainerId: traineeId,
      firstName: '', // We don't need this for the trainee app
      lastName: '',
      plans: plansData.plans || [],
      currentPlan: null
    };
    
    // If trainee has plans, fetch the current plan details
    if (plansData.plans && plansData.plans.length > 0) {
      // Get the latest plan (last in array)
      const latestPlan = plansData.plans[plansData.plans.length - 1];
      const currentPlanId = latestPlan.planId;
      const coachId = latestPlan.coachId;
      
      try {
        const planResponse = await fetch(`${API_BASE_URL}/coaches/${coachId}/training-plans/${currentPlanId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (planResponse.ok) {
          const serverPlanData = await planResponse.json();
          const convertedPlan = convertServerPlanToTraineeFormat(serverPlanData);
          traineeData.currentPlan = {
            planId: serverPlanData.planId,
            name: convertedPlan.name,
            version: convertedPlan.version,
            trainings: convertedPlan.trainings
          };
          console.log('✅ Fetched and converted training plan:', convertedPlan.name);
        } else {
          console.warn('Failed to fetch current training plan details');
        }
      } catch (planError) {
        console.error('Error fetching training plan details:', planError);
      }
    }
    
    // Cache the fresh data
    const cacheData: CachedTraineeData = {
      data: traineeData,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('💾 Cached fresh trainee data');
    
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
