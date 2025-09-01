import React, { useState, useEffect } from 'react';
import { trainings } from './data/trainings';
import { TrainingState, ExerciseState } from './types';
import TrainingSelection from './components/TrainingSelection';
import ExerciseFlow from './components/ExerciseFlow';
import TrainingComplete from './components/TrainingComplete';

function App() {
  const [trainingState, setTrainingState] = useState<TrainingState>({
    selectedTraining: null,
    restTime: 60,
    currentExerciseIndex: 0,
    exercises: [],
    exerciseStates: {},
    isTrainingComplete: false,
  });

  const initializeTraining = (trainingType: string, restTime: number) => {
    const exercises = Object.keys(trainings[trainingType]);
    const exerciseStates: { [exerciseName: string]: ExerciseState } = {};

    exercises.forEach(exerciseName => {
      exerciseStates[exerciseName] = {
        currentSet: 0,
        completed: false,
        isActive: false,
        isResting: false,
        timeLeft: 0,
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
    setTrainingState(prev => ({
      ...prev,
      exerciseStates: {
        ...prev.exerciseStates,
        [exerciseName]: {
          ...prev.exerciseStates[exerciseName],
          ...updates,
        },
      },
    }));
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
        <TrainingComplete onRestart={resetTraining} />
      </div>
    );
  }

  if (!trainingState.selectedTraining) {
    return (
      <div className="app">
        <TrainingSelection
          onSelectTraining={initializeTraining}
          availableTrainings={Object.keys(trainings)}
        />
      </div>
    );
  }

  return (
    <ExerciseFlow
      trainingState={trainingState}
      trainings={trainings}
      onUpdateExerciseState={updateExerciseState}
      onGoToExercise={goToExercise}
      onNextExercise={nextExercise}
      onResetTraining={resetTraining}
    />
  );
}

export default App;
