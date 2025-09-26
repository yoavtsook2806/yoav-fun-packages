import { APIGatewayProxyEvent } from 'aws-lambda';
import { createExerciseSession, getExerciseSessions, getTrainerExerciseSessions } from '../../src/handlers/exercise-sessions';
import '../jest-matchers';

describe('Exercise Sessions API', () => {
  const mockCoachId = 'coach-123';
  const mockTrainerId = 'trainer-456';

  beforeEach(async () => {
    // Create a mock coach and trainer for testing
    const { db } = await import('../../src/services/database');
    
    await db.saveCoach({
      coachId: mockCoachId,
      email: 'test@example.com',
      nickname: 'testcoach',
      firstName: 'Test',
      lastName: 'Coach',
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await db.saveTrainer({
      trainerId: mockTrainerId,
      coachId: mockCoachId,
      firstName: 'Test',
      lastName: 'Trainee',
      email: 'trainee@example.com',
      plans: [],
      createdAt: new Date().toISOString()
    });
  });

  describe('createExerciseSession', () => {
    it('should create exercise session successfully', async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: { trainerId: mockTrainerId },
        body: JSON.stringify({
          exerciseName: 'Push ups',
          trainingType: 'A',
          completedAt: new Date().toISOString(),
          totalSets: 3,
          completedSets: 3,
          setsData: [
            { weight: 0, repeats: 10 },
            { weight: 0, repeats: 12 },
            { weight: 0, repeats: 8 }
          ],
          restTime: 60
        }),
        httpMethod: 'POST',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        path: `/trainers/${mockTrainerId}/exercise-sessions`,
        resource: '/trainers/{trainerId}/exercise-sessions',
        requestContext: {} as any,
        stageVariables: null,
        isBase64Encoded: false
      };

      const result = await createExerciseSession(event);

      expect(result.statusCode).toBe(201);
      const response = JSON.parse(result.body);
      expect(response.sessionId).toBeValidUUID();
    });

    it('should return 400 for missing trainerId', async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: null,
        body: JSON.stringify({
          exerciseName: 'Push ups',
          trainingType: 'A',
          completedAt: new Date().toISOString(),
          totalSets: 3,
          completedSets: 3
        }),
        httpMethod: 'POST',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        path: '/trainers//exercise-sessions',
        resource: '/trainers/{trainerId}/exercise-sessions',
        requestContext: {} as any,
        stageVariables: null,
        isBase64Encoded: false
      };

      const result = await createExerciseSession(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe('VALIDATION_ERROR');
      expect(response.message).toBe('Trainer ID is required');
    });

    it('should return 400 for missing required fields', async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: { trainerId: mockTrainerId },
        body: JSON.stringify({
          exerciseName: 'Push ups'
          // Missing required fields
        }),
        httpMethod: 'POST',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        path: `/trainers/${mockTrainerId}/exercise-sessions`,
        resource: '/trainers/{trainerId}/exercise-sessions',
        requestContext: {} as any,
        stageVariables: null,
        isBase64Encoded: false
      };

      const result = await createExerciseSession(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Missing required fields');
    });
  });

  describe('getExerciseSessions', () => {
    it('should return exercise sessions for trainee', async () => {
      // First create a session
      const createEvent: APIGatewayProxyEvent = {
        pathParameters: { trainerId: mockTrainerId },
        body: JSON.stringify({
          exerciseName: 'Squats',
          trainingType: 'B',
          completedAt: new Date().toISOString(),
          totalSets: 4,
          completedSets: 4,
          setsData: [
            { weight: 60, repeats: 8 },
            { weight: 60, repeats: 8 },
            { weight: 60, repeats: 6 },
            { weight: 60, repeats: 6 }
          ]
        }),
        httpMethod: 'POST',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        path: `/trainers/${mockTrainerId}/exercise-sessions`,
        resource: '/trainers/{trainerId}/exercise-sessions',
        requestContext: {} as any,
        stageVariables: null,
        isBase64Encoded: false
      };

      await createExerciseSession(createEvent);

      // Then get sessions
      const getEvent: APIGatewayProxyEvent = {
        pathParameters: { trainerId: mockTrainerId },
        body: null,
        httpMethod: 'GET',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        path: `/trainers/${mockTrainerId}/exercise-sessions`,
        resource: '/trainers/{trainerId}/exercise-sessions',
        requestContext: {} as any,
        stageVariables: null,
        isBase64Encoded: false
      };

      const result = await getExerciseSessions(getEvent);

      expect(result.statusCode).toBe(200);
      const response = JSON.parse(result.body);
      expect(response.items).toHaveLength(1);
      expect(response.items[0].exerciseName).toBe('Squats');
      expect(response.items[0].trainingType).toBe('B');
      expect(response.items[0].totalSets).toBe(4);
      expect(response.items[0].completedSets).toBe(4);
    });

    it('should return 404 for non-existent trainee', async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: { trainerId: 'non-existent' },
        body: null,
        httpMethod: 'GET',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        path: '/trainers/non-existent/exercise-sessions',
        resource: '/trainers/{trainerId}/exercise-sessions',
        requestContext: {} as any,
        stageVariables: null,
        isBase64Encoded: false
      };

      const result = await getExerciseSessions(event);

      expect(result.statusCode).toBe(404);
      const response = JSON.parse(result.body);
      expect(response.error).toBe('NOT_FOUND');
      expect(response.message).toBe('Trainer not found');
    });
  });

  describe('getTrainerExerciseSessions', () => {
    it('should return exercise sessions for coach view', async () => {
      // First create a session
      const createEvent: APIGatewayProxyEvent = {
        pathParameters: { trainerId: mockTrainerId },
        body: JSON.stringify({
          exerciseName: 'Bench Press',
          trainingType: 'A',
          completedAt: new Date().toISOString(),
          totalSets: 3,
          completedSets: 2,
          setsData: [
            { weight: 80, repeats: 8 },
            { weight: 80, repeats: 6 }
          ]
        }),
        httpMethod: 'POST',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        path: `/trainers/${mockTrainerId}/exercise-sessions`,
        resource: '/trainers/{trainerId}/exercise-sessions',
        requestContext: {} as any,
        stageVariables: null,
        isBase64Encoded: false
      };

      await createExerciseSession(createEvent);

      // Then get sessions from coach view
      const getEvent: APIGatewayProxyEvent = {
        pathParameters: { 
          coachId: mockCoachId,
          trainerId: mockTrainerId 
        },
        body: null,
        httpMethod: 'GET',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        path: `/coaches/${mockCoachId}/trainers/${mockTrainerId}/exercise-sessions`,
        resource: '/coaches/{coachId}/trainers/{trainerId}/exercise-sessions',
        requestContext: {} as any,
        stageVariables: null,
        isBase64Encoded: false
      };

      const result = await getTrainerExerciseSessions(getEvent);

      expect(result.statusCode).toBe(200);
      const response = JSON.parse(result.body);
      expect(response.items).toHaveLength(1);
      expect(response.items[0].exerciseName).toBe('Bench Press');
      expect(response.items[0].coachId).toBe(mockCoachId);
    });

    it('should return 403 if trainee does not belong to coach', async () => {
      const wrongCoachId = 'wrong-coach-123';
      
      // Create wrong coach
      const { db } = await import('../../src/services/database');
      await db.saveCoach({
        coachId: wrongCoachId,
        email: 'wrong@example.com',
        nickname: 'wrongcoach',
        firstName: 'Wrong',
        lastName: 'Coach',
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const event: APIGatewayProxyEvent = {
        pathParameters: { 
          coachId: wrongCoachId,
          trainerId: mockTrainerId 
        },
        body: null,
        httpMethod: 'GET',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        path: `/coaches/${wrongCoachId}/trainers/${mockTrainerId}/exercise-sessions`,
        resource: '/coaches/{coachId}/trainers/{trainerId}/exercise-sessions',
        requestContext: {} as any,
        stageVariables: null,
        isBase64Encoded: false
      };

      const result = await getTrainerExerciseSessions(event);

      expect(result.statusCode).toBe(403);
      const response = JSON.parse(result.body);
      expect(response.error).toBe('FORBIDDEN');
      expect(response.message).toBe('Trainer does not belong to this coach');
    });
  });
});
