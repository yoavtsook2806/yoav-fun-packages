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

describe('AdminExerciseBank - Error Message Bug', () => {
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

  it('should show specific error message when exercise name already exists', async () => {
    // Mock successful loading of admin exercises
    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: mockAdminExercises,
      fromCache: false,
      timestamp: Date.now()
    });

    // Mock copyAdminExercise to fail with a specific server error
    // The server returns a 409 status with a specific error message
    const serverErrorMessage = 'Exercise with this name already exists';
    mockCachedApiService.copyAdminExercise.mockRejectedValue(
      new Error(serverErrorMessage)
    );

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

    // BUG: Should show the specific server error message, not a generic one
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(serverErrorMessage);
    });

    // Should not show success message
    expect(mockShowSuccess).not.toHaveBeenCalled();

    // Should not call onExerciseCopied
    expect(mockProps.onExerciseCopied).not.toHaveBeenCalled();
  });

  it('should show specific error message when admin exercise not found', async () => {
    // Mock successful loading of admin exercises
    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: mockAdminExercises,
      fromCache: false,
      timestamp: Date.now()
    });

    // Mock copyAdminExercise to fail with a 404 server error
    const serverErrorMessage = 'Admin exercise not found';
    mockCachedApiService.copyAdminExercise.mockRejectedValue(
      new Error(serverErrorMessage)
    );

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

    // BUG: Should show the specific server error message, not a generic one
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(serverErrorMessage);
    });

    // Should not show success message
    expect(mockShowSuccess).not.toHaveBeenCalled();

    // Should not call onExerciseCopied
    expect(mockProps.onExerciseCopied).not.toHaveBeenCalled();
  });

  it('should show generic error message for unexpected server errors', async () => {
    // Mock successful loading of admin exercises
    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: mockAdminExercises,
      fromCache: false,
      timestamp: Date.now()
    });

    // Mock copyAdminExercise to fail with a 500 server error
    const serverErrorMessage = 'Internal server error';
    mockCachedApiService.copyAdminExercise.mockRejectedValue(
      new Error(serverErrorMessage)
    );

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

    // Should show the server error message
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(serverErrorMessage);
    });

    // Should not show success message
    expect(mockShowSuccess).not.toHaveBeenCalled();

    // Should not call onExerciseCopied
    expect(mockProps.onExerciseCopied).not.toHaveBeenCalled();
  });
});
