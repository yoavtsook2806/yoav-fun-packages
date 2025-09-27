import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminExerciseBank from '../AdminExerciseBank';
import { cachedApiService } from '../../services/cachedApiService';

// Mock the cachedApiService
vi.mock('../../services/cachedApiService', () => ({
  cachedApiService: {
    getAdminExercises: vi.fn(),
    copyAdminExercise: vi.fn(),
  }
}));

// Mock toast notifications
vi.mock('../ToastContainer', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const mockCachedApiService = cachedApiService as any;

describe('AdminExerciseBank - Muscle Group Filter', () => {
  const mockExercises = [
    {
      exerciseId: 'exercise-1',
      coachId: 'admin',
      name: 'לחיצת חזה במוט',
      muscleGroup: 'חזה אמצעי',
      note: 'שכיבה על הספסל, אחיזה רחבה במוט',
      link: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      isAdminExercise: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      exerciseId: 'exercise-2',
      coachId: 'admin',
      name: 'משיכות במוט',
      muscleGroup: 'גב רחב',
      note: 'אחיזה רחבה, משיכה לכיוון החזה',
      link: 'https://www.youtube.com/watch?v=abc123',
      isAdminExercise: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      exerciseId: 'exercise-3',
      coachId: 'admin',
      name: 'סקוואט',
      muscleGroup: 'ירך קדמי',
      note: 'ירידה עמוקה, שמירה על יציבות',
      link: 'https://www.youtube.com/watch?v=def456',
      isAdminExercise: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      exerciseId: 'exercise-4',
      coachId: 'admin',
      name: 'לחיצת חזה עליון',
      muscleGroup: 'חזה עליון',
      note: 'על ספסל נטוי',
      link: 'https://www.youtube.com/watch?v=ghi789',
      isAdminExercise: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: mockExercises,
      fromCache: false
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show all exercises initially', async () => {
    render(
      <AdminExerciseBank
        coachId="coach-123"
        token="test-token"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
      expect(screen.getByText('משיכות במוט')).toBeInTheDocument();
      expect(screen.getByText('סקוואט')).toBeInTheDocument();
      expect(screen.getByText('לחיצת חזה עליון')).toBeInTheDocument();
    });
  });

  it('should filter exercises by muscle group', async () => {
    render(
      <AdminExerciseBank
        coachId="coach-123"
        token="test-token"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    });

    // Find and interact with the muscle group filter
    const muscleGroupFilter = screen.getByPlaceholderText('סנן לפי קבוצת שרירים...');
    fireEvent.focus(muscleGroupFilter);

    await waitFor(() => {
      expect(screen.getByText('חזה אמצעי')).toBeInTheDocument();
    });

    // Select "חזה אמצעי"
    fireEvent.click(screen.getByText('חזה אמצעי'));

    await waitFor(() => {
      // Should show only exercises with "חזה אמצעי" muscle group
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
      
      // Should not show exercises with other muscle groups
      expect(screen.queryByText('משיכות במוט')).not.toBeInTheDocument();
      expect(screen.queryByText('סקוואט')).not.toBeInTheDocument();
      expect(screen.queryByText('לחיצת חזה עליון')).not.toBeInTheDocument();
    });
  });

  it('should filter exercises by search term', async () => {
    render(
      <AdminExerciseBank
        coachId="coach-123"
        token="test-token"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    });

    // Search for "חזה"
    const searchInput = screen.getByPlaceholderText('חפש תרגיל...');
    fireEvent.change(searchInput, { target: { value: 'חזה' } });

    await waitFor(() => {
      // Should show exercises with "חזה" in name or muscle group
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
      expect(screen.getByText('לחיצת חזה עליון')).toBeInTheDocument();
      
      // Should not show exercises without "חזה"
      expect(screen.queryByText('משיכות במוט')).not.toBeInTheDocument();
      expect(screen.queryByText('סקוואט')).not.toBeInTheDocument();
    });
  });

  it('should combine search term and muscle group filters', async () => {
    render(
      <AdminExerciseBank
        coachId="coach-123"
        token="test-token"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    });

    // Set search term
    const searchInput = screen.getByPlaceholderText('חפש תרגיל...');
    fireEvent.change(searchInput, { target: { value: 'לחיצת' } });

    // Set muscle group filter
    const muscleGroupFilter = screen.getByPlaceholderText('סנן לפי קבוצת שרירים...');
    fireEvent.focus(muscleGroupFilter);

    await waitFor(() => {
      expect(screen.getByText('חזה עליון')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('חזה עליון'));

    await waitFor(() => {
      // Should show only exercises that match both search term AND muscle group
      expect(screen.getByText('לחיצת חזה עליון')).toBeInTheDocument();
      
      // Should not show exercises that match only one filter
      expect(screen.queryByText('לחיצת חזה במוט')).not.toBeInTheDocument(); // matches search but not muscle group
      expect(screen.queryByText('משיכות במוט')).not.toBeInTheDocument();
      expect(screen.queryByText('סקוואט')).not.toBeInTheDocument();
    });
  });

  it('should show clear filters button when filters are active', async () => {
    render(
      <AdminExerciseBank
        coachId="coach-123"
        token="test-token"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    });

    // Initially no clear button
    expect(screen.queryByTitle('נקה מסננים')).not.toBeInTheDocument();

    // Add search term
    const searchInput = screen.getByPlaceholderText('חפש תרגיל...');
    fireEvent.change(searchInput, { target: { value: 'חזה' } });

    await waitFor(() => {
      // Clear button should appear
      expect(screen.getByTitle('נקה מסננים')).toBeInTheDocument();
    });
  });

  it('should clear all filters when clear button is clicked', async () => {
    render(
      <AdminExerciseBank
        coachId="coach-123"
        token="test-token"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    });

    // Add search term
    const searchInput = screen.getByPlaceholderText('חפש תרגיל...');
    fireEvent.change(searchInput, { target: { value: 'חזה' } });

    // Add muscle group filter
    const muscleGroupFilter = screen.getByPlaceholderText('סנן לפי קבוצת שרירים...');
    fireEvent.focus(muscleGroupFilter);

    await waitFor(() => {
      expect(screen.getByText('חזה אמצעי')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('חזה אמצעי'));

    await waitFor(() => {
      expect(screen.getByTitle('נקה מסננים')).toBeInTheDocument();
    });

    // Click clear filters
    fireEvent.click(screen.getByTitle('נקה מסננים'));

    await waitFor(() => {
      // All exercises should be visible again
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
      expect(screen.getByText('משיכות במוט')).toBeInTheDocument();
      expect(screen.getByText('סקוואט')).toBeInTheDocument();
      expect(screen.getByText('לחיצת חזה עליון')).toBeInTheDocument();
      
      // Clear button should be gone
      expect(screen.queryByTitle('נקה מסננים')).not.toBeInTheDocument();
      
      // Input values should be cleared
      expect(searchInput).toHaveValue('');
      expect(muscleGroupFilter).toHaveValue('');
    });
  });

  it('should show empty state when no exercises match filters', async () => {
    render(
      <AdminExerciseBank
        coachId="coach-123"
        token="test-token"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    });

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('חפש תרגיל...');
    fireEvent.change(searchInput, { target: { value: 'xyz123' } });

    await waitFor(() => {
      // Should show empty state
      expect(screen.getByText('לא נמצאו תרגילים')).toBeInTheDocument();
      expect(screen.getByText('נסה מילות חיפוש אחרות')).toBeInTheDocument();
      
      // Should not show any exercises
      expect(screen.queryByText('לחיצת חזה במוט')).not.toBeInTheDocument();
      expect(screen.queryByText('משיכות במוט')).not.toBeInTheDocument();
      expect(screen.queryByText('סקוואט')).not.toBeInTheDocument();
      expect(screen.queryByText('לחיצת חזה עליון')).not.toBeInTheDocument();
    });
  });
});
