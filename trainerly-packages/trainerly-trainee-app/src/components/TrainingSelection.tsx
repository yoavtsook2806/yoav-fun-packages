import React, { useState } from 'react';
import { getExerciseHistory, getDailyTrainingProgress } from '../utils/exerciseHistory';

interface TrainingSelectionProps {
  onSelectTraining: (trainingType: string) => void;
  availableTrainings: string[];
  trainings: any; // Training data to get exercise lists
  trainerName?: string;
}

const TrainingSelection: React.FC<TrainingSelectionProps> = ({
  onSelectTraining,
  availableTrainings,
  trainings,
  trainerName,
}) => {
  const [selectedTraining, setSelectedTraining] = useState<string>('');
  
  // Helper function to count training completions based on exercise history
  const getTrainingCompletionCount = (trainingType: string): number => {
    if (!trainings[trainingType]) return 0;
    
    const exerciseHistory = getExerciseHistory();
    const exerciseNames = Object.keys(trainings[trainingType]);
    
    if (exerciseNames.length === 0) return 0;
    
    // Get the minimum count across all exercises in this training
    let minCompletions = Infinity;
    
    for (const exerciseName of exerciseNames) {
      const exerciseEntries = exerciseHistory[exerciseName] || [];
      const count = exerciseEntries.length;
      minCompletions = Math.min(minCompletions, count);
    }
    
    return minCompletions === Infinity ? 0 : minCompletions;
  };
  
  // Helper function to get next recommended training based on circular sequence
  const getNextRecommendedTraining = (): string | null => {
    if (availableTrainings.length === 0) return null;
    if (availableTrainings.length === 1) return availableTrainings[0];
    
    // First check if there's a completed training TODAY
    let lastCompletedTraining: string | null = null;
    let mostRecentTrainingDate: Date | null = null;
    
    // Check today's completed trainings first
    for (const trainingType of availableTrainings) {
      if (!trainings[trainingType]) continue;
      
      const dailyProgress = getDailyTrainingProgress(trainingType);
      if (dailyProgress && Object.keys(dailyProgress.exerciseProgress).length > 0) {
        const exerciseNames = Object.keys(trainings[trainingType]);
        
        // Check if the training is fully completed today
        const isFullyCompleted = exerciseNames.every(exerciseName => {
          const exercise = trainings[trainingType][exerciseName];
          const completedSets = dailyProgress.exerciseProgress[exerciseName] || 0;
          return completedSets >= exercise.numberOfSets;
        });
        
        if (isFullyCompleted) {
          // This training was completed today - it's the most recent
          lastCompletedTraining = trainingType;
          mostRecentTrainingDate = new Date(); // Today
          break; // Today's completion takes priority
        }
      }
    }
    
    // If no training was completed today, check exercise history for past completions
    if (!lastCompletedTraining) {
      const exerciseHistory = getExerciseHistory();
      
      for (const trainingType of availableTrainings) {
        if (!trainings[trainingType]) continue;
        
        const exerciseNames = Object.keys(trainings[trainingType]);
        if (exerciseNames.length === 0) continue;
        
        // Group exercise completions by date to find complete training sessions
        const completionsByDate: { [dateStr: string]: string[] } = {};
        
        for (const exerciseName of exerciseNames) {
          const exerciseEntries = exerciseHistory[exerciseName] || [];
          
          for (const entry of exerciseEntries) {
            if (entry.completedSets >= entry.totalSets) {
              const dateStr = entry.date.split('T')[0]; // Get just the date part (YYYY-MM-DD)
              
              if (!completionsByDate[dateStr]) {
                completionsByDate[dateStr] = [];
              }
              
              if (!completionsByDate[dateStr].includes(exerciseName)) {
                completionsByDate[dateStr].push(exerciseName);
              }
            }
          }
        }
        
        // Find the most recent date where SOME exercises were completed
        for (const [dateStr, completedExercises] of Object.entries(completionsByDate)) {
          if (completedExercises.length > 0) {
            // Some exercises completed on this date - this is a partial/complete training
            const trainingDate = new Date(dateStr);
            
            if (!mostRecentTrainingDate || trainingDate > mostRecentTrainingDate) {
              mostRecentTrainingDate = trainingDate;
              lastCompletedTraining = trainingType;
            }
          }
        }
      }
    }
    
    // If we found a last completed training, get the next one in circular order
    if (lastCompletedTraining) {
      const currentIndex = availableTrainings.indexOf(lastCompletedTraining);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % availableTrainings.length;
        return availableTrainings[nextIndex];
      }
    }
    
    // Fallback: if no completed training found, recommend the first one
    return availableTrainings[0];
  };
  
  // Helper function to get current training (training with progress today but not fully completed)
  const getCurrentTraining = (): string | null => {
    for (const trainingType of availableTrainings) {
      const dailyProgress = getDailyTrainingProgress(trainingType);
      if (dailyProgress && Object.keys(dailyProgress.exerciseProgress).length > 0) {
        // Check if the training is not fully completed
        if (!trainings[trainingType]) continue;
        
        const exerciseNames = Object.keys(trainings[trainingType]);
        const isFullyCompleted = exerciseNames.every(exerciseName => {
          const exercise = trainings[trainingType][exerciseName];
          const completedSets = dailyProgress.exerciseProgress[exerciseName] || 0;
          return completedSets >= exercise.numberOfSets;
        });
        
        // Only return as current training if it's not fully completed
        if (!isFullyCompleted) {
          return trainingType;
        }
      }
    }
    return null;
  };

  const currentTraining = getCurrentTraining();
  // Always show the next recommended training - current only shows if it's incomplete
  const nextRecommended = getNextRecommendedTraining();

  const handleStartTraining = () => {
    if (selectedTraining) {
      onSelectTraining(selectedTraining);
    }
  };

  const getWelcomeTitle = () => {
    if (trainerName) {
      const firstName = trainerName.split(' ')[0];
      return `${firstName}, בואו נתחיל להתאמן! 💪`;
    }
    return 'בואו נתחיל להתאמן! 💪';
  };

  return (
    <div className="training-selection">
      {/* Trainerly Logo */}
      <div className="logo-section">
        <div className="logo-container">
          <img 
            src="/trainerly-logo.svg" 
            alt="Trainerly" 
            className="trainerly-logo"
          />
          <h1 className="app-title">Trainerly</h1>
          <p className="app-subtitle">אפליקציית המתאמנים</p>
        </div>
      </div>
      
      <h1>{getWelcomeTitle()}</h1>
      
      <div className="training-buttons">
        {availableTrainings.map((training) => {
          const completionCount = getTrainingCompletionCount(training);
          const isRecommended = training === nextRecommended;
          const isCurrent = training === currentTraining;
          
          return (
            <button
              key={training}
              className={`training-button ${selectedTraining === training ? 'selected' : ''} ${isRecommended ? 'recommended' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => setSelectedTraining(training)}
            >
              <div className="training-button-content">
                <span className="training-name">אימון {training}</span>
                <div className="training-indicators">
                  <span className="completion-count">{completionCount}×</span>
                  {isCurrent ? (
                    <span className="current-indicator">נוכחי</span>
                  ) : isRecommended ? (
                    <span className="next-indicator">הבא</span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        className="green-button"
        onClick={handleStartTraining}
        disabled={!selectedTraining}
        style={{ padding: '15px 30px', fontSize: '18px', marginTop: '20px' }}
      >
        התחל אימון
      </button>
    </div>
  );
};

export default TrainingSelection;
