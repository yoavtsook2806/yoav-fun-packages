const TRAINING_COMPLETION_KEY = 'matan-trainings-completions';

interface TrainingCompletion {
  trainingType: string;
  date: string;
  completedExercises: string[];
}

interface TrainingCompletionStorage {
  [trainingType: string]: TrainingCompletion[];
}

export const getTrainingCompletions = (): TrainingCompletionStorage => {
  try {
    const stored = localStorage.getItem(TRAINING_COMPLETION_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading training completions:', error);
    return {};
  }
};

export const saveTrainingCompletion = (
  trainingType: string,
  completedExercises: string[]
): void => {
  try {
    const completions = getTrainingCompletions();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!completions[trainingType]) {
      completions[trainingType] = [];
    }
    
    // Add new completion
    const newCompletion: TrainingCompletion = {
      trainingType,
      date: today,
      completedExercises
    };
    
    // Add at the beginning (most recent first)
    completions[trainingType].unshift(newCompletion);
    
    // Keep only the last 100 completions per training type
    if (completions[trainingType].length > 100) {
      completions[trainingType] = completions[trainingType].slice(0, 100);
    }
    
    localStorage.setItem(TRAINING_COMPLETION_KEY, JSON.stringify(completions));
  } catch (error) {
    console.error('Error saving training completion:', error);
  }
};

export const getTrainingCompletionCount = (trainingType: string): number => {
  const completions = getTrainingCompletions();
  return completions[trainingType]?.length || 0;
};

export const getLastTrainingCompletion = (trainingType: string): TrainingCompletion | null => {
  const completions = getTrainingCompletions();
  const trainingCompletions = completions[trainingType];
  
  return trainingCompletions && trainingCompletions.length > 0 ? trainingCompletions[0] : null;
};

export const getNextRecommendedTraining = (availableTrainings: string[]): string | null => {
  if (availableTrainings.length === 0) return null;
  if (availableTrainings.length === 1) return availableTrainings[0];
  
  const completions = getTrainingCompletions();
  
  // Find the training with the least completions
  let minCompletions = Infinity;
  let recommendedTraining = availableTrainings[0];
  
  for (const training of availableTrainings) {
    const count = completions[training]?.length || 0;
    if (count < minCompletions) {
      minCompletions = count;
      recommendedTraining = training;
    }
  }
  
  // If all trainings have the same count, recommend based on last completion date
  const sameCount = availableTrainings.every(training => 
    (completions[training]?.length || 0) === minCompletions
  );
  
  if (sameCount && minCompletions > 0) {
    // Find the training that was completed longest ago
    let oldestDate = new Date().toISOString();
    let oldestTraining = availableTrainings[0];
    
    for (const training of availableTrainings) {
      const lastCompletion = getLastTrainingCompletion(training);
      if (lastCompletion && lastCompletion.date < oldestDate) {
        oldestDate = lastCompletion.date;
        oldestTraining = training;
      }
    }
    
    return oldestTraining;
  }
  
  return recommendedTraining;
};

export const clearTrainingCompletions = (): void => {
  try {
    localStorage.removeItem(TRAINING_COMPLETION_KEY);
  } catch (error) {
    console.error('Error clearing training completions:', error);
  }
};
