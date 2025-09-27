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

    // Click on the exercise card to expand it
    const exerciseCard = screen.getByText('לחיצת חזה במוט');
    fireEvent.click(exerciseCard);

    // Wait for the card to expand and copy button to appear
    await waitFor(() => {
      expect(screen.getByText('📋 העתק תרגיל')).toBeInTheDocument();
    });

    // Find and click the copy button (opens edit modal)
    const copyButton = screen.getByText('📋 העתק תרגיל');
    fireEvent.click(copyButton);

    // Wait for edit modal to appear
    await waitFor(() => {
      expect(screen.getByText('עריכת תרגיל לפני העתקה')).toBeInTheDocument();
    });

    // Submit the edit form to trigger the copy
    const copyWithEditsButton = screen.getByText('העתק עם השינויים');
    fireEvent.click(copyWithEditsButton);

    // Wait for the copy operation to complete
    await waitFor(() => {
      expect(mockCachedApiService.copyAdminExercise).toHaveBeenCalledWith(
        'coach-123',
        'admin-exercise-1',
        'test-token',
        expect.objectContaining({
          name: 'לחיצת חזה במוט',
          muscleGroup: 'חזה אמצעי',
          note: 'שכיבה על הספסל, אחיזה רחבה במוט',
          link: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
        })
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

  it('should successfully copy admin exercise but NOT close modal', async () => {
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

    // Click on the exercise card to expand it
    const exerciseCard = screen.getByText('לחיצת חזה במוט');
    fireEvent.click(exerciseCard);

    // Wait for the card to expand and copy button to appear
    await waitFor(() => {
      expect(screen.getByText('📋 העתק תרגיל')).toBeInTheDocument();
    });

    // Find and click the copy button (opens edit modal)
    const copyButton = screen.getByText('📋 העתק תרגיל');
    fireEvent.click(copyButton);

    // Wait for edit modal to appear
    await waitFor(() => {
      expect(screen.getByText('עריכת תרגיל לפני העתקה')).toBeInTheDocument();
    });

    // Submit the edit form to trigger the copy
    const copyWithEditsButton = screen.getByText('העתק עם השינויים');
    fireEvent.click(copyWithEditsButton);

    // Wait for the copy operation to complete
    await waitFor(() => {
      expect(mockCachedApiService.copyAdminExercise).toHaveBeenCalledWith(
        'coach-123',
        'admin-exercise-1',
        'test-token',
        expect.objectContaining({
          name: 'לחיצת חזה במוט',
          muscleGroup: 'חזה אמצעי',
          note: 'שכיבה על הספסל, אחיזה רחבה במוט',
          link: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
        })
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

    // BUG: Should NOT close modal after successful copy
    expect(mockProps.onClose).not.toHaveBeenCalled();
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

    // Click on the exercise card to expand it
    const exerciseCard = screen.getByText('לחיצת חזה במוט');
    fireEvent.click(exerciseCard);

    // Wait for the card to expand and copy button to appear
    await waitFor(() => {
      expect(screen.getByText('📋 העתק תרגיל')).toBeInTheDocument();
    });

    // Find and click the copy button (opens edit modal)
    const copyButton = screen.getByText('📋 העתק תרגיל');
    fireEvent.click(copyButton);

    // Wait for edit modal to appear
    await waitFor(() => {
      expect(screen.getByText('עריכת תרגיל לפני העתקה')).toBeInTheDocument();
    });

    // Submit the edit form to trigger the copy
    const copyWithEditsButton = screen.getByText('העתק עם השינויים');
    fireEvent.click(copyWithEditsButton);

    // Modal submit button should show loading state
    await waitFor(() => {
      const loadingButtons = screen.getAllByText('מעתיק...');
      expect(loadingButtons.length).toBeGreaterThan(0);
      // Find the submit button specifically
      const modalSubmitButton = loadingButtons.find(button => 
        button.closest('form') !== null
      );
      expect(modalSubmitButton).toBeInTheDocument();
    });

    // Modal submit button should be disabled
    const loadingButtons = screen.getAllByText('מעתיק...');
    const modalSubmitButton = loadingButtons.find(button => 
      button.closest('form') !== null
    );
    expect(modalSubmitButton).toBeDisabled();

    // Try to click again - should not trigger another call
    fireEvent.click(modalSubmitButton!);

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