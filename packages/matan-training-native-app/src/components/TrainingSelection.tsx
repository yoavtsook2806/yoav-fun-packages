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
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
    backgroundColor: '#0f0f23', // --bg-primary from PWA
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 120,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    color: '#f8fafc', // --text-primary
    letterSpacing: -0.5,
    textShadowColor: 'rgba(99, 102, 241, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  versionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#94a3b8', // --text-muted
    marginBottom: 48,
    fontWeight: '500',
  },
  trainingList: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  trainingOption: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // --bg-glass
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155', // --border-primary
  },
  trainingOptionSelected: {
    borderColor: '#6366f1', // --primary
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 12,
  },
  trainingName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc', // --text-primary
    marginBottom: 8,
    textAlign: 'center',
  },
  trainingNameSelected: {
    color: '#818cf8', // --primary-light
  },
  exerciseCount: {
    fontSize: 16,
    color: '#cbd5e1', // --text-secondary
    textAlign: 'center',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#10b981', // --success
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsButtonText: {
    fontSize: 20,
  },
});

export default TrainingSelection;
