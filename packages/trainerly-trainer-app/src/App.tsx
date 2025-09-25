import { useState, useEffect } from 'react';
import { TrainingState, ExerciseState } from './types';
import { getLatestTrainingPlan, getTrainingPlanByVersion } from './data/trainingPlans';
import TrainingSelection from './components/TrainingSelection';
import ExerciseFlow from './components/ExerciseFlow';
import TrainingComplete from './components/TrainingComplete';
import SettingsModal from './components/SettingsModal';
import FirstTimeSetup from './components/FirstTimeSetup';
import { getAppConfig } from './utils/urlParams';
import { fetchNewTrainings, updateUserData, getUserId, ExerciseCompletionData, getCurrentVersionForFetch } from './services/serverService';
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

function App() {
  // Get the latest training plan as default
  const latestPlan = getLatestTrainingPlan();
  
  // Current training plan (session-only, not saved to localStorage)
  const [currentTrainingPlan, setCurrentTrainingPlan] = useState(latestPlan);
  
  // App configuration - always true for both settings in Trainerly app
  const appConfig = getAppConfig();
  
  // Log config for debugging
  console.log('App config:', appConfig);
  
  
  const [trainingState, setTrainingState] = useState<TrainingState>({
    selectedTraining: null,
    restTime: 60,
    currentExerciseIndex: 0,
    exercises: [],
    exerciseStates: {},
    isTrainingComplete: false,
    trainingPlanVersion: latestPlan.version,
  });
  
  // Track if this is a fresh completion (to show congratulation only once)
  const [showCongratulation, setShowCongratulation] = useState(false);
  
  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);

  // First-time setup state
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [firstTimeTrainingType, setFirstTimeTrainingType] = useState<string | null>(null);

  // Clean up duplicate history entries on app initialization and fetch new trainings
  useEffect(() => {
    removeDuplicateHistoryEntries();
    
    // Fetch new trainings on app load
    const initializeApp = async () => {
      try {
        // Get the appropriate version to check for updates
        const versionToCheck = getCurrentVersionForFetch();
        
        console.log(`🚀 Initializing app - Version to check: ${versionToCheck || 'undefined'}`);
        
        const response = await fetchNewTrainings(versionToCheck);
        if (response.success && response.data && response.data.length > 0) {
          // Get the latest training plan from the response
          const latestNewPlan = response.data[response.data.length - 1];
          
          // Update current training plan if we got newer data
          if (latestNewPlan && latestNewPlan.version !== currentTrainingPlan.version) {
            setCurrentTrainingPlan(latestNewPlan);
            console.log('Updated to new training plan:', latestNewPlan.version);
            console.log('Available versions:', response.data.map(p => p.version));
          } else {
            console.log('No newer training plans available');
          }
        }
      } catch (error) {
        console.error('Failed to fetch new trainings:', error);
      }
    };
    
    initializeApp();
  }, []);
  
  // No need to listen for URL parameter changes in Trainerly app

  // Handle training plan change (session-only)
  const handleTrainingPlanChange = (version: string) => {
    const newPlan = getTrainingPlanByVersion(version);
    if (newPlan) {
      setCurrentTrainingPlan(newPlan);
      // Reset training state when changing plans
      setTrainingState(prev => ({
        ...prev,
        selectedTraining: null,
        currentExerciseIndex: 0,
        exercises: [],
        exerciseStates: {},
        isTrainingComplete: false,
        trainingPlanVersion: version,
      }));
      setShowCongratulation(false);
    }
  };

  const handleClearAllHistory = () => {
    const confirmed = window.confirm(
      'האם אתה בטוח שברצונך למחוק את כל ההיסטוריה של התרגילים?\n\nפעולה זו לא ניתנת לביטול.'
    );
    
    if (confirmed) {
      console.log('Clearing all storage data...');
      clearAllLocalStorageData();
      console.log('All storage data cleared successfully');
      alert('כל ההיסטוריה נמחקה בהצלחה!');
      
      // Optionally reload the page to reset the app state
      window.location.reload();
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
      
      // If exercise is being completed for the first time, save to history and server
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
          
          // Send to server
          try {
            const exerciseData: ExerciseCompletionData = {
              userId: getUserId(),
              exerciseName,
              trainingType: prev.selectedTraining!,
              date: historyEntry.date,
              weight: firstSetWeight,
              repeats: firstSetRepeats,
              restTime: historyEntry.restTime,
              setsData: newState.setsData,
              completed: true
            };
            
            const response = await updateUserData(exerciseData);
            if (response.success) {
              console.log('Exercise data sent to server successfully');
            } else {
              console.warn('Failed to send exercise data to server:', response.error);
            }
          } catch (error) {
            console.error('Error sending exercise data to server:', error);
          }
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

  // Note: Removed automatic training completion check - now handled manually after last exercise feedback

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
            onClearAllHistory={handleClearAllHistory}
            currentTrainingPlanVersion={currentTrainingPlan.version}
            onTrainingPlanChange={handleTrainingPlanChange}
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
          trainingPlanVersion={currentTrainingPlan.version}
          trainings={currentTrainingPlan.trainings}
        />

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onClearAllHistory={handleClearAllHistory}
            currentTrainingPlanVersion={currentTrainingPlan.version}
            onTrainingPlanChange={handleTrainingPlanChange}
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
