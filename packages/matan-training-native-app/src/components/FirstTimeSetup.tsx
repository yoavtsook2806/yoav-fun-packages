import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { Trainings } from '../types';
import { styles } from '../styles/FirstTimeSetupStyles';

interface FirstTimeSetupProps {
  trainingType: string;
  exercises: string[];
  trainings: Trainings;
  onComplete: (exerciseDefaults: { [exerciseName: string]: { weight?: number; repeats?: number; timeToRest?: number } }) => void;
  onCancel: () => void;
}

interface ExerciseDefaults {
  weight?: number;
  repeats?: number;
  timeToRest?: number;
}

const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({
  trainingType,
  exercises,
  trainings,
  onComplete,
  onCancel,
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseDefaults, setExerciseDefaults] = useState<{ [exerciseName: string]: ExerciseDefaults }>({});

  const currentExerciseName = exercises[currentExerciseIndex];
  const currentExercise = trainings[trainingType][currentExerciseName];
  const currentDefaults = exerciseDefaults[currentExerciseName] || {};

  const isLastExercise = currentExerciseIndex === exercises.length - 1;
  const hasFilledAnyField = currentDefaults.weight !== undefined ||
                           currentDefaults.repeats !== undefined ||
                           currentDefaults.timeToRest !== undefined;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateExerciseDefault = (field: keyof ExerciseDefaults, value: string) => {
    const numValue = parseFloat(value) || undefined;
    setExerciseDefaults(prev => ({
      ...prev,
      [currentExerciseName]: {
        ...prev[currentExerciseName],
        [field]: numValue && numValue > 0 ? numValue : undefined,
      },
    }));
  };

  const handleNext = () => {
    if (isLastExercise) {
      onComplete(exerciseDefaults);
    } else {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>הגדרה ראשונה</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            תרגיל {currentExerciseIndex + 1} מתוך {exercises.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }
              ]}
            />
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.exerciseSection}>
            <Text style={styles.exerciseName}>{currentExerciseName}</Text>
            <Text style={styles.exerciseInfo}>
              {currentExercise.numberOfSets} סטים • {currentExercise.minimumNumberOfRepeasts}-{currentExercise.maximumNumberOfRepeasts} חזרות
            </Text>
            <Text style={styles.exerciseRestTime}>
              מנוחה: {formatTime(currentExercise.minimumTimeToRest)} - {formatTime(currentExercise.maximumTimeToRest)}
            </Text>
          </View>

          <View style={styles.inputsSection}>
            <Text style={styles.sectionTitle}>הגדר ערכי ברירת מחדל (אופציונלי)</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>משקל (ק"ג)</Text>
              <TextInput
                style={styles.input}
                value={currentDefaults.weight?.toString() || ''}
                onChangeText={(value) => updateExerciseDefault('weight', value)}
                placeholder="לדוגמה: 20"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>חזרות</Text>
              <TextInput
                style={styles.input}
                value={currentDefaults.repeats?.toString() || ''}
                onChangeText={(value) => updateExerciseDefault('repeats', value)}
                placeholder={`${currentExercise.minimumNumberOfRepeasts}-${currentExercise.maximumNumberOfRepeasts}`}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>זמן מנוחה (שניות)</Text>
              <TextInput
                style={styles.input}
                value={currentDefaults.timeToRest?.toString() || ''}
                onChangeText={(value) => updateExerciseDefault('timeToRest', value)}
                placeholder={`${currentExercise.minimumTimeToRest}-${currentExercise.maximumTimeToRest}`}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            {currentExerciseIndex > 0 && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handlePrevious}>
                <Text style={styles.secondaryButtonText}>← הקודם</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>
                {isLastExercise ? 'סיום' : 'הבא →'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.skipButton} onPress={() => onComplete({})}>
            <Text style={styles.skipButtonText}>דלג על ההגדרה</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default FirstTimeSetup;
