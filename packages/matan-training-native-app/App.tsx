import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Alert } from 'react-native';
import { TrainingState, ExerciseState } from './src/types';
import { getLatestTrainingPlan } from './src/data/trainingPlans';
import TrainingSelection from './src/components/TrainingSelection';
import TrainingComplete from './src/components/TrainingComplete';
import ExerciseFlow from './src/components/ExerciseFlow';
import SettingsModal from './src/components/SettingsModal';
import { clearExerciseHistory, clearTrainingProgress, clearExerciseDefaults, clearCustomExerciseData } from './src/utils/exerciseHistory';

export default function App() {
  const latestPlan = getLatestTrainingPlan();
  
  const [trainingState, setTrainingState] = useState<TrainingState>({
    selectedTraining: null,
    restTime: 60,
    currentExerciseIndex: 0,
    exercises: [],
    exerciseStates: {},
    isTrainingComplete: false,
    trainingPlanVersion: latestPlan.version,
  });

  const [showCongratulation, setShowCongratulation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const initializeTraining = (trainingType: string) => {
    const exercises = Object.keys(latestPlan.trainings[trainingType]);
    const exerciseStates: { [exerciseName: string]: ExerciseState } = {};

    exercises.forEach(exerciseName => {
      const exercise = latestPlan.trainings[trainingType][exerciseName];
      exerciseStates[exerciseName] = {
        currentSet: 0,
        completed: false,
        isActive: false,
        isResting: false,
        timeLeft: 0,
        startTimestamp: undefined,
        restDuration: undefined,
        weight: undefined,
        customRestTime: undefined,
        repeats: undefined,
        setsData: [],
      };
    });

    setTrainingState({
      selectedTraining: trainingType,
      restTime: 60,
      currentExerciseIndex: 0,
      exercises,
      exerciseStates,
      isTrainingComplete: false,
      trainingPlanVersion: latestPlan.version,
    });
    setShowCongratulation(false);
  };

  const updateExerciseState = (exerciseName: string, updates: Partial<ExerciseState>) => {
    setTrainingState(prev => {
      const currentState = prev.exerciseStates[exerciseName];
      const newState = { ...currentState, ...updates };
      
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
    // Check if all exercises are completed
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
      return;
    }
    
    // Find the next incomplete exercise
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
  };

  const handleClearAllHistory = async () => {
    Alert.alert(
      'מחיקת כל ההיסטוריה',
      'האם אתה בטוח שברצונך למחוק את כל ההיסטוריה של התרגילים?\n\nפעולה זו לא ניתנת לביטול.',
      [
        {
          text: 'ביטול',
          style: 'cancel',
        },
        {
          text: 'מחק הכל',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Clearing all storage data...');
              await Promise.all([
                clearExerciseHistory(),
                clearTrainingProgress(),
                clearExerciseDefaults(),
                clearCustomExerciseData(),
              ]);
              console.log('All storage data cleared successfully');
              Alert.alert('הצלחה', 'כל ההיסטוריה נמחקה בהצלחה!');
              setShowSettings(false);
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('שגיאה', 'אירעה שגיאה במחיקת הנתונים');
            }
          },
        },
      ]
    );
  };

  const resetTraining = () => {
    setTrainingState({
      selectedTraining: null,
      restTime: 60,
      currentExerciseIndex: 0,
      exercises: [],
      exerciseStates: {},
      isTrainingComplete: false,
      trainingPlanVersion: latestPlan.version,
    });
    setShowCongratulation(false);
  };

  if (trainingState.isTrainingComplete && showCongratulation) {
    return (
      <View style={styles.container}>
        <TrainingComplete onRestart={resetTraining} />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!trainingState.selectedTraining) {
    return (
      <View style={styles.container}>
        <TrainingSelection
          onSelectTraining={initializeTraining}
          availableTrainings={Object.keys(latestPlan.trainings)}
          trainingPlanVersion={latestPlan.version}
          trainings={latestPlan.trainings}
          onShowSettings={() => setShowSettings(true)}
        />
        
        {/* Settings Modal */}
        <SettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          onClearAllHistory={handleClearAllHistory}
          currentTrainingPlanVersion={latestPlan.version}
        />
        
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExerciseFlow
        trainingState={trainingState}
        trainings={latestPlan.trainings}
        onUpdateExerciseState={updateExerciseState}
        onGoToExercise={goToExercise}
        onNextExercise={nextExercise}
        onResetTraining={resetTraining}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
