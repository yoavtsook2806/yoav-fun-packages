/**
 * Trainerly Server Test Kit
 * Provides mock data and utilities for testing both server and client applications
 */

import { Coach, Exercise, TrainingPlan, Trainee, ExerciseSession } from '../types';

// Mock Data
export const mockCoaches: Coach[] = [
  {
    coachId: 'coach-001',
    name: 'אבי כהן',
    nickname: 'avi_coach',
    phone: '0501234567',
    age: 35,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    coachId: 'coach-002', 
    name: 'שרה לוי',
    nickname: 'sarah_trainer',
    phone: '0507654321',
    age: 29,
    createdAt: '2024-02-20T14:30:00Z'
  }
];

export const mockExercises: Exercise[] = [
  {
    exerciseId: 'exercise-001',
    coachId: 'coach-001',
    name: 'סקוואט',
    description: 'כיפוף ברכיים עם משקל גוף',
    videoUrl: 'https://example.com/squat-video.mp4',
    imageUrl: 'https://example.com/squat-image.jpg',
    muscleGroups: ['רגליים', 'ישבן'],
    equipment: ['משקל גוף'],
    difficulty: 'בינוני',
    instructions: ['עמוד עם רגליים ברוחב כתפיים', 'רד לכיוון הרצפה', 'עלה חזרה למעלה'],
    tips: ['שמור על הגב ישר', 'אל תיתן לברכיים ליפול פנימה'],
    minimumNumberOfRepeasts: 8,
    maximumNumberOfRepeasts: 15,
    minimumTimeToRest: 60,
    maximumTimeToRest: 120,
    numberOfSets: 3,
    createdAt: '2024-03-01T09:00:00Z'
  },
  {
    exerciseId: 'exercise-002',
    coachId: 'coach-001',
    name: 'שכיבות סמיכה',
    description: 'חיזוק שרירי החזה והזרועות',
    videoUrl: 'https://example.com/pushup-video.mp4',
    imageUrl: 'https://example.com/pushup-image.jpg',
    muscleGroups: ['חזה', 'זרועות', 'כתפיים'],
    equipment: ['משקל גוף'],
    difficulty: 'קל',
    instructions: ['שכב על הבטן', 'הרם את הגוף עם הזרועות', 'רד בשליטה'],
    tips: ['שמור על קו ישר מהראש לעקבים', 'נשום נכון'],
    minimumNumberOfRepeasts: 5,
    maximumNumberOfRepeasts: 20,
    minimumTimeToRest: 45,
    maximumTimeToRest: 90,
    numberOfSets: 3,
    createdAt: '2024-03-02T11:15:00Z'
  },
  {
    exerciseId: 'exercise-003',
    coachId: 'coach-001',
    name: 'פלאנק',
    description: 'חיזוק שרירי הליבה',
    videoUrl: 'https://example.com/plank-video.mp4',
    imageUrl: 'https://example.com/plank-image.jpg',
    muscleGroups: ['ליבה', 'כתפיים'],
    equipment: ['משקל גוף'],
    difficulty: 'בינוני',
    instructions: ['שכב על הבטן', 'הרם את הגוף על המרפקים', 'החזק את המצב'],
    tips: ['אל תיתן לירכיים ליפול', 'שמור על נשימה קבועה'],
    minimumNumberOfRepeasts: 30,
    maximumNumberOfRepeasts: 120,
    minimumTimeToRest: 60,
    maximumTimeToRest: 90,
    numberOfSets: 3,
    createdAt: '2024-03-03T16:45:00Z'
  }
];

export const mockTrainingPlans: TrainingPlan[] = [
  {
    planId: 'plan-001',
    coachId: 'coach-001',
    name: 'תוכנית למתחילים',
    description: 'תוכנית בסיסית למתחילים בספורט',
    trainings: {
      'A': {
        'סקוואט': {
          exerciseId: 'exercise-001',
          numberOfSets: 3,
          minimumNumberOfRepeasts: 8,
          maximumNumberOfRepeasts: 12,
          minimumTimeToRest: 60,
          maximumTimeToRest: 90
        },
        'שכיבות סמיכה': {
          exerciseId: 'exercise-002',
          numberOfSets: 3,
          minimumNumberOfRepeasts: 5,
          maximumNumberOfRepeasts: 10,
          minimumTimeToRest: 45,
          maximumTimeToRest: 75
        }
      },
      'B': {
        'פלאנק': {
          exerciseId: 'exercise-003',
          numberOfSets: 3,
          minimumNumberOfRepeasts: 30,
          maximumNumberOfRepeasts: 60,
          minimumTimeToRest: 60,
          maximumTimeToRest: 90
        }
      }
    },
    isAdminPlan: false,
    createdAt: '2024-03-10T12:00:00Z'
  },
  {
    planId: 'plan-002',
    coachId: 'coach-001',
    name: 'תוכנית מתקדמים',
    description: 'תוכנית מאתגרת למתאמנים מנוסים',
    trainings: {
      'A': {
        'סקוואט': {
          exerciseId: 'exercise-001',
          numberOfSets: 4,
          minimumNumberOfRepeasts: 12,
          maximumNumberOfRepeasts: 18,
          minimumTimeToRest: 90,
          maximumTimeToRest: 120
        },
        'שכיבות סמיכה': {
          exerciseId: 'exercise-002',
          numberOfSets: 4,
          minimumNumberOfRepeasts: 15,
          maximumNumberOfRepeasts: 25,
          minimumTimeToRest: 60,
          maximumTimeToRest: 90
        }
      },
      'B': {
        'פלאנק': {
          exerciseId: 'exercise-003',
          numberOfSets: 4,
          minimumNumberOfRepeasts: 60,
          maximumNumberOfRepeasts: 120,
          minimumTimeToRest: 90,
          maximumTimeToRest: 120
        }
      },
      'C': {
        'סקוואט': {
          exerciseId: 'exercise-001',
          numberOfSets: 3,
          minimumNumberOfRepeasts: 10,
          maximumNumberOfRepeasts: 15,
          minimumTimeToRest: 75,
          maximumTimeToRest: 105
        }
      }
    },
    isAdminPlan: false,
    createdAt: '2024-03-15T14:20:00Z'
  }
];

export const mockTrainees: Trainee[] = [
  {
    trainerId: 'trainee-001',
    coachId: 'coach-001',
    firstName: 'דני',
    lastName: 'רוזן',
    email: 'danny@example.com',
    plans: ['plan-001'],
    createdAt: '2024-03-20T08:30:00Z'
  },
  {
    trainerId: 'trainee-002',
    coachId: 'coach-001',
    firstName: 'מיכל',
    lastName: 'גולד',
    email: 'michal@example.com',
    plans: ['plan-001', 'plan-002'],
    createdAt: '2024-03-22T10:15:00Z'
  },
  {
    trainerId: 'trainee-003',
    coachId: 'coach-001',
    firstName: 'רון',
    lastName: 'כהן',
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

export const getTraineesByCoachId = (coachId: string): Trainee[] => {
  return mockTrainees.filter(trainee => trainee.coachId === coachId);
};

export const getExerciseSessionsByTraineeId = (traineeId: string, limit?: number): ExerciseSession[] => {
  const sessions = mockExerciseSessions
    .filter(session => session.trainerId === traineeId)
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
    trainees: getTraineesByCoachId('coach-001'),
    sessions: getExerciseSessionsByCoachId('coach-001')
  },
  
  // Empty coach scenario
  emptyCoachScenario: {
    coach: mockCoaches[1],
    exercises: [],
    trainingPlans: [],
    trainees: [],
    sessions: []
  },
  
  // Trainee with progress
  traineeWithProgressScenario: {
    trainee: mockTrainees[0],
    sessions: getExerciseSessionsByTraineeId('trainee-001')
  },
  
  // Trainee without progress
  traineeWithoutProgressScenario: {
    trainee: mockTrainees[2],
    sessions: []
  }
};

// Export all mock data as default
export default {
  coaches: mockCoaches,
  exercises: mockExercises,
  trainingPlans: mockTrainingPlans,
  trainees: mockTrainees,
  exerciseSessions: mockExerciseSessions,
  utils: {
    getCoachById,
    getExercisesByCoachId,
    getTrainingPlansByCoachId,
    getTraineesByCoachId,
    getExerciseSessionsByTraineeId,
    getExerciseSessionsByCoachId,
    createMockApiResponse,
    createMockListResponse
  },
  scenarios: testScenarios
};
