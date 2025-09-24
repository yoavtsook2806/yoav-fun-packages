import { Trainings } from '../types';
import { trainings as v36 } from './trainingPlan-v3.6';

export interface TrainingPlan {
  version: string;
  name: string;
  trainings: Trainings;
}

export const trainingPlans: TrainingPlan[] = [
  {
    version: '3.6',
    name: 'תוכנית אימונים 3.6',
    trainings: v36
  }
];

/**
 * Compare two version strings (e.g., "3.6" vs "3.7")
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
const compareVersions = (a: string, b: string): number => {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  const maxLength = Math.max(aParts.length, bParts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  
  return 0;
};

/**
 * Sort training plans by version in ascending order
 */
const getSortedTrainingPlans = (): TrainingPlan[] => {
  return [...trainingPlans].sort((a, b) => compareVersions(a.version, b.version));
};

// Get the latest training plan (highest version)
export const getLatestTrainingPlan = (): TrainingPlan => {
  const sorted = getSortedTrainingPlans();
  return sorted[sorted.length - 1];
};

// Get all training plans newer than the specified version
export const getNewerTrainingPlans = (currentVersion: string): TrainingPlan[] => {
  const sorted = getSortedTrainingPlans();
  return sorted.filter(plan => compareVersions(plan.version, currentVersion) > 0);
};

// Get the latest training plans newer than current version (for server updates)
export const getLatestTrainingUpdates = (currentVersion: string): TrainingPlan[] => {
  return getNewerTrainingPlans(currentVersion);
};

// Get a specific training plan by version
export const getTrainingPlanByVersion = (version: string): TrainingPlan | undefined => {
  return trainingPlans.find(plan => plan.version === version);
};

// Get all available training plan versions sorted
export const getAvailableVersions = (): string[] => {
  return getSortedTrainingPlans().map(plan => plan.version);
};
