import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdminExerciseBank from '../AdminExerciseBank';
import { cachedApiService } from '../../services/cachedApiService';
import { showError, showSuccess } from '../ToastContainer';

// Mock the services
vi.mock('../../services/cachedApiService');
vi.mock('../ToastContainer');

const mockCachedApiService = vi.mocked(cachedApiService);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('AdminExerciseBank - Persistent Copy Indication', () => {
  const mockCoachId = 'coach-123';
  const mockToken = 'token-123';
  const mockAdminExercise = {
    exerciseId: 'admin-exercise-1',
    name: 'כיפופי זרוע ריכוז',
    muscleGroup: 'זרועות',
    note: 'תרגיל מצוין',
    link: '',
    isAdminExercise: true,
    coachId: '',
    createdAt: '2023-01-01T00:00:00.000Z'
  };

  const mockCoachExercise = {
    exerciseId: 'coach-exercise-1',
    name: 'כיפופי זרוע ריכוז',
    muscleGroup: 'זרועות',
    note: 'תרגיל מצוין',
    link: '',
    originalExerciseId: 'admin-exercise-1', // This is the key for persistence
    isAdminExercise: false,
    coachId: mockCoachId,
    createdAt: '2023-01-02T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Default API responses
    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: [mockAdminExercise],
      fromCache: false,
      timestamp: Date.now()
    });
    
    mockCachedApiService.getExercises.mockResolvedValue({
      data: [mockCoachExercise],
      fromCache: false,
      timestamp: Date.now()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show copy indication after refresh when exercise was previously copied', async () => {
    // ARRANGE: Simulate that the exercise was copied in a previous session
    // The localStorage should contain the copied exercise ID
    const storedCopiedIds = JSON.stringify(['admin-exercise-1']);
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === `copied_admin_exercises_${mockCoachId}`) {
        return storedCopiedIds;
      }
      return null;
    });

    // ARRANGE: Mock that the coach has the exercise with originalExerciseId
    mockCachedApiService.getExercises.mockResolvedValue({
      data: [mockCoachExercise], // This exercise has originalExerciseId: 'admin-exercise-1'
      fromCache: false,
      timestamp: Date.now()
    });

    // ACT: Render the component (simulating a fresh page load/refresh)
    render(
      <AdminExerciseBank
        isOpen={true}
        onClose={() => {}}
        coachId={mockCoachId}
        token={mockToken}
      />
    );

    // Wait for the component to load and process the data
    await waitFor(() => {
      expect(screen.getByText('כיפופי זרוע ריכוז')).toBeInTheDocument();
    });

    // ASSERT: The copy button should show as copied
    const copyButton = screen.getByRole('button', { name: /העתק תרגיל|הועתק/i });
    expect(copyButton).toHaveTextContent('הועתק ✓');
    expect(copyButton).toHaveClass('copied');
  });

  it('should combine localStorage and server data for copy indication', async () => {
    // ARRANGE: Simulate partial data in localStorage (some exercises copied before server tracking)
    const storedCopiedIds = JSON.stringify(['admin-exercise-1', 'admin-exercise-old']);
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === `copied_admin_exercises_${mockCoachId}`) {
        return storedCopiedIds;
      }
      return null;
    });

    // ARRANGE: Mock server data with different copied exercise
    const serverCopiedExercise = {
      ...mockCoachExercise,
      exerciseId: 'coach-exercise-2',
      originalExerciseId: 'admin-exercise-2'
    };
    
    mockCachedApiService.getExercises.mockResolvedValue({
      data: [mockCoachExercise, serverCopiedExercise],
      fromCache: false,
      timestamp: Date.now()
    });

    mockCachedApiService.getAdminExercises.mockResolvedValue({
      data: [
        mockAdminExercise,
        { ...mockAdminExercise, exerciseId: 'admin-exercise-2', name: 'תרגיל נוסף', coachId: '' },
        { ...mockAdminExercise, exerciseId: 'admin-exercise-old', name: 'תרגיל ישן', coachId: '' }
      ],
      fromCache: false,
      timestamp: Date.now()
    });

    // ACT: Render the component
    render(
      <AdminExerciseBank
        isOpen={true}
        onClose={() => {}}
        coachId={mockCoachId}
        token={mockToken}
      />
    );

    // Wait for loading
    await waitFor(() => {
      expect(screen.getByText('כיפופי זרוע ריכוז')).toBeInTheDocument();
    });

    // ASSERT: Should update localStorage with combined data
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `copied_admin_exercises_${mockCoachId}`,
        expect.stringContaining('admin-exercise-1') // Should contain original localStorage data
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `copied_admin_exercises_${mockCoachId}`,
        expect.stringContaining('admin-exercise-2') // Should contain server data
      );
    });
  });

  it('should handle the complete copy flow and maintain indication after refresh', async () => {
    // ARRANGE: Start with no copied exercises
    mockLocalStorage.getItem.mockReturnValue(null);
    mockCachedApiService.getExercises.mockResolvedValue({
      data: [], // No copied exercises initially
      fromCache: false,
      timestamp: Date.now()
    });

    // Mock successful copy operation
    mockCachedApiService.copyAdminExercise.mockResolvedValue(mockCoachExercise);

    // ACT 1: Render and copy an exercise
    const { rerender } = render(
      <AdminExerciseBank
        isOpen={true}
        onClose={() => {}}
        coachId={mockCoachId}
        token={mockToken}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('כיפופי זרוע ריכוז')).toBeInTheDocument();
    });

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /העתק תרגיל/i });
    fireEvent.click(copyButton);

    // Wait for edit modal and submit
    await waitFor(() => {
      expect(screen.getByText('עריכת תרגיל לפני העתקה')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /העתק עם השינויים/i });
    fireEvent.click(submitButton);

    // Wait for copy to complete
    await waitFor(() => {
      expect(mockCachedApiService.copyAdminExercise).toHaveBeenCalled();
    });

    // ASSERT 1: Should save to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      `copied_admin_exercises_${mockCoachId}`,
      JSON.stringify(['admin-exercise-1'])
    );

    // ACT 2: Simulate refresh by updating mock data and re-rendering
    mockCachedApiService.getExercises.mockResolvedValue({
      data: [mockCoachExercise], // Now the coach has the copied exercise
      fromCache: false,
      timestamp: Date.now()
    });

    // Simulate localStorage having the data from previous session
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === `copied_admin_exercises_${mockCoachId}`) {
        return JSON.stringify(['admin-exercise-1']);
      }
      return null;
    });

    // Re-render (simulating refresh)
    rerender(
      <AdminExerciseBank
        isOpen={true}
        onClose={() => {}}
        coachId={mockCoachId}
        token={mockToken}
      />
    );

    // ASSERT 2: After refresh, should still show as copied
    await waitFor(() => {
      const refreshedCopyButton = screen.getByRole('button', { name: /הועתק/i });
      expect(refreshedCopyButton).toHaveTextContent('הועתק ✓');
      expect(refreshedCopyButton).toHaveClass('copied');
    });
  });

  it('should handle API failures gracefully and fallback to localStorage', async () => {
    // ARRANGE: localStorage has copied exercise data
    const storedCopiedIds = JSON.stringify(['admin-exercise-1']);
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === `copied_admin_exercises_${mockCoachId}`) {
        return storedCopiedIds;
      }
      return null;
    });

    // ARRANGE: Mock API failure for coach exercises
    mockCachedApiService.getExercises.mockRejectedValue(new Error('API Error'));

    // ACT: Render the component
    render(
      <AdminExerciseBank
        isOpen={true}
        onClose={() => {}}
        coachId={mockCoachId}
        token={mockToken}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('כיפופי זרוע ריכוז')).toBeInTheDocument();
    });

    // ASSERT: Should still show copy indication from localStorage
    const copyButton = screen.getByRole('button', { name: /הועתק/i });
    expect(copyButton).toHaveTextContent('הועתק ✓');
    expect(copyButton).toHaveClass('copied');
  });
});
