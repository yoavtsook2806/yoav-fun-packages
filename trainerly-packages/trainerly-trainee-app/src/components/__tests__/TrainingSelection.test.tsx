import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TrainingSelection from '../TrainingSelection'
import { testScenarios } from '@testkit'

describe('TrainingSelection', () => {
  const mockTrainingPlan = testScenarios.fullCoachScenario.trainingPlans[0]
  const mockProps = {
    onSelectTraining: vi.fn(),
    availableTrainings: ['A', 'B'],
    trainings: mockTrainingPlan.trainings,
    trainerName: 'דני רוזן',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('displays trainerly logo', () => {
      render(<TrainingSelection {...mockProps} />)
      
      const logo = screen.getByAltText('Trainerly')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', '/TrainerlyLogo.png')
    })

    it('shows available training options', () => {
      render(<TrainingSelection {...mockProps} />)
      
      // Should show training A and B buttons
      expect(screen.getByText('אימון A')).toBeInTheDocument()
      expect(screen.getByText('אימון B')).toBeInTheDocument()
    })

    it('shows start training button', () => {
      render(<TrainingSelection {...mockProps} />)
      
      const startButton = screen.getByText('התחל אימון')
      expect(startButton).toBeInTheDocument()
      expect(startButton).toBeDisabled() // Should be disabled when no training selected
    })

    it('displays completion counts for trainings', () => {
      render(<TrainingSelection {...mockProps} />)
      
      // Should show completion counts (0× initially)
      const completionCounts = screen.getAllByText(/\d+×/)
      expect(completionCounts.length).toBeGreaterThan(0)
    })
  })

  describe('Training Selection', () => {
    it('selects training when training A button is clicked', async () => {
      const user = userEvent.setup()
      render(<TrainingSelection {...mockProps} />)
      
      const trainingAButton = screen.getByText('אימון A').closest('button')
      await user.click(trainingAButton!)
      
      // Training should be selected (button should have selected class)
      expect(trainingAButton).toHaveClass('selected')
    })

    it('enables start button when training is selected', async () => {
      const user = userEvent.setup()
      render(<TrainingSelection {...mockProps} />)
      
      const trainingAButton = screen.getByText('אימון A')
      const startButton = screen.getByText('התחל אימון')
      
      // Initially disabled
      expect(startButton).toBeDisabled()
      
      // Select training
      await user.click(trainingAButton)
      
      // Should be enabled now
      expect(startButton).toBeEnabled()
    })

    it('calls onSelectTraining when start button is clicked', async () => {
      const user = userEvent.setup()
      render(<TrainingSelection {...mockProps} />)
      
      const trainingAButton = screen.getByText('אימון A')
      const startButton = screen.getByText('התחל אימון')
      
      // Select training
      await user.click(trainingAButton)
      
      // Start training
      await user.click(startButton)
      
      expect(mockProps.onSelectTraining).toHaveBeenCalledWith('A')
    })
  })

  describe('Advanced Training Plan', () => {
    it('displays all training types when provided', () => {
      const advancedProps = {
        ...mockProps,
        availableTrainings: ['A', 'B', 'C'],
        trainings: {
          ...mockTrainingPlan.trainings,
          'C': mockTrainingPlan.trainings['A'] // Add training C
        }
      }
      
      render(<TrainingSelection {...advancedProps} />)
      
      expect(screen.getByText('אימון A')).toBeInTheDocument()
      expect(screen.getByText('אימון B')).toBeInTheDocument()
      expect(screen.getByText('אימון C')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('handles empty training list gracefully', () => {
      const emptyProps = {
        ...mockProps,
        availableTrainings: [],
        trainings: {}
      }
      
      render(<TrainingSelection {...emptyProps} />)
      
      // Should still render basic elements
      expect(screen.getByAltText('Trainerly')).toBeInTheDocument()
      expect(screen.getByText('התחל אימון')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders properly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<TrainingSelection {...mockProps} />)
      
      // Should render all key elements
      expect(screen.getByAltText('Trainerly')).toBeInTheDocument()
      expect(screen.getByText('אימון A')).toBeInTheDocument()
      expect(screen.getByText('אימון B')).toBeInTheDocument()
    })
  })
})
