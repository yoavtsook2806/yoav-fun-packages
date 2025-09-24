import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TrainingCompleteProps {
  onRestart: () => void;
  onShowSettings: () => void;
}

const TrainingComplete: React.FC<TrainingCompleteProps> = ({ onRestart, onShowSettings }) => {
  return (
    <View style={styles.container}>
      {/* Settings button - top right corner */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={onShowSettings}
      >
        <Text style={styles.settingsButtonText}>⚙️</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>כל הכבוד!</Text>
        <Text style={styles.message}>סיימת את האימון בהצלחה!</Text>
        <Text style={styles.subtitle}>זה הזמן למנוחה ולהתאוששות</Text>
        
        <TouchableOpacity style={styles.restartButton} onPress={onRestart}>
          <Text style={styles.restartButtonText}>חזור לבחירת אימון</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23', // --bg-primary
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // --bg-glass
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155', // --border-primary
  },
  emoji: {
    fontSize: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#10b981', // --success
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  message: {
    fontSize: 24,
    color: '#f8fafc', // --text-primary
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e1', // --text-secondary
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
  restartButton: {
    backgroundColor: '#10b981', // --success
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
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

export default TrainingComplete;
