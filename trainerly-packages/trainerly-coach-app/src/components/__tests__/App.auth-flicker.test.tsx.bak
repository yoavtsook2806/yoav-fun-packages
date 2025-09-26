import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../../App';

// Mock the components
vi.mock('../AuthScreen', () => ({
  default: ({ onLogin }: { onLogin: Function }) => (
    <div data-testid="auth-screen">Auth Screen</div>
  )
}));

vi.mock('../CoachDashboard', () => ({
  default: ({ coachId, token, onLogout }: any) => (
    <div data-testid="coach-dashboard">Coach Dashboard - {coachId}</div>
  )
}));

vi.mock('../ToastContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('App - Authentication Flicker Bug', () => {
  const mockCoachData = {
    coachId: 'coach-123',
    name: 'Test Coach',
    email: 'test@example.com',
    nickname: 'testcoach',
    valid: true,
    createdAt: '2025-09-26T10:00:00Z'
  };

  const mockToken = 'test-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  it('should show auth screen when no stored credentials exist', async () => {
    render(<App />);
    
    // Should show auth screen immediately
    expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('coach-dashboard')).not.toBeInTheDocument();
  });

  it('should show coach dashboard immediately when valid stored credentials exist, then validate in background', async () => {
    // Setup stored credentials BEFORE rendering
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'coach_token') return mockToken;
        if (key === 'coach_data') return JSON.stringify(mockCoachData);
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
      json: async () => mockCoachData
    });

    render(<App />);

    // CRITICAL: Should show dashboard immediately, NOT auth screen
    expect(screen.getByTestId('coach-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();

    // Wait for validation to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev/coaches/${mockCoachData.coachId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    // Should still show dashboard after validation
    expect(screen.getByTestId('coach-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();
  });

  it('should show dashboard first, then switch to auth screen if validation fails', async () => {
    // Setup stored credentials BEFORE rendering
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'coach_token') return mockToken;
        if (key === 'coach_data') return JSON.stringify(mockCoachData);
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

    // Should show dashboard immediately
    expect(screen.getByTestId('coach-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();

    // Wait for validation to complete and auth screen to show
    await waitFor(() => {
      expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    });

    // Should have switched to auth screen after validation failure
    expect(screen.queryByTestId('coach-dashboard')).not.toBeInTheDocument();

    // Should have called removeItem for both tokens
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('coach_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('coach_data');
  });

  it('should show dashboard first, then switch to auth screen if validation throws error', async () => {
    // Setup stored credentials BEFORE rendering
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'coach_token') return mockToken;
        if (key === 'coach_data') return JSON.stringify(mockCoachData);
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

    // Should show dashboard immediately
    expect(screen.getByTestId('coach-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-screen')).not.toBeInTheDocument();

    // Wait for validation to complete and auth screen to show
    await waitFor(() => {
      expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    });

    // Should have switched to auth screen after validation error
    expect(screen.queryByTestId('coach-dashboard')).not.toBeInTheDocument();

    // Should have called removeItem for both tokens
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('coach_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('coach_data');
  });

  it('should handle invalid JSON in localStorage gracefully', async () => {
    // Setup invalid stored data BEFORE rendering
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'coach_token') return mockToken;
        if (key === 'coach_data') return 'invalid-json';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    render(<App />);

    // Should show auth screen immediately since localStorage data is invalid
    expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('coach-dashboard')).not.toBeInTheDocument();

    // Should have called removeItem for both tokens
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('coach_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('coach_data');
  });
});
