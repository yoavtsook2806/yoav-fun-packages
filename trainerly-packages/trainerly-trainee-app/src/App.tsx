import { useState, useEffect } from 'react';
import { TrainingState, ExerciseState } from './types';
import TrainingSelection from './components/TrainingSelection';
import ExerciseFlow from './components/ExerciseFlow';
import TrainingComplete from './components/TrainingComplete';
import SettingsModal from './components/SettingsModal';
import FirstTimeSetup from './components/FirstTimeSetup';
import AuthScreen from './components/AuthScreen';
import { fetchTraineeData, clearTraineeCache, syncExerciseSession } from './services/traineeService';
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
        short: 'אין תרגילים',
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
  
  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);

  // First-time setup state
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [firstTimeTrainingType, setFirstTimeTrainingType] = useState<string | null>(null);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [traineeId, setTraineeId] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);

  // Load trainee data from server
  const loadTraineeData = async (traineeId: string, coachId?: string) => {
    console.log('🔄 Loading trainee data...');
    setIsLoadingPlan(true);
    
    try {
      const traineeData = await fetchTraineeData(traineeId, coachId);
      
      if (traineeData?.allPlans && traineeData.allPlans.length > 0) {
        setAllTrainingPlans(traineeData.allPlans);
        setCurrentTrainingPlan(traineeData.currentPlan || traineeData.allPlans[0]);
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

  // Check if authentication has expired (1 month)
  const isAuthExpired = (): boolean => {
    const authTimestamp = localStorage.getItem('trainerly_auth_timestamp');
    if (!authTimestamp) return true;
    
    const authDate = new Date(parseInt(authTimestamp));
    const now = new Date();
    const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    return (now.getTime() - authDate.getTime()) > oneMonth;
  };

  // Clean up duplicate history entries on app initialization and check authentication
  useEffect(() => {
    removeDuplicateHistoryEntries();
    
    // Check for existing authentication
    const storedTraineeId = localStorage.getItem('trainerly_trainee_id');
    const storedTrainerName = localStorage.getItem('trainerly_trainer_name');
    const storedCoachId = localStorage.getItem('trainerly_coach_id');
    
    if (storedTraineeId && storedTrainerName && !isAuthExpired()) {
      setTraineeId(storedTraineeId);
      setTrainerName(storedTrainerName);
      setCoachId(storedCoachId);
      setIsAuthenticated(true);
      
      // Load trainee data
      loadTraineeData(storedTraineeId, storedCoachId);
    } else if (storedTraineeId && storedTrainerName && isAuthExpired()) {
      // Authentication expired, clear stored data
      console.log('Authentication expired, requiring re-login');
      handleLogout();
    }
  }, []);

  // Handle authentication
  const handleAuthenticated = (newTraineeId: string, newTrainerName: string, newCoachId?: string) => {
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

  const handleFirstTimeSetupComplete = (exerciseDefaults: { [exerciseName: string]: { weight?: number; repeats?: number; timeToRest?: number } }) => {
    // Save all exercise defaults
    Object.entries(exerciseDefaults).forEach(([exerciseName, defaults]) => {
      saveExerciseDefaults(exerciseName, defaults.weight, defaults.timeToRest, defaults.repeats);
    });

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
              
              const syncSuccess = await syncExerciseSession(traineeId, exerciseSessionData);
              if (syncSuccess) {
                console.log('✅ Exercise synced to server:', exerciseName);
              } else {
                console.log('⚠️ Exercise saved locally but server sync failed:', exerciseName);
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
          onClick={() => setShowSettings(true)}
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
    return (
      <div className="app">
        {/* Settings button - top right corner */}
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
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
