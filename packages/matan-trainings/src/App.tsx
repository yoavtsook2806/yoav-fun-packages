import { useState, useEffect } from 'react';
import { trainings } from './data/trainings';
import { TrainingState, ExerciseState } from './types';
import TrainingSelection from './components/TrainingSelection';
import ExerciseFlow from './components/ExerciseFlow';
import TrainingComplete from './components/TrainingComplete';
import { getLastUsedWeight, saveExerciseEntry, removeDuplicateHistoryEntries, clearExerciseHistory } from './utils/exerciseHistory';

function App() {
  const [trainingState, setTrainingState] = useState<TrainingState>({
    selectedTraining: null,
    restTime: 60,
    currentExerciseIndex: 0,
    exercises: [],
    exerciseStates: {},
    isTrainingComplete: false,
  });

  // Clean up duplicate history entries on app initialization
  useEffect(() => {
    removeDuplicateHistoryEntries();
  }, []);

  const handleClearAllHistory = () => {
    const confirmed = window.confirm(
      'האם אתה בטוח שברצונך למחוק את כל ההיסטוריה של התרגילים?\n\nפעולה זו לא ניתנת לביטול.'
    );
    
    if (confirmed) {
      clearExerciseHistory();
      alert('כל ההיסטוריה נמחקה בהצלחה!');
      
      // Optionally reload the page to reset the app state
      window.location.reload();
    }
  };

  const initializeTraining = (trainingType: string, restTime: number) => {
    const exercises = Object.keys(trainings[trainingType]);
    const exerciseStates: { [exerciseName: string]: ExerciseState } = {};

    exercises.forEach(exerciseName => {
      const lastUsedWeight = getLastUsedWeight(exerciseName);
      exerciseStates[exerciseName] = {
        currentSet: 0,
        completed: false,
        isActive: false,
        isResting: false,
        timeLeft: 0,
        weight: lastUsedWeight,
      };
    });

    setTrainingState({
      selectedTraining: trainingType,
      restTime,
      currentExerciseIndex: 0,
      exercises,
      exerciseStates,
      isTrainingComplete: false,
    });
  };

  const resetTraining = () => {
    setTrainingState({
      selectedTraining: null,
      restTime: 60,
      currentExerciseIndex: 0,
      exercises: [],
      exerciseStates: {},
      isTrainingComplete: false,
    });
  };

  const updateExerciseState = (exerciseName: string, updates: Partial<ExerciseState>) => {
    setTrainingState(prev => {
      const currentState = prev.exerciseStates[exerciseName];
      const newState = { ...currentState, ...updates };
      
      // If exercise is being completed for the first time, save to history
      if (!currentState.completed && updates.completed === true) {
        const exercise = trainings[prev.selectedTraining!][exerciseName];
        const historyEntry = {
          date: new Date().toISOString(),
          weight: newState.weight,
          restTime: newState.customRestTime || prev.restTime,
          completedSets: newState.currentSet,
          totalSets: exercise.numberOfSets,
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
      // Check if all exercises are completed
      const allCompleted = trainingState.exercises.every(
        exerciseName => trainingState.exerciseStates[exerciseName].completed
      );
      if (allCompleted) {
        setTrainingState(prev => ({
          ...prev,
          isTrainingComplete: true,
        }));
      }
    }
  };

  // Check if training is complete whenever exercise states change
  useEffect(() => {
    if (trainingState.exercises.length > 0) {
      const allCompleted = trainingState.exercises.every(
        exerciseName => trainingState.exerciseStates[exerciseName].completed
      );
      if (allCompleted && !trainingState.isTrainingComplete) {
        setTrainingState(prev => ({
          ...prev,
          isTrainingComplete: true,
        }));
      }
    }
  }, [trainingState.exerciseStates, trainingState.exercises, trainingState.isTrainingComplete]);

  if (trainingState.isTrainingComplete) {
    return (
      <div className="app">
        {/* Hidden debug button - top right corner */}
        <button
          className="hidden-debug-btn"
          onClick={handleClearAllHistory}
          title="Debug: Clear all history"
        >
          🗑️
        </button>
        <TrainingComplete onRestart={resetTraining} />
      </div>
    );
  }

  if (!trainingState.selectedTraining) {
    return (
      <div className="app">
        {/* Hidden debug button - top right corner */}
        <button
          className="hidden-debug-btn"
          onClick={handleClearAllHistory}
          title="Debug: Clear all history"
        >
          🗑️
        </button>
        <TrainingSelection
          onSelectTraining={initializeTraining}
          availableTrainings={Object.keys(trainings)}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Hidden debug button - top right corner */}
      <button
        className="hidden-debug-btn"
        onClick={handleClearAllHistory}
        title="Debug: Clear all history"
      >
        🗑️
      </button>
      <ExerciseFlow
        trainingState={trainingState}
        trainings={trainings}
        onUpdateExerciseState={updateExerciseState}
        onGoToExercise={goToExercise}
        onNextExercise={nextExercise}
        onResetTraining={resetTraining}
      />
    </div>
  );
}

export default App;
