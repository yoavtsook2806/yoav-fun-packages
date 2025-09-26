/**
 * Trainerly Server Test Kit
 * Provides mock data and utilities for testing both server and client applications
 */

import { Coach, Exercise, TrainingPlan, Trainer, ExerciseSession } from '../types';

// Mock Data
export const mockCoaches: Coach[] = [
  {
    coachId: 'coach-001',
    name: 'אבי כהן',
    email: 'avi@example.com',
    nickname: 'avi_coach',
    passwordHash: 'hashed_password_1',
    valid: true,
    phone: '0501234567',
    age: 35,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    coachId: 'coach-002', 
    name: 'שרה לוי',
    email: 'sarah@example.com',
    nickname: 'sarah_trainer',
    passwordHash: 'hashed_password_2',
    valid: true,
    phone: '0507654321',
    age: 29,
    createdAt: '2024-02-20T14:30:00Z',
    updatedAt: '2024-02-20T14:30:00Z'
  }
];

export const mockExercises: Exercise[] = [
  {
    exerciseId: 'exercise-001',
    coachId: 'coach-001',
    name: 'סקוואט',
    note: 'כיפוף ברכיים עם משקל גוף - שמור על הגב ישר',
    link: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
    muscleGroup: 'ירך קדמי',
    createdAt: '2024-03-01T09:00:00Z'
  },
  {
    exerciseId: 'exercise-002',
    coachId: 'coach-001',
    name: 'שכיבות סמיכה',
    note: 'דחיפת פלג גוף עליון - שמור על גוף ישר',
    link: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    muscleGroup: 'חזה אמצעי',
    createdAt: '2024-03-02T11:15:00Z'
  },
  {
    exerciseId: 'exercise-003',
    coachId: 'coach-001',
    name: 'פלאנק',
    note: 'החזקת מנח לחיזוק הליבה - נשום באופן קבוע',
    link: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    muscleGroup: 'ליבה',
    createdAt: '2024-03-03T16:45:00Z'
  }
];

export const mockTrainingPlans: TrainingPlan[] = [
  {
    planId: 'plan-001',
    coachId: 'coach-001',
    name: 'תוכנית למתחילים',
    description: 'תוכנית בסיסית למתחילים בספורט',
    trainings: [
      {
        trainingId: 'training-A',
        name: 'אימון A',
        order: 1,
        exercises: [
          {
            exerciseName: 'סקוואט',
            numberOfSets: 3,
            minimumNumberOfRepeasts: 8,
            maximumNumberOfRepeasts: 12,
            minimumTimeToRest: 60,
            maximumTimeToRest: 90
          },
          {
            exerciseName: 'שכיבות סמיכה',
            numberOfSets: 3,
            minimumNumberOfRepeasts: 5,
            maximumNumberOfRepeasts: 10,
            minimumTimeToRest: 45,
            maximumTimeToRest: 75
          }
        ]
      }
    ],
    createdAt: '2024-03-10T12:00:00Z',
    updatedAt: '2024-03-10T12:00:00Z'
  },
  {
    planId: 'plan-002',
    coachId: 'coach-001',
    name: 'תוכנית מתקדמים',
    description: 'תוכנית מאתגרת למתאמנים מנוסים',
    trainings: [
      {
        trainingId: 'training-A',
        name: 'אימון A',
        order: 1,
        exercises: [
          {
            exerciseName: 'סקוואט',
            numberOfSets: 4,
            minimumNumberOfRepeasts: 12,
            maximumNumberOfRepeasts: 18,
            minimumTimeToRest: 90,
            maximumTimeToRest: 120
          }
        ]
      }
    ],
    createdAt: '2024-03-15T14:20:00Z',
    updatedAt: '2024-03-15T14:20:00Z'
  }
];

export const mockTrainers: Trainer[] = [
  {
    trainerId: 'trainee-001',
    coachId: 'coach-001',
    nickname: 'דני123',
    email: 'danny@example.com',
    plans: ['plan-001'],
    createdAt: '2024-03-20T08:30:00Z'
  },
  {
    trainerId: 'trainee-002',
    coachId: 'coach-001',
    nickname: 'מיכל456',
    email: 'michal@example.com',
    plans: ['plan-001', 'plan-002'],
    createdAt: '2024-03-22T10:15:00Z'
  },
  {
    trainerId: 'trainee-003',
    coachId: 'coach-001',
    nickname: 'רון789',
    email: 'ron@example.com',
    plans: ['plan-002'],
    createdAt: '2024-03-25T13:45:00Z'
  }
];

export const mockExerciseSessions: ExerciseSession[] = [
  {
    sessionId: 'session-001',
    trainerId: 'trainee-001',
    coachId: 'coach-001',
    exerciseName: 'סקוואט',
    trainingType: 'A',
    completedAt: '2024-03-26T09:00:00Z',
    totalSets: 3,
    completedSets: 3,
    setsData: [
      { weight: 60, repeats: 10 },
      { weight: 60, repeats: 9 },
      { weight: 60, repeats: 8 }
    ],
    restTime: 75,
    createdAt: '2024-03-26T09:15:00Z'
  },
  {
    sessionId: 'session-002',
    trainerId: 'trainee-001',
    coachId: 'coach-001',
    exerciseName: 'שכיבות סמיכה',
    trainingType: 'A',
    completedAt: '2024-03-26T09:20:00Z',
    totalSets: 3,
    completedSets: 2,
    setsData: [
      { repeats: 8 },
      { repeats: 7 }
    ],
    restTime: 60,
    createdAt: '2024-03-26T09:30:00Z'
  },
  {
    sessionId: 'session-003',
    trainerId: 'trainee-002',
    coachId: 'coach-001',
    exerciseName: 'פלאנק',
    trainingType: 'B',
    completedAt: '2024-03-27T14:00:00Z',
    totalSets: 3,
    completedSets: 3,
    setsData: [
      { repeats: 45 },
      { repeats: 40 },
      { repeats: 35 }
    ],
    restTime: 90,
    createdAt: '2024-03-27T14:10:00Z'
  },
  {
    sessionId: 'session-004',
    trainerId: 'trainee-001',
    coachId: 'coach-001',
    exerciseName: 'סקוואט',
    trainingType: 'A',
    completedAt: '2024-03-28T10:30:00Z',
    totalSets: 3,
    completedSets: 3,
    setsData: [
      { weight: 65, repeats: 10 },
      { weight: 65, repeats: 10 },
      { weight: 65, repeats: 9 }
    ],
    restTime: 80,
    createdAt: '2024-03-28T10:45:00Z'
  },
  {
    sessionId: 'session-005',
    trainerId: 'trainee-003',
    coachId: 'coach-001',
    exerciseName: 'שכיבות סמיכה',
    trainingType: 'A',
    completedAt: '2024-03-29T16:15:00Z',
    totalSets: 4,
    completedSets: 4,
    setsData: [
      { repeats: 18 },
      { repeats: 16 },
      { repeats: 15 },
      { repeats: 14 }
    ],
    restTime: 70,
    createdAt: '2024-03-29T16:30:00Z'
  }
];

// Utility functions for testing
export const getCoachById = (coachId: string): Coach | undefined => {
  return mockCoaches.find(coach => coach.coachId === coachId);
};

export const getExercisesByCoachId = (coachId: string): Exercise[] => {
  return mockExercises.filter(exercise => exercise.coachId === coachId);
};

export const getTrainingPlansByCoachId = (coachId: string): TrainingPlan[] => {
  return mockTrainingPlans.filter(plan => plan.coachId === coachId);
};

export const getTrainersByCoachId = (coachId: string): Trainer[] => {
  return mockTrainers.filter(trainer => trainer.coachId === coachId);
};

export const getExerciseSessionsByTrainerId = (trainerId: string, limit?: number): ExerciseSession[] => {
  const sessions = mockExerciseSessions
    .filter(session => session.trainerId === trainerId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  
  return limit ? sessions.slice(0, limit) : sessions;
};

export const getExerciseSessionsByCoachId = (coachId: string, limit?: number): ExerciseSession[] => {
  const sessions = mockExerciseSessions
    .filter(session => session.coachId === coachId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  
  return limit ? sessions.slice(0, limit) : sessions;
};

// Mock API Response generators
export const createMockApiResponse = <T>(data: T, success: boolean = true) => {
  if (success) {
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } else {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Mock error' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};

export const createMockListResponse = <T>(items: T[]) => {
  return createMockApiResponse({ items });
};

// Test scenarios
export const testScenarios = {
  // Coach with full data
  fullCoachScenario: {
    coach: mockCoaches[0],
    exercises: getExercisesByCoachId('coach-001'),
    trainingPlans: getTrainingPlansByCoachId('coach-001'),
    trainers: getTrainersByCoachId('coach-001'),
    sessions: getExerciseSessionsByCoachId('coach-001')
  },
  
  // Empty coach scenario
  emptyCoachScenario: {
    coach: mockCoaches[1],
    exercises: [],
    trainingPlans: [],
    trainers: [],
    sessions: []
  },
  
  // Trainer with progress
  trainerWithProgressScenario: {
    trainer: mockTrainers[0],
    sessions: getExerciseSessionsByTrainerId('trainee-001')
  },

  // Trainer without progress
  trainerWithoutProgressScenario: {
    trainer: mockTrainers[2],
    sessions: []
  }
};

// Export all mock data as default
export default {
  coaches: mockCoaches,
  exercises: mockExercises,
  trainingPlans: mockTrainingPlans,
  trainers: mockTrainers,
  exerciseSessions: mockExerciseSessions,
  utils: {
    getCoachById,
    getExercisesByCoachId,
    getTrainingPlansByCoachId,
    getTrainersByCoachId,
    getExerciseSessionsByTrainerId,
    getExerciseSessionsByCoachId,
    createMockApiResponse,
    createMockListResponse
  },
  scenarios: testScenarios
};
