import AWS from 'aws-sdk-mock';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as exercises from '../../src/handlers/exercises';
import '../jest-matchers';

describe('Exercise Management API', () => {
  let mockDynamoGet: jest.Mock;
  let mockDynamoPut: jest.Mock;
  let mockDynamoScan: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDynamoGet = jest.fn();
    mockDynamoPut = jest.fn();
    mockDynamoScan = jest.fn();
    
    AWS.mock('DynamoDB.DocumentClient', 'get', mockDynamoGet);
    AWS.mock('DynamoDB.DocumentClient', 'put', mockDynamoPut);
    AWS.mock('DynamoDB.DocumentClient', 'scan', mockDynamoScan);
  });

  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
  });

  describe('POST /coaches/{coachId}/exercises', () => {
    it('should create exercise successfully with all fields', async () => {
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/exercises',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify({
          name: 'פרפר, מ. יד/מכונה',
          link: 'https://www.youtube.com/watch?v=example',
          note: 'מרפקים מעט מכופפים, חזה פתוח',
          short: 'פרפר',
          muscleGroup: 'chest'
        })
      };

      const result = await exercises.createExercise(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      
      expect(body.exerciseId).toBeValidUUID();
      
      // Just verify the response contains a valid exercise ID for now
      // TODO: Implement proper database mocking verification
    });

    it('should create exercise with minimal required fields', async () => {
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/exercises',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify({
          name: 'לחיצת חזה',
          short: 'חזה'
        })
      };

      const result = await exercises.createExercise(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.exerciseId).toBeValidUUID();
    });

    it('should validate required fields', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/exercises',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify({
          name: 'לחיצת חזה'
          // missing short
        })
      };

      const result = await exercises.createExercise(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Name and short description are required');
    });

    it('should require coachId in path', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches//exercises',
        pathParameters: null,
        body: JSON.stringify({
          name: 'לחיצת חזה',
          short: 'חזה'
        })
      };

      const result = await exercises.createExercise(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Coach ID is required');
    });
  });

  describe('GET /coaches/{coachId}/exercises', () => {
    const mockExercises = [
      {
        exerciseId: 'exercise-1',
        coachId: 'coach-id',
        name: 'פרפר, מ. יד/מכונה',
        link: 'https://www.youtube.com/watch?v=example1',
        note: 'מרפקים מעט מכופפים',
        short: 'פרפר',
        muscleGroup: 'chest',
        createdAt: '2023-01-01T00:00:00.000Z'
      },
      {
        exerciseId: 'exercise-2',
        coachId: 'coach-id',
        name: 'לחיצת רגליים',
        link: 'https://www.youtube.com/watch?v=example2',
        note: 'גב תחתון צמוד',
        short: 'רגליים',
        muscleGroup: 'legs',
        createdAt: '2023-01-02T00:00:00.000Z'
      },
      {
        exerciseId: 'exercise-3',
        coachId: 'coach-id',
        name: 'AB ROLLOUT',
        short: 'בטן',
        muscleGroup: 'core',
        createdAt: '2023-01-03T00:00:00.000Z'
      }
    ];

    it('should list all exercises for coach', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: mockExercises });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/coach-id/exercises',
        pathParameters: { coachId: 'coach-id' }
      };

      const result = await exercises.listExercises(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      expect(body.items).toHaveLength(3);
      
      // Check first exercise with all fields
      expect(body.items[0]).toEqual({
        exerciseId: 'exercise-1',
        name: 'פרפר, מ. יד/מכונה',
        link: 'https://www.youtube.com/watch?v=example1',
        note: 'מרפקים מעט מכופפים',
        short: 'פרפר',
        muscleGroup: 'chest',
        createdAt: '2023-01-01T00:00:00.000Z'
      });
      
      // Check exercise with minimal fields
      expect(body.items[2]).toEqual({
        exerciseId: 'exercise-3',
        name: 'AB ROLLOUT',
        link: undefined,
        note: undefined,
        short: 'בטן',
        muscleGroup: 'core',
        createdAt: '2023-01-03T00:00:00.000Z'
      });
    });

    it('should return empty array for coach with no exercises', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/coach-id/exercises',
        pathParameters: { coachId: 'coach-id' }
      };

      const result = await exercises.listExercises(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.items).toEqual([]);
    });

    it('should filter exercises by coachId', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        // Verify the filter is applied correctly
        expect(params.FilterExpression).toBe('coachId = :coachId');
        expect(params.ExpressionAttributeValues[':coachId']).toBe('coach-id');
        callback(null, { Items: mockExercises });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/coach-id/exercises',
        pathParameters: { coachId: 'coach-id' }
      };

      await exercises.listExercises(
        event as APIGatewayProxyEvent
      );

      expect(mockDynamoScan).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: expect.stringContaining('exercises'),
          FilterExpression: 'coachId = :coachId',
          ExpressionAttributeValues: { ':coachId': 'coach-id' }
        }),
        expect.any(Function)
      );
    });
  });

  describe('Exercise Data Structure Validation', () => {
    it('should handle Hebrew exercise names correctly', async () => {
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const hebrewExercises = [
        'פרפר, מ. יד/מכונה',
        'לחיצת חזה, מ. יד, שיפוע 30*',
        'משיכה בפולי עליון, ניטרלי',
        'הרחקות אופקיות, שיפוע 30*, מ. יד',
        'כפיפת מרפק בשיפוע 60*, סופינציה'
      ];

      for (const exerciseName of hebrewExercises) {
        const event: Partial<APIGatewayProxyEvent> = {
          httpMethod: 'POST',
          path: '/coaches/coach-id/exercises',
          pathParameters: { coachId: 'coach-id' },
          body: JSON.stringify({
            name: exerciseName,
            short: 'תרגיל'
          })
        };

        const result = await exercises.createExercise(
          event as APIGatewayProxyEvent
        );

        expect(result.statusCode).toBe(201);
      }
    });

    it('should handle special characters in exercise data', async () => {
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/exercises',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify({
          name: 'לחיצת חזה, מ. יד, שיפוע 30*',
          link: 'https://www.youtube.com/watch?v=QDKxHpMQxlY&list=PLQaATYNsaV4VVx7I8HxsrFZAppDjvdxkp&index=16',
          note: 'מרפקים מעט מכופפים, חזה פתוח. לרדת בשליטה למתיחה יפה ולעלות חזרה עד שהמשקולות מעל הכתפיים',
          short: 'חזה'
        })
      };

      const result = await exercises.createExercise(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      
      // Verify the data was stored correctly with all special characters
      const savedData = mockDynamoPut.mock.calls[0][0].Item;
      expect(savedData.name).toBe('לחיצת חזה, מ. יד, שיפוע 30*');
      expect(savedData.link).toContain('youtube.com');
      expect(savedData.note).toContain('מרפקים מעט מכופפים');
    });

    it('should handle empty optional fields correctly', async () => {
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/exercises',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify({
          name: 'תרגיל חדש',
          short: 'חדש',
          link: '',
          note: '',
          muscleGroup: null
        })
      };

      const result = await exercises.createExercise(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      
      const savedData = mockDynamoPut.mock.calls[0][0].Item;
      expect(savedData.name).toBe('תרגיל חדש');
      expect(savedData.short).toBe('חדש');
      expect(savedData.link).toBe('');
      expect(savedData.note).toBe('');
      expect(savedData.muscleGroup).toBeNull();
    });
  });
});
