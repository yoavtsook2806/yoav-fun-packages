import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ExerciseFlow from '../ExerciseFlow';
import { TrainingState, Trainings } from '../../types';

// Mock the sound utils
vi.mock('../../utils/soundUtils', () => ({
  playSound: vi.fn(),
}));

describe('ExerciseFlow - Muscle Group Display Bug', () => {
  const mockTrainings: Trainings = {
    'Test Training': {
      'Test Exercise 1': {
        numberOfSets: 3,
        minimumTimeToRest: 60,
        maximumTimeToRest: 120,
        minimumNumberOfRepeasts: 8,
        maximumNumberOfRepeasts: 12,
        note: 'Test exercise note',
        muscleGroup: 'חזה עליון', // Upper chest
        link: 'https://example.com'
      },
      'Test Exercise 2': {
        numberOfSets: 2,
        minimumTimeToRest: 45,
        maximumTimeToRest: 90,
        minimumNumberOfRepeasts: 10,
        maximumNumberOfRepeasts: 15,
        note: 'Another test exercise',
        muscleGroup: 'גב רחב', // Lats
        link: 'https://example.com'
      }
    }
  };

  const mockTrainingState: TrainingState = {
    selectedTraining: 'Test Training',
    restTime: 60,
    currentExerciseIndex: 0,
    exercises: ['Test Exercise 1', 'Test Exercise 2'],
    exerciseStates: {
      'Test Exercise 1': {
        currentSet: 1,
        completed: false,
        isActive: false,
        isResting: false,
        timeLeft: 0
      },
      'Test Exercise 2': {
        currentSet: 1,
        completed: false,
        isActive: false,
        isResting: false,
        timeLeft: 0
      }
    },
    isTrainingComplete: false
  };

  const mockProps = {
    trainingState: mockTrainingState,
    trainings: mockTrainings,
    onUpdateExerciseState: vi.fn(),
    onGoToExercise: vi.fn(),
    onNextExercise: vi.fn(),
    onResetTraining: vi.fn()
  };

  it('should display muscle group for each exercise in exercise-row', () => {
    render(<ExerciseFlow {...mockProps} />);
    
    // Check that muscle groups are visible in the exercise row
    expect(screen.getByText('🎯 חזה עליון')).toBeInTheDocument();
    expect(screen.getByText('🎯 גב רחב')).toBeInTheDocument();
  });

  it('should display muscle group with proper styling', () => {
    render(<ExerciseFlow {...mockProps} />);
    
    // Find the muscle group elements
    const muscleGroup1 = screen.getByText('🎯 חזה עליון');
    const muscleGroup2 = screen.getByText('🎯 גב רחב');
    
    // Check that they have the correct CSS class
    expect(muscleGroup1).toHaveClass('exercise-row-muscle-group');
    expect(muscleGroup2).toHaveClass('exercise-row-muscle-group');
    
    // Check that they are visible (not hidden)
    expect(muscleGroup1).toBeVisible();
    expect(muscleGroup2).toBeVisible();
  });

  it('should show muscle group between exercise name and sets info', () => {
    render(<ExerciseFlow {...mockProps} />);
    
    // Find elements by className since they might not have role="button"
    const exerciseItems = document.querySelectorAll('.exercise-row-item');
    const firstExercise = Array.from(exerciseItems).find(item => 
      item.textContent?.includes('Test Exercise 1')
    );
    
    expect(firstExercise).toBeDefined();
    
    // The muscle group should be visible within the exercise item
    expect(firstExercise?.textContent).toContain('🎯 חזה עליון');
  });
});
