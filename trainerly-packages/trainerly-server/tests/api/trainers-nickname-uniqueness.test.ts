import { APIGatewayProxyEvent } from 'aws-lambda';
import { createTrainer } from '../../src/handlers/trainers';
import { Trainer } from '../../src/types';

// Mock the database
jest.mock('../../src/services/database', () => ({
  db: {
    getTrainersByCoach: jest.fn(),
    saveTrainer: jest.fn(),
  }
}));

import { db } from '../../src/services/database';

describe('Trainer Nickname Uniqueness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow creating trainer with unique nickname', async () => {
    // Mock empty trainers list for this coach
    (db.getTrainersByCoach as jest.Mock).mockResolvedValue([]);
    (db.saveTrainer as jest.Mock).mockResolvedValue(true);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        coachId: 'test-coach-id'
      },
      body: JSON.stringify({
        nickname: 'יוסי123',
        email: 'yossi@example.com'
      }),
      httpMethod: 'POST'
    };

    const result = await createTrainer(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(201);
    expect(db.saveTrainer).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: 'יוסי123',
        coachId: 'test-coach-id',
        email: 'yossi@example.com'
      })
    );
  });

  it('should reject creating trainer with duplicate nickname for same coach', async () => {
    // Mock existing trainer with same nickname
    const existingTrainers: Trainer[] = [
      {
        trainerId: 'existing-trainer-id',
        coachId: 'test-coach-id',
        nickname: 'יוסי123',
        email: 'existing@example.com',
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];
    
    (db.getTrainersByCoach as jest.Mock).mockResolvedValue(existingTrainers);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        coachId: 'test-coach-id'
      },
      body: JSON.stringify({
        nickname: 'יוסי123', // Same nickname
        email: 'new@example.com'
      }),
      httpMethod: 'POST'
    };

    const result = await createTrainer(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('NICKNAME_TAKEN');
    expect(body.message).toBe('Nickname already exists for this coach');
    expect(db.saveTrainer).not.toHaveBeenCalled();
  });

  it('should allow same nickname for different coaches', async () => {
    // Mock empty trainers list for this coach (different coach)
    (db.getTrainersByCoach as jest.Mock).mockResolvedValue([]);
    (db.saveTrainer as jest.Mock).mockResolvedValue(true);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        coachId: 'different-coach-id' // Different coach
      },
      body: JSON.stringify({
        nickname: 'יוסי123', // Same nickname but different coach
        email: 'yossi2@example.com'
      }),
      httpMethod: 'POST'
    };

    const result = await createTrainer(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(201);
    expect(db.saveTrainer).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: 'יוסי123',
        coachId: 'different-coach-id',
        email: 'yossi2@example.com'
      })
    );
  });

  it('should be case-insensitive when checking nickname uniqueness', async () => {
    // Mock existing trainer with lowercase nickname
    const existingTrainers: Trainer[] = [
      {
        trainerId: 'existing-trainer-id',
        coachId: 'test-coach-id',
        nickname: 'יוסי123',
        email: 'existing@example.com',
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];
    
    (db.getTrainersByCoach as jest.Mock).mockResolvedValue(existingTrainers);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        coachId: 'test-coach-id'
      },
      body: JSON.stringify({
        nickname: 'יוסי123', // Same nickname with different case
        email: 'new@example.com'
      }),
      httpMethod: 'POST'
    };

    const result = await createTrainer(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('NICKNAME_TAKEN');
  });

  it('should require nickname field', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {
        coachId: 'test-coach-id'
      },
      body: JSON.stringify({
        email: 'test@example.com'
        // Missing nickname
      }),
      httpMethod: 'POST'
    };

    const result = await createTrainer(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toBe('Nickname is required');
  });
});
