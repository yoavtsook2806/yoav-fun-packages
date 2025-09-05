import { Trainings } from '../types';
import { trainings as v35 } from './trainingPlan-v3.5';
import { trainings as v36 } from './trainingPlan-v3.6';
import { trainings as v37 } from './trainingPlan-v3.7';

export interface TrainingPlan {
  version: string;
  name: string;
  trainings: Trainings;
}

export const trainingPlans: TrainingPlan[] = [
  {
    version: '3.5',
    name: 'תוכנית אימונים 3.5',
    trainings: v35
  },
  {
    version: '3.6',
    name: 'תוכנית אימונים 3.6',
    trainings: v36
  },
  {
    version: '3.7',
    name: 'תוכנית אימונים 3.7',
    trainings: v37
  }
];

// Get the latest training plan (highest version)
export const getLatestTrainingPlan = (): TrainingPlan => {
  return trainingPlans[trainingPlans.length - 1];
};

// Get a specific training plan by version
export const getTrainingPlanByVersion = (version: string): TrainingPlan | undefined => {
  return trainingPlans.find(plan => plan.version === version);
};

// Get all available training plan versions
export const getAvailableVersions = (): string[] => {
  return trainingPlans.map(plan => plan.version);
};
