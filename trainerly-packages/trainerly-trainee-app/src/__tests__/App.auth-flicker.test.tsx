import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';

// Mock the components
vi.mock('../components/AuthScreen', () => ({
  default: ({ onAuthenticated }: { onAuthenticated: Function }) => (
    <div data-testid="auth-screen">Auth Screen</div>
  )
}));

vi.mock('../components/TrainingSelection', () => ({
  default: () => <div data-testid="trainee-app">Trainee App</div>
}));

vi.mock('../components/ExerciseFlow', () => ({
  default: () => <div data-testid="trainee-app">Trainee App - Exercise Flow</div>
}));

vi.mock('../components/TrainingComplete', () => ({
  default: () => <div data-testid="trainee-app">Trainee App - Complete</div>
}));

vi.mock('../components/SettingsModal', () => ({
  default: () => null
}));

vi.mock('../components/FirstTimeSetup', () => ({
  default: () => null
}));

// Mock services
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

describe('Trainee App - Authentication Flicker Bug', () => {
  const mockTraineeId = 'trainee-123';
  const mockTrainerName = 'Test Trainee';
  const mockCoachId = 'coach-456';
  const mockTimestamp = Date.now().toString();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  it('should show auth screen when no stored credentials exist', async () => {
    // Setup empty localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    render(<App />);
    
    // Should show auth screen immediately
    expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('trainee-app')).not.toBeInTheDocument();
  });

  it('should show trainee app immediately when valid stored credentials exist, then validate in background', async () => {
    // Setup stored credentials BEFORE rendering
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

    render(<App />);

    // CRITICAL: Should show trainee app immediately, NOT auth screen
    expect(screen.getByTestId('trainee-app')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();

    // Wait for validation to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev/trainers/${mockTraineeId}/data`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    // Should still show trainee app after validation
    expect(screen.getByTestId('trainee-app')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();
  });

  it('should show trainee app first, then switch to auth screen if validation fails', async () => {
    // Setup stored credentials BEFORE rendering
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

    // Mock failed validation response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    render(<App />);

    // Should show trainee app immediately
    expect(screen.getByTestId('trainee-app')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();

    // Wait for validation to complete and auth screen to show
    await waitFor(() => {
      expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    });

    // Should have switched to auth screen after validation failure
    expect(screen.queryByTestId('trainee-app')).not.toBeInTheDocument();

    // Should have called removeItem for auth tokens
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('trainerly_trainee_id');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('trainerly_trainer_name');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('trainerly_coach_id');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('trainerly_auth_timestamp');
  });

  it('should show trainee app first, then switch to auth screen if validation throws error', async () => {
    // Setup stored credentials BEFORE rendering
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

    // Mock network error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    // Should show trainee app immediately
    expect(screen.getByTestId('trainee-app')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();

    // Wait for validation to complete and auth screen to show
    await waitFor(() => {
      expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    });

    // Should have switched to auth screen after validation error
    expect(screen.queryByTestId('trainee-app')).not.toBeInTheDocument();

    // Should have called removeItem for auth tokens
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('trainerly_trainee_id');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('trainerly_trainer_name');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('trainerly_coach_id');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('trainerly_auth_timestamp');
  });

  it('should show auth screen when authentication is expired', async () => {
    // Setup expired credentials BEFORE rendering
    const expiredTimestamp = (Date.now() - (31 * 24 * 60 * 60 * 1000)).toString(); // 31 days ago
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'trainerly_trainee_id') return mockTraineeId;
        if (key === 'trainerly_trainer_name') return mockTrainerName;
        if (key === 'trainerly_coach_id') return mockCoachId;
        if (key === 'trainerly_auth_timestamp') return expiredTimestamp;
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    render(<App />);

    // Should show auth screen immediately since auth is expired
    expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('trainee-app')).not.toBeInTheDocument();
  });
});
