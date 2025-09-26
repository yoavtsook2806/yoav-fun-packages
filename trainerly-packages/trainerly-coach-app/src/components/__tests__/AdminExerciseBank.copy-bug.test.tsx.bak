import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdminExerciseBank from '../AdminExerciseBank';
import { cachedApiService } from '../../services/cachedApiService';
import { showError, showSuccess } from '../ToastContainer';

// Mock the services and utilities
vi.mock('../../services/cachedApiService');
vi.mock('../ToastContainer');

const mockCachedApiService = vi.mocked(cachedApiService);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

describe('AdminExerciseBank - Copy Exercise Bug', () => {
  const mockProps = {
    coachId: 'coach-123',
    token: 'test-token',
    isOpen: true,
    onClose: vi.fn(),
    onExerciseCopied: vi.fn()
  };

  const mockAdminExercises = [
    {
      exerciseId: 'admin-exercise-1',
      name: 'לחיצת חזה במוט',
      muscleGroup: 'חזה אמצעי',
      note: 'שכיבה על הספסל, אחיזה רחבה במוט',
      link: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      isAdminExercise: true,
      coachId: 'admin-coach',
      createdAt: '2025-09-26T09:35:09.466Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle copy admin exercise failure properly', async () => {
    // Mock successful loading of admin exercises
    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: mockAdminExercises,
      fromCache: false,
      timestamp: Date.now()
    });

    // Mock copyAdminExercise to fail
    const errorMessage = 'Failed to copy admin exercise: Internal Server Error';
    mockCachedApiService.copyAdminExercise.mockRejectedValue(new Error(errorMessage));

    render(<AdminExerciseBank {...mockProps} />);

    // Wait for exercises to load
    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    });

    // Find and click the copy button
    const copyButton = screen.getByText('📋 העתק תרגיל');
    fireEvent.click(copyButton);

    // Wait for the copy operation to complete
    await waitFor(() => {
      expect(mockCachedApiService.copyAdminExercise).toHaveBeenCalledWith(
        'coach-123',
        'admin-exercise-1',
        'test-token'
      );
    });

    // Should show error message
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(errorMessage);
    });

    // Should not show success message
    expect(mockShowSuccess).not.toHaveBeenCalled();

    // Should not call onExerciseCopied
    expect(mockProps.onExerciseCopied).not.toHaveBeenCalled();

    // Should not close modal
    expect(mockProps.onClose).not.toHaveBeenCalled();

    // Button should not be in loading state after error
    expect(screen.getByText('📋 העתק תרגיל')).toBeInTheDocument();
    expect(screen.queryByText('מעתיק...')).not.toBeInTheDocument();
  });

  it('should successfully copy admin exercise', async () => {
    // Mock successful loading of admin exercises
    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: mockAdminExercises,
      fromCache: false,
      timestamp: Date.now()
    });

    // Mock successful copy
    const copiedExercise = {
      exerciseId: 'copied-exercise-1',
      name: 'לחיצת חזה במוט',
      muscleGroup: 'חזה אמצעי',
      note: 'שכיבה על הספסל, אחיזה רחבה במוט',
      link: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      isAdminExercise: false,
      coachId: 'coach-123',
      createdAt: '2025-09-26T09:46:06.221Z',
      originalExerciseId: 'admin-exercise-1'
    };

    mockCachedApiService.copyAdminExercise.mockResolvedValue(copiedExercise);

    render(<AdminExerciseBank {...mockProps} />);

    // Wait for exercises to load
    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    });

    // Find and click the copy button
    const copyButton = screen.getByText('📋 העתק תרגיל');
    fireEvent.click(copyButton);

    // Wait for the copy operation to complete
    await waitFor(() => {
      expect(mockCachedApiService.copyAdminExercise).toHaveBeenCalledWith(
        'coach-123',
        'admin-exercise-1',
        'test-token'
      );
    });

    // Should show success message
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith('תרגיל "לחיצת חזה במוט" הועתק בהצלחה!');
    });

    // Should not show error message
    expect(mockShowError).not.toHaveBeenCalled();

    // Should call onExerciseCopied
    expect(mockProps.onExerciseCopied).toHaveBeenCalledWith(copiedExercise);

    // Should close modal
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should prevent double-clicking during copy operation', async () => {
    // Mock successful loading of admin exercises
    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: mockAdminExercises,
      fromCache: false,
      timestamp: Date.now()
    });

    // Mock copyAdminExercise to take some time
    let resolvePromise: (value: any) => void;
    const copyPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockCachedApiService.copyAdminExercise.mockReturnValue(copyPromise as any);

    render(<AdminExerciseBank {...mockProps} />);

    // Wait for exercises to load
    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    });

    // Find and click the copy button
    const copyButton = screen.getByText('📋 העתק תרגיל');
    fireEvent.click(copyButton);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText('מעתיק...')).toBeInTheDocument();
    });

    // Button should be disabled
    const loadingButton = screen.getByRole('button', { name: /מעתיק/ });
    expect(loadingButton).toBeDisabled();

    // Try to click again - should not trigger another call
    fireEvent.click(loadingButton);

    // Should still only have one call
    expect(mockCachedApiService.copyAdminExercise).toHaveBeenCalledTimes(1);

    // Resolve the promise
    const copiedExercise = {
      exerciseId: 'copied-exercise-1',
      name: 'לחיצת חזה במוט',
      muscleGroup: 'חזה אמצעי',
      note: 'שכיבה על הספסל, אחיזה רחבה במוט',
      link: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      isAdminExercise: false,
      coachId: 'coach-123',
      createdAt: '2025-09-26T09:46:06.221Z',
      originalExerciseId: 'admin-exercise-1'
    };
    resolvePromise!(copiedExercise);

    // Wait for completion
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith('תרגיל "לחיצת חזה במוט" הועתק בהצלחה!');
    });
  });
});
