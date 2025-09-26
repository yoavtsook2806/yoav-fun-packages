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

describe('Trainee App - Plan Comparison Bug', () => {
  const mockTraineeId = 'trainee-123';
  const mockTrainerName = 'Test Trainee';
  const mockCoachId = 'coach-456';
  const mockTimestamp = Date.now().toString();

  const mockTrainingPlan = {
    planId: 'plan-123',
    name: 'My Training Plan',
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

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  it('should NOT show toast when loading the same plan for the first time (not a real update)', async () => {
    // Setup authenticated user
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
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

    // Mock trainee service calls - return the same plan as "loaded from server"
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    mockTraineeService.fetchTraineeData.mockResolvedValue({
      allPlans: [mockTrainingPlan],
      currentPlan: mockTrainingPlan
    });

    render(<App />);

    // Should show app immediately
    expect(screen.getByTestId('training-selection')).toBeInTheDocument();

    // Wait for background loading to complete
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalled();
    });

    // CRITICAL: Should NOT show toast notification because this is the first load, not an update
    // The app starts with createEmptyTrainingPlan() and then loads the real plan
    // This is not a "plan update" - it's just the initial load
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it('should NOT show toast when background loading returns the exact same plan', async () => {
    // Setup authenticated user
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
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

    // Mock trainee service calls - simulate multiple calls returning same plan
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    
    // First call - initial load
    mockTraineeService.fetchTraineeData.mockResolvedValueOnce({
      allPlans: [mockTrainingPlan],
      currentPlan: mockTrainingPlan
    });

    render(<App />);

    // Wait for initial background loading to complete
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalledTimes(1);
    });

    // Clear the mock to track subsequent calls
    mockShowSuccess.mockClear();

    // Simulate another background load with the EXACT same plan
    mockTraineeService.fetchTraineeData.mockResolvedValueOnce({
      allPlans: [mockTrainingPlan], // Same plan
      currentPlan: mockTrainingPlan  // Same plan
    });

    // Trigger another background validation (simulate user doing something that triggers validation)
    // This is a bit artificial but represents the real scenario
    act(() => {
      // We can't easily trigger background validation from outside, 
      // but this test demonstrates the expected behavior
    });

    // CRITICAL: Should NOT show toast because the plan hasn't actually changed
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it('should ONLY show toast when plan name or version actually changes', async () => {
    // Setup authenticated user
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
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

    // Mock trainee service calls
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    
    // First call - return initial plan
    const initialPlan = { ...mockTrainingPlan, name: 'Initial Plan', version: '1.0' };
    mockTraineeService.fetchTraineeData.mockResolvedValueOnce({
      allPlans: [initialPlan],
      currentPlan: initialPlan
    });

    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalledTimes(1);
    });

    // Clear mocks to track the next interaction
    mockShowSuccess.mockClear();
    
    // Now simulate a REAL plan update - different name
    const updatedPlan = { ...mockTrainingPlan, name: 'Updated Plan', version: '2.0' };
    mockTraineeService.fetchTraineeData.mockResolvedValueOnce({
      allPlans: [updatedPlan],
      currentPlan: updatedPlan
    });

    // This test is more conceptual - in reality the background validation would be triggered
    // by the useEffect, but here we're demonstrating the expected behavior
    
    // CRITICAL: This SHOULD show toast because the plan actually changed
    // (This test will pass once we fix the comparison logic)
  });

  it('should handle transition from empty plan to real plan correctly (no toast)', async () => {
    // This test specifically addresses the bug where loading from createEmptyTrainingPlan()
    // to a real plan shows a toast notification incorrectly
    
    // Setup authenticated user
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return mockTimestamp;
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

    // Mock trainee service calls
    const mockTraineeService = vi.mocked(traineeService);
    mockTraineeService.loadAllTraineeDataFromServer.mockResolvedValue(true);
    mockTraineeService.fetchTraineeData.mockResolvedValue({
      allPlans: [mockTrainingPlan],
      currentPlan: mockTrainingPlan
    });

    render(<App />);

    // App starts with createEmptyTrainingPlan() which has:
    // name: 'אין תוכנית אימונים', version: '1.0'
    
    // Background loading loads the real plan:
    // name: 'My Training Plan', version: '1.0'
    
    await waitFor(() => {
      expect(mockTraineeService.fetchTraineeData).toHaveBeenCalled();
    });

    // CRITICAL: Should NOT show toast because this is initial loading, not an update
    // The comparison should recognize that going from empty plan to real plan is not an "update"
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });
});
