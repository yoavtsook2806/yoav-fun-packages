import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TraineeTrainingHistoryModal from '../TraineeTrainingHistory';
import { testScenarios } from '@testkit';

// Mock the API service
vi.mock('../../services/cachedApiService', () => ({
  cachedApiService: {
    getTraineeExerciseSessions: vi.fn(),
  },
}));

describe('TraineeTrainingHistoryModal (Simple Test)', () => {
  const mockTrainee = testScenarios.traineeWithProgressScenario.trainee;
  const mockCoachId = mockTrainee.coachId;
  const mockToken = 'mock-token';
  const mockOnClose = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    const { cachedApiService } = await import('../../services/cachedApiService');
    vi.mocked(cachedApiService.getTraineeExerciseSessions).mockResolvedValue({
      data: testScenarios.traineeWithProgressScenario.sessions,
      fromCache: false,
      timestamp: Date.now()
    });
  });

  it('renders the modal when open and displays training groups', async () => {
    render(
      <TraineeTrainingHistoryModal
        trainee={mockTrainee}
        coachId={mockCoachId}
        token={mockToken}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/נתוני אימונים - דני רוזן/)).toBeInTheDocument();
      expect(screen.getByText('אימון A')).toBeInTheDocument();
      expect(screen.getByText('סקוואט')).toBeInTheDocument();
    });
  });

  it('displays exercise history when an exercise is clicked', async () => {
    render(
      <TraineeTrainingHistoryModal
        trainee={mockTrainee}
        coachId={mockCoachId}
        token={mockToken}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('סקוואט')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('סקוואט'));

    await waitFor(() => {
      expect(screen.getByText(/היסטוריית סקוואט/)).toBeInTheDocument();
      expect(screen.getByText('60 ק"ג')).toBeInTheDocument();
      expect(screen.getAllByText('10')).toHaveLength(2); // Two entries with 10 repeats
    });
  });
});
