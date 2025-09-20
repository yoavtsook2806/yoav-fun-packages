import { useState, useEffect } from 'react';
import { TrainingState, ExerciseState } from './types';
import { getLatestTrainingPlan, getTrainingPlanByVersion } from './data/trainingPlans';
import TrainingSelection from './components/TrainingSelection';
import ExerciseFlow from './components/ExerciseFlow';
import TrainingComplete from './components/TrainingComplete';
import SettingsModal from './components/SettingsModal';
import FirstTimeSetup from './components/FirstTimeSetup';
import {
  getLastUsedWeight,
  getLastUsedRepeats,
  saveExerciseEntry,
  removeDuplicateHistoryEntries,
  clearExerciseHistory,
  getExerciseProgress,
  saveTrainingProgress,
  clearTrainingProgress,
  getDefaultWeight,
  getDefaultRestTime,
  getDefaultRepeats,
  clearExerciseDefaults,
  clearCustomExerciseData,
  calculateDefaultRestTime,
  calculateDefaultRepeats,
  getExerciseLastEntry,
  isFirstTimeExperience,
  saveExerciseDefaults
} from './utils/exerciseHistory';
import { saveTrainingCompletion } from './utils/trainingHistory';

function App() {
  // Get the latest training plan as default
  const latestPlan = getLatestTrainingPlan();
  
  // Current training plan (session-only, not saved to localStorage)
  const [currentTrainingPlan, setCurrentTrainingPlan] = useState(latestPlan);
  
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

  // Clean up duplicate history entries on app initialization
  useEffect(() => {
    removeDuplicateHistoryEntries();
  }, []);

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
      clearExerciseHistory();
      clearTrainingProgress();
      clearExerciseDefaults();
      clearCustomExerciseData();
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
        setTimeout(() => {
          saveExerciseEntry(exerciseName, historyEntry);
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
      // Save training completion to history
      if (trainingState.selectedTraining) {
        saveTrainingCompletion(trainingState.selectedTraining, trainingState.exercises);
      }
      
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
