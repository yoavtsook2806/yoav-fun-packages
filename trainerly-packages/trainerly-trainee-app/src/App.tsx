import { useState, useEffect } from 'react';
import { TrainingState, ExerciseState } from './types';
import TrainingSelection from './components/TrainingSelection';
import ExerciseFlow from './components/ExerciseFlow';
import TrainingComplete from './components/TrainingComplete';
import SettingsModal from './components/SettingsModal';
import FirstTimeSetup from './components/FirstTimeSetup';
import AuthScreen from './components/AuthScreen';
import { fetchTraineeData, clearTraineeCache, syncExerciseSession, loadAllTraineeDataFromServer, syncAllTraineeDataToServer } from './services/traineeService';
import { clearAllLocalStorageData } from './constants/localStorage';
import {
  getLastUsedWeight,
  getLastUsedRepeats,
  saveExerciseEntry,
  removeDuplicateHistoryEntries,
  getExerciseProgress,
  saveTrainingProgress,
  getDefaultWeight,
  getDefaultRestTime,
  getDefaultRepeats,
  calculateDefaultRestTime,
  calculateDefaultRepeats,
  getExerciseLastEntry,
  isFirstTimeExperience,
  saveExerciseDefaults
} from './utils/exerciseHistory';

// Default empty training plan structure
const createEmptyTrainingPlan = () => ({
  planId: 'no-plan',
  name: 'אין תוכנית אימונים',
  version: '1.0',
  trainings: {
    'אין תוכנית': {
      'אין תרגילים': {
        numberOfSets: 1,
        minimumTimeToRest: 60,
        maximumTimeToRest: 120,
        minimumNumberOfRepeasts: 1,
        maximumNumberOfRepeasts: 10,
        note: 'לא הוקצתה תוכנית אימונים. אנא פנה למאמן שלך.',
        muscleGroup: 'כללי',
        link: ''
      }
    }
  }
});

function App() {
  // Current training plan (loaded from server)
  const [currentTrainingPlan, setCurrentTrainingPlan] = useState(createEmptyTrainingPlan());
  const [allTrainingPlans, setAllTrainingPlans] = useState<Array<{
    planId: string;
    name: string;
    version: string;
    trainings: any;
  }>>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  
  const [trainingState, setTrainingState] = useState<TrainingState>({
    selectedTraining: null,
    restTime: 60,
    currentExerciseIndex: 0,
    exercises: [],
    exerciseStates: {},
    isTrainingComplete: false,
    trainingPlanVersion: '1.0',
  });
  
  // Track if this is a fresh completion (to show congratulation only once)
  const [showCongratulation, setShowCongratulation] = useState(false);
  
  // Check if authentication has expired (1 month) - defined early for state initialization
  const isAuthExpired = (): boolean => {
    const authTimestamp = localStorage.getItem('trainerly_auth_timestamp');
    if (!authTimestamp) return true;
    
    const authDate = new Date(parseInt(authTimestamp));
    const now = new Date();
    const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    return (now.getTime() - authDate.getTime()) > oneMonth;
  };
  
  // Initialize authentication state optimistically based on localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedTraineeId = localStorage.getItem('trainerly_trainee_id');
    const storedTrainerName = localStorage.getItem('trainerly_trainer_name');
    
    if (storedTraineeId && storedTrainerName && !isAuthExpired()) {
      console.log('🚀 Optimistically showing app with stored credentials');
      return true;
    }
    return false;
  });
  
  const [traineeId, setTraineeId] = useState<string | null>(() => {
    return localStorage.getItem('trainerly_trainee_id');
  });
  
  const [trainerName, setTrainerName] = useState<string | null>(() => {
    return localStorage.getItem('trainerly_trainer_name');
  });
  
  const [coachId, setCoachId] = useState<string | null>(() => {
    return localStorage.getItem('trainerly_coach_id');
  });
  
  // Settings modal state - explicitly initialize to false to prevent hot reload issues
  const [showSettings, setShowSettings] = useState(() => {
    console.log('🔧 Initializing settings modal state to false');
    return false;
  });
  
  // Debug settings state changes
  useEffect(() => {
    console.log('🔧 Settings modal state changed:', showSettings);
    if (showSettings) {
      console.log('🔧 Settings modal OPENED - Stack trace:');
      console.trace();
    }
  }, [showSettings]);

  // Reset settings modal when authentication state changes
  useEffect(() => {
    if (showSettings && !isAuthenticated) {
      console.log('🔧 Closing settings modal due to authentication change');
      setShowSettings(false);
    }
  }, [isAuthenticated, showSettings]);

  // First-time setup state
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [firstTimeTrainingType, setFirstTimeTrainingType] = useState<string | null>(null);

  // Load trainee data from server
  const loadTraineeData = async (traineeId: string, coachId?: string) => {
    console.log('🔄 Loading trainee data...');
    setIsLoadingPlan(true);
    
    try {
      // FIRST: Load ALL trainee data from server and populate local storage
      // Rule: All data in local storage must be synced with server
      // This MUST happen BEFORE any first-time experience checks
      console.log('🔄 Loading all trainee data from server...');
      const dataLoaded = await loadAllTraineeDataFromServer(traineeId);
      if (dataLoaded) {
        console.log('✅ All trainee data loaded from server');
      } else {
        console.log('⚠️ Failed to load trainee data from server');
      }

      // THEN: Load training plans
      const traineeData = await fetchTraineeData(traineeId, coachId);
      
      if (traineeData?.allPlans && traineeData.allPlans.length > 0) {
        setAllTrainingPlans(traineeData.allPlans);
        setCurrentTrainingPlan(traineeData.currentPlan || traineeData.allPlans[0] as any);
        console.log('✅ Loaded training plans:', traineeData.allPlans.map(p => p.name));
        console.log('✅ Current plan:', traineeData.currentPlan?.name);
      } else {
        console.log('⚠️ No training plans assigned to trainee');
        setAllTrainingPlans([]);
        setCurrentTrainingPlan(createEmptyTrainingPlan());
      }
      
    } catch (error) {
      console.error('❌ Failed to load trainee data:', error);
      setCurrentTrainingPlan(createEmptyTrainingPlan());
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    console.log('🚪 Logging out user');
    setIsAuthenticated(false);
    setTraineeId(null);
    setTrainerName(null);
    setCoachId(null);
    localStorage.removeItem('trainerly_trainee_id');
    localStorage.removeItem('trainerly_trainer_name');
    localStorage.removeItem('trainerly_coach_id');
    localStorage.removeItem('trainerly_auth_timestamp');
    
    // Clear trainee data cache
    if (traineeId) {
      clearTraineeCache(traineeId);
    }
    
    clearAllLocalStorageData();
  };


  // Clean up duplicate history entries and validate user in background
  useEffect(() => {
    // Clean up duplicate history entries immediately
    console.log('🔄 App initialization - cleaning up history...');
    removeDuplicateHistoryEntries();
    
    const validateUserInBackground = async () => {
      const storedTraineeId = localStorage.getItem('trainerly_trainee_id');
      const storedTrainerName = localStorage.getItem('trainerly_trainer_name');
      const storedCoachId = localStorage.getItem('trainerly_coach_id');
      
      console.log('🔍 Stored auth data:', { storedTraineeId, storedTrainerName, storedCoachId });
      
      // Only validate if we have stored credentials and are currently authenticated
      if (storedTraineeId && storedTrainerName && isAuthenticated) {
        if (isAuthExpired()) {
          console.log('⏰ Authentication expired, requiring re-login');
          handleLogout();
          return;
        }
        
        try {
          console.log('🔍 Background validation: checking if trainee exists in database...');
          const response = await fetch(`https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev/trainers/${storedTraineeId}/data`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            console.log('✅ Background validation successful');
            // Load trainee data if authenticated
            loadTraineeData(storedTraineeId, storedCoachId);
          } else {
            console.log('❌ Background validation failed: trainee no longer exists, logging out...');
            // Trainee doesn't exist anymore, clear auth
            handleLogout();
          }
        } catch (error) {
          console.error('Error in background validation:', error);
          // Clear invalid data and show login screen
          handleLogout();
        }
      }
    };

    // Run validation in background after a brief delay to allow UI to render
    const timeoutId = setTimeout(validateUserInBackground, 100);
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated]);

  // Handle authentication
  const handleAuthenticated = (newTraineeId: string, newTrainerName: string, newCoachId?: string) => {
    console.log('🔐 handleAuthenticated called:', { newTraineeId, newTrainerName, newCoachId });
    setTraineeId(newTraineeId);
    setTrainerName(newTrainerName);
    setCoachId(newCoachId || null);
    setIsAuthenticated(true);
    
    // Store in localStorage for persistence with timestamp
    localStorage.setItem('trainerly_trainee_id', newTraineeId);
    localStorage.setItem('trainerly_trainer_name', newTrainerName);
    if (newCoachId) {
      localStorage.setItem('trainerly_coach_id', newCoachId);
    }
    localStorage.setItem('trainerly_auth_timestamp', Date.now().toString());
    
    console.log(`✅ Authentication successful for ${newTrainerName} (ID: ${newTraineeId}, Coach: ${newCoachId})`);
    
    // Load trainee data
    loadTraineeData(newTraineeId, newCoachId);
  };

  // Handle plan change from settings
  const handlePlanChange = (planId: string) => {
    const selectedPlan = allTrainingPlans.find(plan => plan.planId === planId);
    if (selectedPlan) {
      setCurrentTrainingPlan(selectedPlan);
      console.log('✅ Switched to plan:', selectedPlan.name);
      
      // Reset training state when changing plans
      setTrainingState({
        selectedTraining: null,
        restTime: 60,
        currentExerciseIndex: 0,
        exercises: [],
        exerciseStates: {},
        isTrainingComplete: false,
        trainingPlanVersion: selectedPlan.version,
      });
      setShowCongratulation(false);
    }
  };


  const initializeTraining = (trainingType: string) => {
    const exercises = Object.keys(currentTrainingPlan.trainings[trainingType]);

    // Check if this is a first-time experience
    if (isFirstTimeExperience(trainingType, exercises)) {
      setFirstTimeTrainingType(trainingType);
      setShowFirstTimeSetup(true);
      return;
    }

    const exerciseStates: { [exerciseName: string]: ExerciseState } = {};

    let allCompleted = true;
    exercises.forEach(exerciseName => {
      const exercise = currentTrainingPlan.trainings[trainingType][exerciseName];
      
      // Priority: default weight > first set from last workout > last used weight from history
      const defaultWeight = getDefaultWeight(exerciseName);
      const lastExerciseEntry = getExerciseLastEntry(exerciseName);
      const firstSetWeight = lastExerciseEntry?.setsData?.[0]?.weight;
      const lastUsedWeight = getLastUsedWeight(exerciseName);
      const weight = defaultWeight || firstSetWeight || lastUsedWeight;
      
      // Priority: default rest time > calculated default from exercise data
      const defaultRestTime = getDefaultRestTime(exerciseName);
      const calculatedRestTime = calculateDefaultRestTime(exercise);
      const customRestTime = defaultRestTime || calculatedRestTime;
      
      // Priority: default repeats > first set from last workout > last used repeats > calculated default from exercise data
      const defaultRepeats = getDefaultRepeats(exerciseName);
      const firstSetRepeats = lastExerciseEntry?.setsData?.[0]?.repeats;
      const lastUsedRepeats = getLastUsedRepeats(exerciseName);
      const calculatedRepeats = calculateDefaultRepeats(exercise);
      const repeats = defaultRepeats || firstSetRepeats || lastUsedRepeats || calculatedRepeats;
      
      const savedProgress = getExerciseProgress(trainingType, exerciseName);
      const totalSets = exercise.numberOfSets;
      const isCompleted = savedProgress >= totalSets;
      
      if (!isCompleted) {
        allCompleted = false;
      }
      
      exerciseStates[exerciseName] = {
        currentSet: savedProgress,
        completed: isCompleted,
        isActive: false,
        isResting: false,
        timeLeft: 0,
        startTimestamp: undefined,
        restDuration: undefined,
        weight: weight,
        customRestTime: customRestTime,
        repeats: repeats,
      };
    });

    setTrainingState({
      selectedTraining: trainingType,
      restTime: 60, // Default fallback, but exercises should use their customRestTime
      currentExerciseIndex: 0,
      exercises,
      exerciseStates,
      isTrainingComplete: allCompleted, // Set to true if all exercises were already completed today
      trainingPlanVersion: currentTrainingPlan.version,
    });
    
    // Don't show congratulation when loading a previously completed training
    setShowCongratulation(false);
  };

  const resetTraining = () => {
    setTrainingState({
      selectedTraining: null,
      restTime: 60,
      currentExerciseIndex: 0,
      exercises: [],
      exerciseStates: {},
      isTrainingComplete: false,
      trainingPlanVersion: currentTrainingPlan.version,
    });
    setShowCongratulation(false);
    setShowFirstTimeSetup(false);
    setFirstTimeTrainingType(null);
  };

  const handleFirstTimeSetupComplete = async (exerciseDefaults: { [exerciseName: string]: { weight?: number; repeats?: number; timeToRest?: number } }) => {
    // Save all exercise defaults
    Object.entries(exerciseDefaults).forEach(([exerciseName, defaults]) => {
      saveExerciseDefaults(exerciseName, defaults.weight, defaults.timeToRest, defaults.repeats);
    });

    // Mark first-time experience as completed
    localStorage.setItem('trainerly_first_time_completed', 'true');
    console.log('✅ First-time experience marked as completed');

    // Sync all data to server if authenticated
    if (traineeId) {
      const syncSuccess = await syncAllTraineeDataToServer(traineeId);
      if (syncSuccess) {
        console.log('✅ First-time setup data synced to server');
      }
    }

    // Close first-time setup
    setShowFirstTimeSetup(false);

    // Initialize training normally now that defaults are set
    if (firstTimeTrainingType) {
      const trainingType = firstTimeTrainingType;
      setFirstTimeTrainingType(null);
      initializeTraining(trainingType);
    }
  };

  const handleFirstTimeSetupCancel = () => {
    setShowFirstTimeSetup(false);
    setFirstTimeTrainingType(null);
  };

  const updateExerciseState = (exerciseName: string, updates: Partial<ExerciseState>) => {
    setTrainingState(prev => {
      const currentState = prev.exerciseStates[exerciseName];
      const newState = { ...currentState, ...updates };
      
      // Save progress whenever currentSet changes
      if (updates.currentSet !== undefined && prev.selectedTraining) {
        setTimeout(() => {
          saveTrainingProgress(prev.selectedTraining!, exerciseName, newState.currentSet);
        }, 0);
      }
      
      // If exercise is being completed for the first time, save to history
      if (!currentState.completed && updates.completed === true) {
        const exercise = currentTrainingPlan.trainings[prev.selectedTraining!][exerciseName];
        
        // Get first set data for backward compatibility (weight/repeats display in history)
        const firstSetData = newState.setsData?.[0];
        const firstSetWeight = firstSetData?.weight;
        const firstSetRepeats = firstSetData?.repeats;
        
        const historyEntry = {
          date: new Date().toISOString(),
          weight: firstSetWeight, // First set weight for display
          restTime: newState.customRestTime || prev.restTime,
          completedSets: newState.currentSet,
          totalSets: exercise.numberOfSets,
          repeats: firstSetRepeats, // First set repeats for display
          setsData: newState.setsData, // Complete per-set data
        };
        
        // Use setTimeout to avoid potential React batching issues
        setTimeout(async () => {
          // Save to local history
          saveExerciseEntry(exerciseName, historyEntry);
          
          // Sync to server if authenticated
          if (traineeId) {
            try {
              const exerciseSessionData = {
                exerciseName,
                trainingType: prev.selectedTraining!,
                completedAt: historyEntry.date,
                totalSets: historyEntry.totalSets,
                completedSets: historyEntry.completedSets,
                setsData: historyEntry.setsData || [],
                restTime: historyEntry.restTime
              };
              
              const sessionSyncSuccess = await syncExerciseSession(traineeId, exerciseSessionData);
              if (sessionSyncSuccess) {
                console.log('✅ Exercise session synced to server:', exerciseName);
              } else {
                console.log('⚠️ Exercise session saved locally but server sync failed:', exerciseName);
              }

              // 2. Sync ALL local storage data to server (comprehensive backup)
              // Rule: All data in local storage must also be saved to server
              const allDataSyncSuccess = await syncAllTraineeDataToServer(traineeId);
              if (allDataSyncSuccess) {
                console.log('✅ All trainee data synced to server');
              } else {
                console.log('⚠️ Failed to sync all trainee data to server');
              }
              
            } catch (error) {
              console.error('❌ Server sync error:', error);
            }
          }
          
          console.log('Exercise completed:', exerciseName, historyEntry);
        }, 0);
      }
      
      return {
        ...prev,
        exerciseStates: {
          ...prev.exerciseStates,
          [exerciseName]: newState,
        },
      };
    });
  };

  const goToExercise = (exerciseIndex: number) => {
    setTrainingState(prev => ({
      ...prev,
      currentExerciseIndex: exerciseIndex,
    }));
  };

  const nextExercise = () => {
    // First, check if all exercises are completed (regardless of current index)
    const allCompleted = trainingState.exercises.every(
      exerciseName => trainingState.exerciseStates[exerciseName].completed
    );
    
    if (allCompleted) {
      // Training is complete! Show congratulations
      setTrainingState(prev => ({
        ...prev,
        isTrainingComplete: true,
      }));
      setShowCongratulation(true);
      return; // Don't navigate to next exercise
    }
    
    // Find the next incomplete exercise (with wraparound)
    const currentIndex = trainingState.currentExerciseIndex;
    const totalExercises = trainingState.exercises.length;
    
    // Search from current+1 to end of list
    for (let i = currentIndex + 1; i < totalExercises; i++) {
      const exerciseName = trainingState.exercises[i];
      if (!trainingState.exerciseStates[exerciseName].completed) {
        setTrainingState(prev => ({
          ...prev,
          currentExerciseIndex: i,
        }));
        return;
      }
    }
    
    // If no incomplete exercise found after current, search from beginning to current
    for (let i = 0; i < currentIndex; i++) {
      const exerciseName = trainingState.exercises[i];
      if (!trainingState.exerciseStates[exerciseName].completed) {
        setTrainingState(prev => ({
          ...prev,
          currentExerciseIndex: i,
        }));
        return;
      }
    }
    
    // If we reach here, all exercises are completed (shouldn't happen due to check above)
  };

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    console.log('🔒 Rendering AuthScreen - not authenticated');
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  // Show loading if we're still loading the training plan
  if (isLoadingPlan) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>טוען תוכנית אימונים...</p>
        </div>
      </div>
    );
  }

  if (trainingState.isTrainingComplete && showCongratulation) {
    return (
      <div className="app">
        {/* Settings button - top right corner */}
        <button
          className="settings-btn"
          onClick={() => {
            console.log('⚙️ Settings button clicked (training selection screen)');
            setShowSettings(true);
          }}
          title="הגדרות"
        >
          ⚙️
        </button>
        <TrainingComplete onRestart={resetTraining} />
        
        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
            availablePlans={allTrainingPlans.map(plan => ({
              planId: plan.planId,
              name: plan.name,
              isCurrent: plan.planId === currentTrainingPlan.planId
            }))}
            onPlanChange={handlePlanChange}
          />
        )}
      </div>
    );
  }

  if (showFirstTimeSetup && firstTimeTrainingType) {
    return (
      <div className="app">
        <FirstTimeSetup
          trainingType={firstTimeTrainingType}
          exercises={Object.keys(currentTrainingPlan.trainings[firstTimeTrainingType])}
          trainings={currentTrainingPlan.trainings}
          onComplete={handleFirstTimeSetupComplete}
          onCancel={handleFirstTimeSetupCancel}
        />
      </div>
    );
  }

  if (!trainingState.selectedTraining) {
    console.log('🏠 Rendering home screen - showSettings:', showSettings);
    return (
      <div className="app">
        {/* Settings button - top right corner */}
        <button
          className="settings-btn"
          onClick={() => {
            console.log('⚙️ Settings button clicked');
            setShowSettings(true);
          }}
          title="הגדרות"
        >
          ⚙️
        </button>
        <TrainingSelection
          onSelectTraining={initializeTraining}
          availableTrainings={Object.keys(currentTrainingPlan.trainings)}
          trainings={currentTrainingPlan.trainings}
          trainerName={trainerName}
        />

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            onClose={() => {
              console.log('❌ Settings modal closed');
              setShowSettings(false);
            }}
            onLogout={handleLogout}
            availablePlans={allTrainingPlans.map(plan => ({
              planId: plan.planId,
              name: plan.name,
              isCurrent: plan.planId === currentTrainingPlan.planId
            }))}
            onPlanChange={handlePlanChange}
          />
        )}
      </div>
    );
  }

  return (
    <ExerciseFlow
      trainingState={trainingState}
      trainings={currentTrainingPlan.trainings}
      onUpdateExerciseState={updateExerciseState}
      onGoToExercise={goToExercise}
      onNextExercise={nextExercise}
      onResetTraining={resetTraining}
    />
  );
}

export default App;
