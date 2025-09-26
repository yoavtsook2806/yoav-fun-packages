/**
 * Test for exercise update bug - should accept muscleGroup instead of short
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { updateExercise } from '../../src/handlers/exercises';

// Mock the database
jest.mock('../../src/services/database', () => ({
  db: {
    getExercise: jest.fn(),
    getExercisesByCoach: jest.fn(),
    updateExercise: jest.fn(),
  }
}));

import { db } from '../../src/services/database';

describe('Exercise Update Bug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept muscleGroup instead of short when updating exercise', async () => {
    // Mock existing exercise
    const existingExercise = {
      exerciseId: 'test-exercise-id',
      coachId: 'test-coach-id',
      name: 'Old Exercise Name',
      muscleGroup: 'חזה אמצעי',
      note: 'Old note',
      link: 'https://old-link.com',
      createdAt: '2024-01-01T00:00:00Z'
    };

    (db.getExercise as jest.Mock).mockResolvedValue(existingExercise);
    (db.getExercisesByCoach as jest.Mock).mockResolvedValue([]); // No duplicate exercises
    (db.updateExercise as jest.Mock).mockResolvedValue(true);

    // Create event with new muscleGroup structure (no 'short' field)
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        coachId: 'test-coach-id',
        exerciseId: 'test-exercise-id'
      },
      body: JSON.stringify({
        name: 'Updated Exercise Name',
        muscleGroup: 'ירך קדמי', // New muscle group format
        note: 'Updated note',
        link: 'https://updated-link.com'
      })
    };

    // This should NOT fail - it should accept muscleGroup instead of short
    const result = await updateExercise(event as APIGatewayProxyEvent);

    // Should succeed (status 200), not fail with validation error
    expect(result.statusCode).toBe(200);
    
    // Should not contain the old error message about "short description"
    if (result.statusCode !== 200) {
      const body = JSON.parse(result.body);
      expect(body.message).not.toContain('short description are required');
    }

    // Verify the exercise was updated with muscleGroup
    expect(db.updateExercise).toHaveBeenCalledWith(
      expect.objectContaining({
        exerciseId: 'test-exercise-id',
        name: 'Updated Exercise Name',
        muscleGroup: 'ירך קדמי',
        note: 'Updated note',
        link: 'https://updated-link.com'
      })
    );
  });

  it('should fail validation when name is missing', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        coachId: 'test-coach-id',
        exerciseId: 'test-exercise-id'
      },
      body: JSON.stringify({
        muscleGroup: 'ירך קדמי',
        note: 'Some note'
      })
    };

    const result = await updateExercise(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toContain('Name and muscle group are required');
  });

  it('should fail validation when muscleGroup is missing', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        coachId: 'test-coach-id',
        exerciseId: 'test-exercise-id'
      },
      body: JSON.stringify({
        name: 'Exercise Name',
        note: 'Some note'
      })
    };

    const result = await updateExercise(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toContain('Name and muscle group are required');
  });
});
