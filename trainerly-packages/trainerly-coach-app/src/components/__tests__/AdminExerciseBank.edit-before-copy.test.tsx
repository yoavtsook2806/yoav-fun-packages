import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminExerciseBank from '../AdminExerciseBank';
import { cachedApiService } from '../../services/cachedApiService';

// Mock the cached API service
vi.mock('../../services/cachedApiService', () => ({
  cachedApiService: {
    getAdminExercises: vi.fn(),
    copyAdminExercise: vi.fn(),
  }
}));

// Mock ToastContainer
vi.mock('../ToastContainer', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

describe('AdminExerciseBank - Edit Before Copy', () => {
  const mockProps = {
    coachId: 'coach123',
    token: 'token123',
    isOpen: true,
    onClose: vi.fn(),
    onExerciseCopied: vi.fn(),
  };

  const mockExercise = {
    exerciseId: 'exercise123',
    name: 'Push Ups',
    muscleGroup: 'חזה',
    note: 'תרגיל בסיסי לחזה',
    link: 'https://example.com/video',
    coachId: 'admin',
    createdAt: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    (cachedApiService.getAdminExercises as any).mockResolvedValue({
      data: [mockExercise]
    });
    
    (cachedApiService.copyAdminExercise as any).mockResolvedValue({
      ...mockExercise,
      exerciseId: 'copied-exercise123',
      coachId: 'coach123'
    });
  });

  it('should show edit modal when clicking copy exercise button', async () => {
    render(<AdminExerciseBank {...mockProps} />);
    
    // Wait for exercises to load and expand the card
    await waitFor(() => {
      expect(screen.getByText('Push Ups')).toBeInTheDocument();
    });
    
    // Click to expand the card
    fireEvent.click(screen.getByText('Push Ups'));
    
    // Wait for copy button to appear
    await waitFor(() => {
      expect(screen.getByText('📋 העתק תרגיל')).toBeInTheDocument();
    });
    
    // Click the copy button - should open edit modal instead of copying directly
    fireEvent.click(screen.getByText('📋 העתק תרגיל'));
    
    // Should show edit modal with exercise data
    await waitFor(() => {
      expect(screen.getByText('עריכת תרגיל לפני העתקה')).toBeInTheDocument();
    });
    
    // Should show exercise fields pre-filled
    expect(screen.getByDisplayValue('Push Ups')).toBeInTheDocument();
    expect(screen.getByDisplayValue('חזה')).toBeInTheDocument();
    expect(screen.getByDisplayValue('תרגיל בסיסי לחזה')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/video')).toBeInTheDocument();
  });

  it('should allow editing exercise data in the modal', async () => {
    render(<AdminExerciseBank {...mockProps} />);
    
    // Wait for exercises to load and expand the card
    await waitFor(() => {
      expect(screen.getByText('Push Ups')).toBeInTheDocument();
    });
    
    // Click to expand and then copy
    fireEvent.click(screen.getByText('Push Ups'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('📋 העתק תרגיל'));
    });
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('עריכת תרגיל לפני העתקה')).toBeInTheDocument();
    });
    
    // Edit the exercise name
    const nameInput = screen.getByDisplayValue('Push Ups');
    fireEvent.change(nameInput, { target: { value: 'Modified Push Ups' } });
    
    // Edit the note
    const noteInput = screen.getByDisplayValue('תרגיל בסיסי לחזה');
    fireEvent.change(noteInput, { target: { value: 'תרגיל מותאם אישית' } });
    
    // Verify changes
    expect(screen.getByDisplayValue('Modified Push Ups')).toBeInTheDocument();
    expect(screen.getByDisplayValue('תרגיל מותאם אישית')).toBeInTheDocument();
  });

  it('should copy exercise with modified data when clicking copy in modal', async () => {
    render(<AdminExerciseBank {...mockProps} />);
    
    // Navigate to edit modal
    await waitFor(() => {
      expect(screen.getByText('Push Ups')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Push Ups'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('📋 העתק תרגיל'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('עריכת תרגיל לפני העתקה')).toBeInTheDocument();
    });
    
    // Modify exercise data
    const nameInput = screen.getByDisplayValue('Push Ups');
    fireEvent.change(nameInput, { target: { value: 'Custom Push Ups' } });
    
    // Click copy button in modal
    const copyButton = screen.getByText('העתק עם השינויים');
    fireEvent.click(copyButton);
    
    // Should call copyAdminExercise with modified data
    await waitFor(() => {
      expect(cachedApiService.copyAdminExercise).toHaveBeenCalledWith(
        'coach123',
        'exercise123',
        'token123',
        expect.objectContaining({
          name: 'Custom Push Ups',
          muscleGroup: 'חזה',
          note: 'תרגיל בסיסי לחזה',
          link: 'https://example.com/video'
        })
      );
    });
  });

  it('should close modal and return to bank after successful copy', async () => {
    render(<AdminExerciseBank {...mockProps} />);
    
    // Navigate to edit modal and copy
    await waitFor(() => {
      expect(screen.getByText('Push Ups')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Push Ups'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('📋 העתק תרגיל'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('עריכת תרגיל לפני העתקה')).toBeInTheDocument();
    });
    
    // Copy the exercise
    fireEvent.click(screen.getByText('העתק עם השינויים'));
    
    // Modal should close and return to bank view
    await waitFor(() => {
      expect(screen.queryByText('עריכת תרגיל לפני העתקה')).not.toBeInTheDocument();
    });
    
    // Should still see the exercise bank
    expect(screen.getByText('Push Ups')).toBeInTheDocument();
  });

  it('should show copy indication on exercise after successful copy', async () => {
    render(<AdminExerciseBank {...mockProps} />);
    
    // Complete the copy flow
    await waitFor(() => {
      expect(screen.getByText('Push Ups')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Push Ups'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('📋 העתק תרגיל'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('העתק עם השינויים'));
    });
    
    // Should show copy indication
    await waitFor(() => {
      expect(screen.getByText('✅ הועתק')).toBeInTheDocument();
    });
    
    // Copy button should be disabled or changed
    expect(screen.queryByText('📋 העתק תרגיל')).not.toBeInTheDocument();
  });

  it('should allow canceling the edit modal', async () => {
    render(<AdminExerciseBank {...mockProps} />);
    
    // Navigate to edit modal
    await waitFor(() => {
      expect(screen.getByText('Push Ups')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Push Ups'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('📋 העתק תרגיל'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('עריכת תרגיל לפני העתקה')).toBeInTheDocument();
    });
    
    // Click cancel button
    fireEvent.click(screen.getByText('ביטול'));
    
    // Modal should close without copying
    await waitFor(() => {
      expect(screen.queryByText('עריכת תרגיל לפני העתקה')).not.toBeInTheDocument();
    });
    
    // Should not have called copy API
    expect(cachedApiService.copyAdminExercise).not.toHaveBeenCalled();
    
    // Should still see the exercise bank
    expect(screen.getByText('Push Ups')).toBeInTheDocument();
  });
});
