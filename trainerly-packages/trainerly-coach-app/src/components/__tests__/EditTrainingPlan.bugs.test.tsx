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
      trainingsCount: 1,
      createdAt: '2023-01-01T00:00:00.000Z'
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
      coachId: 'coach-123',
      name: 'Test Plan',
      description: 'Test Description',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      trainings: [
        {
          trainingId: 'training-1',
          name: 'Training 1',
          order: 0,
          exercises: [
            {
              exerciseId: 'ex-1',
              exerciseName: 'Push ups',
              name: 'Push ups',
              muscleGroup: 'Chest',
              numberOfSets: 3,
              minimumNumberOfRepeasts: 10,
              maximumNumberOfRepeasts: 10,
              minimumTimeToRest: 60,
              maximumTimeToRest: 60,
              prescriptionNote: ''
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
          coachId: 'coach-123',
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      ],
      fromCache: false,
      timestamp: Date.now()
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

      // Should show full training form with exercise selection
      expect(screen.getByLabelText('שם האימון *')).toBeInTheDocument();
      expect(screen.getByText('בחר תרגילים מהספרייה:')).toBeInTheDocument();
      expect(screen.getByText('תרגילים שנבחרו:')).toBeInTheDocument();
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
        coachId: 'coach-123',
        name: 'Test Plan',
        description: 'Test Description',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
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

      // Should show full training form with exercise selection
      expect(screen.getByLabelText('שם האימון *')).toBeInTheDocument();
      expect(screen.getByText('בחר תרגילים מהספרייה:')).toBeInTheDocument();
      expect(screen.getByText('תרגילים שנבחרו:')).toBeInTheDocument();
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
      const nameInput = screen.getByLabelText('שם האימון *');
      fireEvent.change(nameInput, { target: { value: 'Updated Training Name' } });

      // Note: Save button should be disabled initially since no exercises are selected
      // For this test, we'll add an exercise first
      const addExerciseButton = screen.getByText('➕');
      fireEvent.click(addExerciseButton);

      // Now save changes
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
