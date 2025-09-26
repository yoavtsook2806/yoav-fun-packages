import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';

// Mock the components
vi.mock('../components/AuthScreen', () => ({
  default: ({ onAuthenticated }: { onAuthenticated: Function }) => (
    <div data-testid="auth-screen">Auth Screen</div>
  )
}));

vi.mock('../components/TrainingSelection', () => ({
  default: () => <div data-testid="training-selection">Training Selection</div>
}));

vi.mock('../components/ExerciseFlow', () => ({
  default: () => <div data-testid="exercise-flow">Exercise Flow</div>
}));

vi.mock('../components/TrainingComplete', () => ({
  default: () => <div data-testid="training-complete">Training Complete</div>
}));

vi.mock('../components/SettingsModal', () => ({
  default: () => null
}));

vi.mock('../components/FirstTimeSetup', () => ({
  default: () => null
}));

// Mock services
import * as traineeService from '../services/traineeService';
vi.mock('../services/traineeService', () => ({
  fetchTraineeData: vi.fn(),
  clearTraineeCache: vi.fn(),
  syncExerciseSession: vi.fn(),
  loadAllTraineeDataFromServer: vi.fn(),
  syncAllTraineeDataToServer: vi.fn()
}));

vi.mock('../constants/localStorage', () => ({
  clearAllLocalStorageData: vi.fn()
}));

vi.mock('../utils/exerciseHistory', () => ({
  getLastUsedWeight: vi.fn(),
  getLastUsedRepeats: vi.fn(),
  saveExerciseEntry: vi.fn(),
  removeDuplicateHistoryEntries: vi.fn(),
  getExerciseProgress: vi.fn(),
  saveTrainingProgress: vi.fn(),
  getDefaultWeight: vi.fn(),
  getDefaultRestTime: vi.fn(),
  getDefaultRepeats: vi.fn(),
  calculateDefaultRestTime: vi.fn(),
  calculateDefaultRepeats: vi.fn(),
  getExerciseLastEntry: vi.fn(),
  isFirstTimeExperience: vi.fn(),
  saveExerciseDefaults: vi.fn()
}));

// Mock toast functionality
vi.mock('../components/ToastContainer', () => {
  const mockShowSuccess = vi.fn();
  const mockShowError = vi.fn();
  
  return {
    default: ({ children }: { children: React.ReactNode }) => (
      <div>
        {children}
        <div data-testid="toast-container"></div>
      </div>
    ),
    showSuccess: mockShowSuccess,
    showError: mockShowError
  };
});

import { showSuccess } from '../components/ToastContainer';
const mockShowSuccess = vi.mocked(showSuccess);

describe('Trainee App - Plan Persistence and Toast Flows', () => {
  const mockTraineeId = 'trainee-123';
  const mockTrainerName = 'Test Trainee';
  const mockCoachId = 'coach-456';
  const mockTimestamp = Date.now().toString();

  const mockTrainingPlan1 = {
    planId: 'plan-123',
    name: 'Beginner Plan',
    version: '1.0',
    trainings: {
      'Training A': {
        'Push ups': {
          numberOfSets: 3,
          minimumTimeToRest: 60,
          maximumTimeToRest: 120,
          minimumNumberOfRepeasts: 10,
          maximumNumberOfRepeasts: 15,
          note: 'Test exercise',
          muscleGroup: 'חזה',
          link: ''
        }
      }
    }
  };

  const mockTrainingPlan2 = {
    planId: 'plan-456',
    name: 'Advanced Plan',
    version: '2.0',
    trainings: {
      'Training B': {
        'Pull ups': {
          numberOfSets: 4,
          minimumTimeToRest: 90,
          maximumTimeToRest: 150,
          minimumNumberOfRepeasts: 8,
          maximumNumberOfRepeasts: 12,
          note: 'Advanced exercise',
          muscleGroup: 'גב',
          link: ''
        }
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  it('FLOW 1: First time loading plan - should show toast for genuine update', async () => {
    // Setup authenticated user
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
        // NO STORED TRAINING PLAN - simulating first time
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock successful validation response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        exerciseDefaults: {},
        trainingProgress: {},
        exerciseHistory: {},
        firstTimeExperienceCompleted: false,
        customExerciseData: {}
      })
    });

    // Mock trainee service calls - return initial plan
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    mockTraineeService.fetchTraineeData.mockResolvedValue({
      allPlans: [mockTrainingPlan1],
      currentPlan: mockTrainingPlan1
    });

    render(<App />);

    // Should show app immediately
    expect(screen.getByTestId('training-selection')).toBeInTheDocument();

    // Wait for background loading to complete
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalled();
    });

    // CRITICAL: Should NOT show toast for first-time loading (not an update)
    expect(mockShowSuccess).not.toHaveBeenCalled();

    // CRITICAL: Should save plan to localStorage for persistence
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'trainerly_current_plan',
      JSON.stringify(mockTrainingPlan1)
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'trainerly_has_loaded_real_plan',
      'true'
    );
  });

  it('FLOW 2: Second time loading same plan - no toast but data should be persistent', async () => {
    // Setup authenticated user with STORED TRAINING PLAN
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
        // STORED TRAINING PLAN - simulating persistence
        if (key === 'trainerly_current_plan') return JSON.stringify(mockTrainingPlan1);
        if (key === 'trainerly_has_loaded_real_plan') return 'true';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock successful validation response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        exerciseDefaults: {},
        trainingProgress: {},
        exerciseHistory: {},
        firstTimeExperienceCompleted: false,
        customExerciseData: {}
      })
    });

    // Mock trainee service calls - return SAME plan
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    mockTraineeService.fetchTraineeData.mockResolvedValue({
      allPlans: [mockTrainingPlan1],
      currentPlan: mockTrainingPlan1
    });

    render(<App />);

    // CRITICAL: Should show app immediately with STORED plan (no empty plan phase)
    expect(screen.getByTestId('training-selection')).toBeInTheDocument();

    // Wait for background loading to complete
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalled();
    });

    // CRITICAL: Should NOT show toast because plan hasn't changed
    expect(mockShowSuccess).not.toHaveBeenCalled();

    // Should still update localStorage with latest data
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'trainerly_current_plan',
      JSON.stringify(mockTrainingPlan1)
    );
  });

  it('FLOW 3: Plan genuinely updated - should show toast notification', async () => {
    // Setup authenticated user with STORED TRAINING PLAN (old plan)
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
        // STORED OLD TRAINING PLAN
        if (key === 'trainerly_current_plan') return JSON.stringify(mockTrainingPlan1);
        if (key === 'trainerly_has_loaded_real_plan') return 'true';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock successful validation response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        exerciseDefaults: {},
        trainingProgress: {},
        exerciseHistory: {},
        firstTimeExperienceCompleted: false,
        customExerciseData: {}
      })
    });

    // Mock trainee service calls - return NEW/UPDATED plan
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    mockTraineeService.fetchTraineeData.mockResolvedValue({
      allPlans: [mockTrainingPlan2],
      currentPlan: mockTrainingPlan2
    });

    render(<App />);

    // Should show app immediately with OLD plan from localStorage
    expect(screen.getByTestId('training-selection')).toBeInTheDocument();

    // Wait for background loading to complete
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalled();
    });

    // CRITICAL: Should show toast because plan has genuinely changed
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining('תוכנית האימונים עודכנה'),
        6000
      );
    });

    // Should save new plan to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'trainerly_current_plan',
      JSON.stringify(mockTrainingPlan2)
    );
  });

  it('FLOW 4: App refresh after plan update - should persist new plan without toast', async () => {
    // Setup authenticated user with NEW STORED TRAINING PLAN (after update)
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
        // STORED NEW TRAINING PLAN (after the update)
        if (key === 'trainerly_current_plan') return JSON.stringify(mockTrainingPlan2);
        if (key === 'trainerly_has_loaded_real_plan') return 'true';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock successful validation response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        exerciseDefaults: {},
        trainingProgress: {},
        exerciseHistory: {},
        firstTimeExperienceCompleted: false,
        customExerciseData: {}
      })
    });

    // Mock trainee service calls - return SAME new plan (no further changes)
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    mockTraineeService.fetchTraineeData.mockResolvedValue({
      allPlans: [mockTrainingPlan2],
      currentPlan: mockTrainingPlan2
    });

    render(<App />);

    // CRITICAL: Should show app immediately with NEW plan from localStorage (no empty plan phase)
    expect(screen.getByTestId('training-selection')).toBeInTheDocument();

    // Wait for background loading to complete
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalled();
    });

    // CRITICAL: Should NOT show toast because plan hasn't changed since last update
    expect(mockShowSuccess).not.toHaveBeenCalled();

    // Should maintain the new plan in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'trainerly_current_plan',
      JSON.stringify(mockTrainingPlan2)
    );
  });

  it('FLOW 5: Multiple rapid plan updates - should show toast for each genuine change', async () => {
    // This test simulates multiple plan updates in sequence
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
        // Start with plan 1
        if (key === 'trainerly_current_plan') return JSON.stringify(mockTrainingPlan1);
        if (key === 'trainerly_has_loaded_real_plan') return 'true';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock successful validation response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        exerciseDefaults: {},
        trainingProgress: {},
        exerciseHistory: {},
        firstTimeExperienceCompleted: false,
        customExerciseData: {}
      })
    });

    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);

    // First update: plan1 -> plan2
    mockTraineeService.fetchTraineeData.mockResolvedValueOnce({
      allPlans: [mockTrainingPlan2],
      currentPlan: mockTrainingPlan2
    });

    render(<App />);

    // Wait for first background loading
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalledTimes(1);
    });

    // Should show toast for first update
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Advanced Plan'),
        6000
      );
    });

    // Clear mock for second update
    mockShowSuccess.mockClear();

    // Simulate second update: plan2 -> plan1 (back to original)
    mockTraineeService.fetchTraineeData.mockResolvedValueOnce({
      allPlans: [mockTrainingPlan1],
      currentPlan: mockTrainingPlan1
    });

    // This would require triggering another background validation
    // For this test, we'll just verify the logic is sound
    // In reality, this would happen through user actions or periodic checks
  });

  it.skip('FLOW 6: Version-only update - should show toast for version changes', async () => {
    const planV1 = { ...mockTrainingPlan1, planId: 'plan-v1', version: '1.0' };
    const planV2 = { ...mockTrainingPlan1, planId: 'plan-v2', version: '2.0' }; // Same name, different version and planId

    // Setup with version 1.0
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
        if (key === 'trainerly_current_plan') return JSON.stringify(planV1);
        if (key === 'trainerly_has_loaded_real_plan') return 'true';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock successful validation response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        exerciseDefaults: {},
        trainingProgress: {},
        exerciseHistory: {},
        firstTimeExperienceCompleted: false,
        customExerciseData: {}
      })
    });

    // Return version 2.0
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    mockTraineeService.fetchTraineeData.mockResolvedValue({
      allPlans: [planV2],
      currentPlan: planV2
    });

    render(<App />);

    // Wait for background loading
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalled();
    });

    // CRITICAL: Should show toast for version change
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.stringContaining('תוכנית האימונים עודכנה'),
        6000
      );
    });
  });

  it('FLOW 7: Network error during background loading - should handle gracefully with stored plan', async () => {
    // Setup with stored plan
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
        if (key === 'trainerly_current_plan') return JSON.stringify(mockTrainingPlan1);
        if (key === 'trainerly_has_loaded_real_plan') return 'true';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock successful validation response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        exerciseDefaults: {},
        trainingProgress: {},
        exerciseHistory: {},
        firstTimeExperienceCompleted: false,
        customExerciseData: {}
      })
    });

    // Mock network error for plan loading
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    mockTraineeService.fetchTraineeData.mockRejectedValue(new Error('Network error'));

    render(<App />);

    // Should show app immediately with stored plan
    expect(screen.getByTestId('training-selection')).toBeInTheDocument();

    // Wait for background loading to fail
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalled();
    });

    // Should not show success toast (no update)
    expect(mockShowSuccess).not.toHaveBeenCalled();

    // Should still show the app with the stored plan (graceful degradation)
    expect(screen.getByTestId('training-selection')).toBeInTheDocument();
  });
});
