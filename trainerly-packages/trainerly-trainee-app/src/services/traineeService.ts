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
    
    // Try to find the trainee by checking the known coach
    // In a real system, we'd have a better way to get this, but for now we'll use the coach we know
    const knownCoachId = '84b48a6d-65d0-4b71-bf69-16305af96815'; // The coach ID from our test data
    
    try {
      const trainersResponse = await fetch(`${API_BASE_URL}/coaches/${knownCoachId}/trainers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (trainersResponse.ok) {
        const trainersData = await trainersResponse.json();
        const foundTrainer = trainersData.items?.find((trainer: any) => trainer.trainerId === traineeId);
        
        if (foundTrainer) {
          traineeData = {
            trainerId: foundTrainer.trainerId,
            firstName: foundTrainer.firstName,
            lastName: foundTrainer.lastName,
            plans: foundTrainer.plans || [],
            currentPlan: null
          };
          console.log('📋 Found trainee with plans:', foundTrainer.plans);
        }
      }
    } catch (error) {
      console.error('Error fetching trainer data:', error);
    }
    
    // If trainee has plans, fetch all plan details
    if (traineeData.plans && traineeData.plans.length > 0) {
      const coachId = knownCoachId; // We know the coach ID
      const allPlans = [];
      
      // Fetch all plans
      for (const planId of traineeData.plans) {
        try {
          const planResponse = await fetch(`${API_BASE_URL}/coaches/${coachId}/training-plans/${planId}`, {
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
            console.warn(`Failed to fetch training plan ${planId}`);
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
