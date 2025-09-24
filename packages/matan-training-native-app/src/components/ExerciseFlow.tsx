import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { TrainingState, ExerciseState, Trainings } from '../types';
import { styles } from '../styles/ExerciseFlowStyles';

interface ExerciseFlowProps {
  trainingState: TrainingState;
  trainings: Trainings;
  onUpdateExerciseState: (exerciseName: string, updates: Partial<ExerciseState>) => void;
  onGoToExercise: (exerciseIndex: number) => void;
  onNextExercise: () => void;
  onResetTraining: () => void;
}

const ExerciseFlow: React.FC<ExerciseFlowProps> = ({
  trainingState,
  trainings,
  onUpdateExerciseState,
  onGoToExercise,
  onNextExercise,
  onResetTraining,
}) => {
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  const currentExerciseName = trainingState.exercises[trainingState.currentExerciseIndex];
  const currentExercise = trainings[trainingState.selectedTraining!][currentExerciseName];
  const currentExerciseState = trainingState.exerciseStates[currentExerciseName];

  // Timer effect
  useEffect(() => {
    if (currentExerciseState?.isResting && currentExerciseState.startTimestamp && currentExerciseState.restDuration) {
      const id = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - currentExerciseState.startTimestamp!) / 1000);
        const newTimeLeft = Math.max(0, currentExerciseState.restDuration! - elapsed);
        
        onUpdateExerciseState(currentExerciseName, {
          timeLeft: newTimeLeft,
        });
      }, 1000);
      setTimerId(id);

      return () => {
        clearInterval(id);
        setTimerId(null);
      };
    } else if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  }, [currentExerciseState?.isResting, currentExerciseState?.startTimestamp, currentExerciseState?.restDuration, currentExerciseName, onUpdateExerciseState]);

  // Auto-enable finish set button when timer finishes
  useEffect(() => {
    if (currentExerciseState?.isResting && currentExerciseState.timeLeft === 0) {
      onUpdateExerciseState(currentExerciseName, {
        isResting: false,
        startTimestamp: undefined,
        restDuration: undefined,
      });
    }
  }, [currentExerciseState?.timeLeft, currentExerciseState?.isResting, currentExerciseName, onUpdateExerciseState]);

  const startExercise = () => {
    onUpdateExerciseState(currentExerciseName, {
      isActive: true,
    });
  };

  const finishSet = () => {
    const newSetCount = currentExerciseState.currentSet + 1;
    const isExerciseComplete = newSetCount >= currentExercise.numberOfSets;

    // Capture current set data
    const currentSetData = {
      weight: currentExerciseState.weight && currentExerciseState.weight > 0 ? currentExerciseState.weight : undefined,
      repeats: currentExerciseState.repeats && currentExerciseState.repeats > 0 ? currentExerciseState.repeats : undefined,
    };

    const updatedSetsData = [...(currentExerciseState.setsData || []), currentSetData];

    if (isExerciseComplete) {
      onUpdateExerciseState(currentExerciseName, {
        currentSet: newSetCount,
        completed: true,
        isActive: false,
        isResting: false,
        setsData: updatedSetsData,
      });
    } else {
      const restTime = currentExerciseState.customRestTime || trainingState.restTime;
      const now = Date.now();
      onUpdateExerciseState(currentExerciseName, {
        currentSet: newSetCount,
        isResting: true,
        timeLeft: restTime,
        startTimestamp: now,
        restDuration: restTime,
        setsData: updatedSetsData,
      });
    }
  };

  const updateWeight = (value: string) => {
    const newWeight = parseFloat(value) || 0;
    onUpdateExerciseState(currentExerciseName, {
      weight: newWeight,
    });
  };

  const updateRepeats = (value: string) => {
    const newRepeats = parseInt(value) || 0;
    onUpdateExerciseState(currentExerciseName, {
      repeats: newRepeats,
    });
  };

  const updateCustomRestTime = (value: string) => {
    const newRestTime = parseInt(value) || 0;
    onUpdateExerciseState(currentExerciseName, {
      customRestTime: newRestTime,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentExerciseName) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>טוען...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Training Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onResetTraining}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.trainingTitle}>{trainingState.selectedTraining} אימון</Text>
      </View>

      {/* All Exercises Row */}
      <ScrollView horizontal style={styles.exerciseRow} showsHorizontalScrollIndicator={false}>
        {trainingState.exercises.map((exerciseName, index) => {
          const exerciseState = trainingState.exerciseStates[exerciseName];
          const exercise = trainings[trainingState.selectedTraining!][exerciseName];
          
          let buttonStyle = [styles.exerciseRowItem];
          if (exerciseState.completed) {
            buttonStyle.push(styles.exerciseRowItemCompleted);
          } else if (index === trainingState.currentExerciseIndex) {
            buttonStyle.push(styles.exerciseRowItemCurrent);
          }

          return (
            <TouchableOpacity
              key={exerciseName}
              style={buttonStyle}
              onPress={() => onGoToExercise(index)}
            >
              <Text style={styles.exerciseRowNumber}>{index + 1}</Text>
              <Text style={styles.exerciseRowName}>{exercise.short}</Text>
              <Text style={styles.exerciseRowSets}>
                {exerciseState.currentSet}/{exercise.numberOfSets}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Exercise Title */}
      <View style={styles.exerciseTitleSection}>
        <Text style={styles.exerciseTitle}>{currentExerciseName}</Text>
      </View>

      {/* Exercise Controls */}
      <View style={styles.controlsSection}>
        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => console.log('History pressed')}
          >
            <Text style={styles.actionButtonText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => console.log('Last Training pressed')}
          >
            <Text style={styles.actionButtonText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => console.log('Info pressed')}
          >
            <Text style={styles.actionButtonText}>ℹ️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              styles.finishButton,
              currentExerciseState.completed && styles.finishButtonDisabled
            ]}
            onPress={() => console.log('Finish Exercise pressed')}
            disabled={currentExerciseState.completed}
          >
            <Text style={styles.actionButtonText}>⏹️</Text>
          </TouchableOpacity>
        </View>
        
        {/* Inputs Row */}
        <View style={styles.inputsRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>מנוחה</Text>
            <TextInput
              style={styles.input}
              value={currentExerciseState?.customRestTime?.toString() || ''}
              onChangeText={updateCustomRestTime}
              placeholder={trainingState.restTime.toString()}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>משקל</Text>
            <TextInput
              style={styles.input}
              value={currentExerciseState?.weight?.toString() || ''}
              onChangeText={updateWeight}
              placeholder="משקל"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>חזרות</Text>
            <TextInput
              style={styles.input}
              value={currentExerciseState?.repeats?.toString() || ''}
              onChangeText={updateRepeats}
              placeholder="חזרות"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Timer */}
      {currentExerciseState.isResting && (
        <View style={styles.timerSection}>
          <Text style={[
            styles.timer,
            currentExerciseState.timeLeft === 0 ? styles.timerFinished :
            currentExerciseState.timeLeft <= 5 && currentExerciseState.timeLeft > 0 ? styles.timerUrgent : {}
          ]}>
            {currentExerciseState.timeLeft === 0 ? 'זמן!' : formatTime(currentExerciseState.timeLeft)}
          </Text>
        </View>
      )}

      {/* Main Action Area */}
      <View style={styles.actionSection}>
        {!currentExerciseState.isActive && !currentExerciseState.completed && (
          <TouchableOpacity style={styles.startButton} onPress={startExercise}>
            <Text style={styles.startButtonText}>התחל תרגיל</Text>
          </TouchableOpacity>
        )}

        {currentExerciseState.isActive && !currentExerciseState.completed && 
         !(currentExerciseState.isResting && currentExerciseState.timeLeft > 0) && (
          <TouchableOpacity style={styles.finishSetButton} onPress={finishSet}>
            <Text style={styles.finishSetButtonText}>סיים סט</Text>
          </TouchableOpacity>
        )}

        {currentExerciseState.completed && (
          <View style={styles.completedSection}>
            <Text style={styles.completedText}>✅ תרגיל הושלם!</Text>
            <TouchableOpacity style={styles.nextButton} onPress={onNextExercise}>
              <Text style={styles.nextButtonText}>המשך לתרגיל הבא</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>
          {currentExerciseState.isResting ? 
            `סיימת ${currentExerciseState.currentSet} מתוך ${currentExercise.numberOfSets} סטים` :
            currentExerciseState.isActive ? 
              `סט מספר ${currentExerciseState.currentSet + 1}` :
              `${currentExerciseState.currentSet}/${currentExercise.numberOfSets} סטים`
          }
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentExerciseState.currentSet / currentExercise.numberOfSets) * 100}%` }
            ]}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default ExerciseFlow;
