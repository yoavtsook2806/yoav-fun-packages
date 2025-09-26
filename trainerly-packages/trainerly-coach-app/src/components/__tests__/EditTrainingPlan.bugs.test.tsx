import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EditTrainingPlan from '../EditTrainingPlan';
import { cachedApiService } from '../../services/cachedApiService';
import { showError, showSuccess } from '../ToastContainer';

// Mock the services and utilities
vi.mock('../../services/cachedApiService');
vi.mock('../ToastContainer');

const mockCachedApiService = vi.mocked(cachedApiService);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

describe('EditTrainingPlan - Bug Fixes', () => {
  const mockProps = {
    coachId: 'coach-123',
    token: 'test-token',
    plan: {
      planId: 'plan-123',
      name: 'Test Plan',
      description: 'Test Description',
      trainings: [
        {
          trainingId: 'training-1',
          name: 'Training 1',
          exercises: [
            {
              exerciseId: 'ex-1',
              name: 'Push ups',
              sets: 3,
              reps: 10,
              weight: 0,
              restTime: 60,
              notes: ''
            }
          ]
        }
      ]
    },
    isOpen: true,
    onClose: vi.fn(),
    onPlanUpdated: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    mockCachedApiService.getTrainingPlan.mockResolvedValue({
      planId: 'plan-123',
      name: 'Test Plan',
      description: 'Test Description',
      trainings: [
        {
          trainingId: 'training-1',
          name: 'Training 1',
          exercises: [
            {
              exerciseId: 'ex-1',
              name: 'Push ups',
              sets: 3,
              reps: 10,
              weight: 0,
              restTime: 60,
              notes: ''
            }
          ]
        }
      ]
    });

    mockCachedApiService.getExercises.mockResolvedValue({
      data: [
        {
          exerciseId: 'ex-1',
          name: 'Push ups',
          muscleGroup: 'Chest',
          coachId: 'coach-123'
        }
      ]
    });
  });

  describe('Bug: Missing Add Training Button', () => {
    it('should show "Add Training" button when there are existing trainings in the plan', async () => {
      render(<EditTrainingPlan {...mockProps} />);

      // Wait for plan to load
      await waitFor(() => {
        expect(screen.getByText('Training 1')).toBeInTheDocument();
      });

      // BUG: Currently there's no "Add Training" button when trainings exist
      // After fix, this should find the button
      expect(screen.getByText('הוסף אימון')).toBeInTheDocument();
    });

    it('should be able to add multiple trainings to the same plan', async () => {
      render(<EditTrainingPlan {...mockProps} />);

      // Wait for plan to load
      await waitFor(() => {
        expect(screen.getByText('Training 1')).toBeInTheDocument();
      });

      // Click add training button
      const addButton = screen.getByText('הוסף אימון');
      fireEvent.click(addButton);

      // Should open training form modal
      expect(screen.getByText('הוספת אימון חדש')).toBeInTheDocument();
    });
  });

  describe('Bug: Empty Edit Training Modal', () => {
    it('should show proper training form when editing a training', async () => {
      render(<EditTrainingPlan {...mockProps} />);

      // Wait for plan to load
      await waitFor(() => {
        expect(screen.getByText('Training 1')).toBeInTheDocument();
      });

      // Click edit button for first training
      const editButton = screen.getByText('✏️');
      fireEvent.click(editButton);

      // Should open training form modal with actual form
      await waitFor(() => {
        expect(screen.getByText('עריכת אימון')).toBeInTheDocument();
      });

      // BUG: Currently shows empty modal with no form
      // After fix, should show training name input
      expect(screen.getByLabelText('שם האימון')).toBeInTheDocument();
    });

    it('should show proper training form when adding a new training', async () => {
      // Test with empty plan first
      const emptyPlanProps = {
        ...mockProps,
        plan: {
          ...mockProps.plan,
          trainings: []
        }
      };

      mockCachedApiService.getTrainingPlan.mockResolvedValue({
        planId: 'plan-123',
        name: 'Test Plan',
        description: 'Test Description',
        trainings: []
      });

      render(<EditTrainingPlan {...emptyPlanProps} />);

      // Wait for plan to load
      await waitFor(() => {
        expect(screen.getByText('אין אימונים בתוכנית עדיין')).toBeInTheDocument();
      });

      // Click add first training button
      const addFirstButton = screen.getByText('הוסף אימון ראשון');
      fireEvent.click(addFirstButton);

      // Should open training form modal with actual form
      await waitFor(() => {
        expect(screen.getByText('הוספת אימון חדש')).toBeInTheDocument();
      });

      // BUG: Currently shows empty modal with no form
      // After fix, should show training name input
      expect(screen.getByLabelText('שם האימון')).toBeInTheDocument();
    });

    it('should be able to save training changes in the edit modal', async () => {
      render(<EditTrainingPlan {...mockProps} />);

      // Wait for plan to load
      await waitFor(() => {
        expect(screen.getByText('Training 1')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByText('✏️');
      fireEvent.click(editButton);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText('עריכת אימון')).toBeInTheDocument();
      });

      // Change training name
      const nameInput = screen.getByLabelText('שם האימון');
      fireEvent.change(nameInput, { target: { value: 'Updated Training Name' } });

      // Save changes
      const saveButton = screen.getByText('שמור אימון');
      fireEvent.click(saveButton);

      // Should close modal and update the training name in the list
      await waitFor(() => {
        expect(screen.queryByText('עריכת אימון')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Updated Training Name')).toBeInTheDocument();
    });
  });
});
