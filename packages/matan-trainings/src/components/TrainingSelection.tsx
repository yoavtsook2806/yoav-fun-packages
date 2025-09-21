import React, { useState } from 'react';
import { getExerciseHistory } from '../utils/exerciseHistory';

interface TrainingSelectionProps {
  onSelectTraining: (trainingType: string) => void;
  availableTrainings: string[];
  trainingPlanVersion: string;
  trainings: any; // Training data to get exercise lists
}

const TrainingSelection: React.FC<TrainingSelectionProps> = ({
  onSelectTraining,
  availableTrainings,
  trainingPlanVersion,
  trainings,
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
    
    // Get exercise history to find the last completed training
    const exerciseHistory = getExerciseHistory();
    
    // Find the most recent COMPLETE training (all exercises completed)
    let lastCompletedTraining: string | null = null;
    let mostRecentTrainingDate: Date | null = null;
    
    for (const trainingType of availableTrainings) {
      if (!trainings[trainingType]) continue;
      
      const exerciseNames = Object.keys(trainings[trainingType]);
      if (exerciseNames.length === 0) continue;
      
      // Find completion dates for all exercises in this training
      const exerciseCompletionDates: Date[] = [];
      
      for (const exerciseName of exerciseNames) {
        const exerciseEntries = exerciseHistory[exerciseName] || [];
        
        // Find the most recent completion for this exercise
        let latestCompletion: Date | null = null;
        
        for (const entry of exerciseEntries) {
          if (entry.completedSets >= entry.totalSets) {
            const entryDate = new Date(entry.date);
            if (!latestCompletion || entryDate > latestCompletion) {
              latestCompletion = entryDate;
            }
          }
        }
        
        if (latestCompletion) {
          exerciseCompletionDates.push(latestCompletion);
        }
      }
      
      // Training is only completed if ALL exercises have been completed
      if (exerciseCompletionDates.length === exerciseNames.length) {
        // The training completion date is the latest date among all exercises
        // (when the last exercise of the training was completed)
        const trainingCompletionDate = new Date(Math.max(...exerciseCompletionDates.map(d => d.getTime())));
        
        if (!mostRecentTrainingDate || trainingCompletionDate > mostRecentTrainingDate) {
          mostRecentTrainingDate = trainingCompletionDate;
          lastCompletedTraining = trainingType;
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
  
  const nextRecommended = getNextRecommendedTraining();

  const handleStartTraining = () => {
    if (selectedTraining) {
      onSelectTraining(selectedTraining);
    }
  };

  return (
    <div className="training-selection">
      <h1>קדי לא פראייר</h1>
      <div className="training-plan-version">{trainingPlanVersion}</div>
      
      <div className="training-buttons">
        {availableTrainings.map((training) => {
          const completionCount = getTrainingCompletionCount(training);
          const isRecommended = training === nextRecommended;
          
          return (
            <button
              key={training}
              className={`training-button ${selectedTraining === training ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
              onClick={() => setSelectedTraining(training)}
            >
              <div className="training-button-content">
                <span className="training-name">אימון {training}</span>
                <div className="training-indicators">
                  <span className="completion-count">{completionCount}×</span>
                  {isRecommended && <span className="next-indicator">הבא</span>}
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
