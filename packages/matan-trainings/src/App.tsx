import { useState, useEffect } from 'react';
import { TrainingState, ExerciseState } from './types';
import { getLatestTrainingPlan, getTrainingPlanByVersion } from './data/trainingPlans';
import TrainingSelection from './components/TrainingSelection';
import ExerciseFlow from './components/ExerciseFlow';
import TrainingComplete from './components/TrainingComplete';
import SettingsModal from './components/SettingsModal';
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
  calculateDefaultRestTime,
  calculateDefaultRepeats
} from './utils/exerciseHistory';

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
      clearExerciseHistory();
      clearTrainingProgress();
      clearExerciseDefaults();
      alert('כל ההיסטוריה נמחקה בהצלחה!');
      
      // Optionally reload the page to reset the app state
      window.location.reload();
    }
  };

  const initializeTraining = (trainingType: string) => {
    const exercises = Object.keys(currentTrainingPlan.trainings[trainingType]);
    const exerciseStates: { [exerciseName: string]: ExerciseState } = {};

    let allCompleted = true;
    exercises.forEach(exerciseName => {
      const exercise = currentTrainingPlan.trainings[trainingType][exerciseName];
      
      // Priority: default weight > last used weight from history
      const defaultWeight = getDefaultWeight(exerciseName);
      const lastUsedWeight = getLastUsedWeight(exerciseName);
      const weight = defaultWeight || lastUsedWeight;
      
      // Priority: default rest time > calculated default from exercise data
      const defaultRestTime = getDefaultRestTime(exerciseName);
      const calculatedRestTime = calculateDefaultRestTime(exercise);
      const customRestTime = defaultRestTime || calculatedRestTime;
      
      // Priority: default repeats > last used repeats > calculated default from exercise data
      const defaultRepeats = getDefaultRepeats(exerciseName);
      const lastUsedRepeats = getLastUsedRepeats(exerciseName);
      const calculatedRepeats = calculateDefaultRepeats(exercise);
      const repeats = defaultRepeats || lastUsedRepeats || calculatedRepeats;
      
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
        const historyEntry = {
          date: new Date().toISOString(),
          weight: newState.weight && newState.weight > 0 ? newState.weight : undefined,
          restTime: newState.customRestTime || prev.restTime,
          completedSets: newState.currentSet,
          totalSets: exercise.numberOfSets,
          repeats: newState.repeats && newState.repeats > 0 ? newState.repeats : undefined,
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
    const nextIndex = trainingState.currentExerciseIndex + 1;
    if (nextIndex < trainingState.exercises.length) {
      setTrainingState(prev => ({
        ...prev,
        currentExerciseIndex: nextIndex,
      }));
    } else {
      // Check if all exercises are completed (this will be called after last exercise feedback)
      const allCompleted = trainingState.exercises.every(
        exerciseName => trainingState.exerciseStates[exerciseName].completed
      );
      if (allCompleted) {
        setTrainingState(prev => ({
          ...prev,
          isTrainingComplete: true,
        }));
        setShowCongratulation(true); // Show congratulation only for fresh completions
      }
    }
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
