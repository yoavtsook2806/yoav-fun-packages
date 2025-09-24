import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface TrainingSelectionProps {
  onSelectTraining: (trainingType: string) => void;
  availableTrainings: string[];
  trainingPlanVersion: string;
  trainings: any;
  onShowSettings: () => void;
}

const TrainingSelection: React.FC<TrainingSelectionProps> = ({
  onSelectTraining,
  availableTrainings,
  trainingPlanVersion,
  trainings,
  onShowSettings,
}) => {
  const [selectedTraining, setSelectedTraining] = useState<string>('');

  const handleTrainingSelect = (trainingType: string) => {
    setSelectedTraining(trainingType);
  };

  const handleStartTraining = () => {
    if (selectedTraining) {
      onSelectTraining(selectedTraining);
    }
  };

  return (
    <View style={styles.container}>
      {/* Settings button - top right corner */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={onShowSettings}
      >
        <Text style={styles.settingsButtonText}>⚙️</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>בחר אימון</Text>
        <Text style={styles.versionText}>גרסה {trainingPlanVersion}</Text>

        <View style={styles.trainingList}>
          {availableTrainings.map((trainingType) => (
            <TouchableOpacity
              key={trainingType}
              style={[
                styles.trainingOption,
                selectedTraining === trainingType && styles.trainingOptionSelected,
              ]}
              onPress={() => handleTrainingSelect(trainingType)}
            >
              <Text style={[
                styles.trainingName,
                selectedTraining === trainingType && styles.trainingNameSelected
              ]}>
                אימון {trainingType}
              </Text>
              <Text style={styles.exerciseCount}>
                {Object.keys(trainings[trainingType] || {}).length} תרגילים
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTraining && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTraining}
          >
            <Text style={styles.startButtonText}>
              התחל אימון {selectedTraining}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  versionText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  trainingList: {
    marginBottom: 30,
  },
  trainingOption: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trainingOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#f3f8ff',
  },
  trainingName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  trainingNameSelected: {
    color: '#2196F3',
  },
  exerciseCount: {
    fontSize: 14,
    color: '#999',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    marginBottom: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  settingsButtonText: {
    fontSize: 20,
  },
});

export default TrainingSelection;
