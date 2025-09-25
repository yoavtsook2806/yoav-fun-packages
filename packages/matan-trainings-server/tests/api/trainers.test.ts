import AWS from 'aws-sdk-mock';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as trainers from '../../src/handlers/trainers';

describe('Trainer Management API', () => {
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

  describe('POST /coaches/{coachId}/trainers', () => {
    it('should create trainer successfully', async () => {
      // Mock: trainer code doesn't exist (for uniqueness check)
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });
      
      // Mock: successful save
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/trainers',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify({
          firstName: 'יוסי',
          lastName: 'כהן',
          email: 'yossi@example.com'
        })
      };

      const result = await trainers.createTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      
      expect(body.trainerId).toBeValidUUID();
      
      // Verify DynamoDB save was called with correct data
      expect(mockDynamoPut).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: expect.stringContaining('trainers'),
          Item: expect.objectContaining({
            coachId: 'coach-id',
            firstName: 'יוסי',
            lastName: 'כהן',
            email: 'yossi@example.com',
            trainerCode: expect.any(String)
          })
        }),
        expect.any(Function)
      );
    });

    it('should validate required fields', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/trainers',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify({
          firstName: 'יוסי'
          // missing lastName
        })
      };

      const result = await trainers.createTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('First name and last name are required');
    });

    it('should require coachId in path', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches//trainers',
        pathParameters: null,
        body: JSON.stringify({
          firstName: 'יוסי',
          lastName: 'כהן'
        })
      };

      const result = await trainers.createTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Coach ID is required');
    });
  });

  describe('GET /coaches/{coachId}/trainers', () => {
    const mockTrainers = [
      {
        trainerId: 'trainer-1',
        coachId: 'coach-id',
        firstName: 'יוסי',
        lastName: 'כהן',
        email: 'yossi@example.com',
        trainerCode: 'ABC123',
        createdAt: '2023-01-01T00:00:00.000Z'
      },
      {
        trainerId: 'trainer-2',
        coachId: 'coach-id',
        firstName: 'שרה',
        lastName: 'לוי',
        trainerCode: 'DEF456',
        createdAt: '2023-01-02T00:00:00.000Z'
      }
    ];

    it('should list trainers for coach', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: mockTrainers });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/coach-id/trainers',
        pathParameters: { coachId: 'coach-id' }
      };

      const result = await trainers.listTrainers(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      expect(body.items).toHaveLength(2);
      expect(body.items[0]).toEqual({
        trainerId: 'trainer-1',
        firstName: 'יוסי',
        lastName: 'כהן',
        email: 'yossi@example.com',
        createdAt: '2023-01-01T00:00:00.000Z'
      });
      expect(body.items[1]).toEqual({
        trainerId: 'trainer-2',
        firstName: 'שרה',
        lastName: 'לוי',
        email: undefined,
        createdAt: '2023-01-02T00:00:00.000Z'
      });
      
      // Should not include sensitive data like trainerCode
      expect(body.items[0].trainerCode).toBeUndefined();
    });

    it('should return empty array for coach with no trainers', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/coach-id/trainers',
        pathParameters: { coachId: 'coach-id' }
      };

      const result = await trainers.listTrainers(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.items).toEqual([]);
    });
  });

  describe('GET /trainers/{trainerId}', () => {
    const mockTrainer = {
      trainerId: 'trainer-1',
      coachId: 'coach-id',
      firstName: 'יוסי',
      lastName: 'כהן',
      email: 'yossi@example.com',
      trainerCode: 'ABC123',
      createdAt: '2023-01-01T00:00:00.000Z'
    };

    it('should return trainer details', async () => {
      mockDynamoGet.mockImplementation((params: any, callback: any) => {
        callback(null, { Item: mockTrainer });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/trainers/trainer-1',
        pathParameters: { trainerId: 'trainer-1' }
      };

      const result = await trainers.getTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      expect(body).toEqual({
        trainerId: 'trainer-1',
        coachId: 'coach-id',
        firstName: 'יוסי',
        lastName: 'כהן',
        email: 'yossi@example.com',
        createdAt: '2023-01-01T00:00:00.000Z'
      });
      
      // Should not include trainerCode in public response
      expect(body.trainerCode).toBeUndefined();
    });

    it('should return 404 for non-existent trainer', async () => {
      mockDynamoGet.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/trainers/non-existent',
        pathParameters: { trainerId: 'non-existent' }
      };

      const result = await trainers.getTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('NOT_FOUND');
    });
  });

  describe('POST /auth/trainer/identify', () => {
    const mockCoach = {
      coachId: 'coach-id',
      nickname: 'matan_coach'
    };

    const mockTrainers = [
      {
        trainerId: 'trainer-1',
        coachId: 'coach-id',
        firstName: 'יוסי',
        lastName: 'כהן',
        trainerCode: 'ABC123'
      }
    ];

    it('should identify trainer by coach nickname and name', async () => {
      // Mock coach lookup by nickname
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        if (params.FilterExpression.includes('nickname')) {
          callback(null, { Items: [mockCoach] });
        }
      });

      // Mock trainers lookup by coach
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        if (params.FilterExpression.includes('coachId')) {
          callback(null, { Items: mockTrainers });
        }
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/auth/trainer/identify',
        body: JSON.stringify({
          coachNickname: 'matan_coach',
          firstName: 'יוסי',
          lastName: 'כהן'
        })
      };

      const result = await trainers.identifyTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.trainerId).toBe('trainer-1');
    });

    it('should identify trainer by trainer code', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        if (params.FilterExpression.includes('trainerCode')) {
          callback(null, { Items: [mockTrainers[0]] });
        }
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/auth/trainer/identify',
        body: JSON.stringify({
          trainerCode: 'ABC123'
        })
      };

      const result = await trainers.identifyTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.trainerId).toBe('trainer-1');
    });

    it('should return 404 when trainer not found', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/auth/trainer/identify',
        body: JSON.stringify({
          trainerCode: 'NONEXISTENT'
        })
      };

      const result = await trainers.identifyTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('NOT_FOUND');
    });

    it('should validate identification parameters', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/auth/trainer/identify',
        body: JSON.stringify({
          // Missing all identification parameters
        })
      };

      const result = await trainers.identifyTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Either provide trainerCode OR (coachNickname + firstName + lastName)');
    });

    it('should be case-insensitive for name matching', async () => {
      // Mock coach lookup
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        callback(null, { Items: [mockCoach] });
      });

      // Mock trainers lookup
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        callback(null, { Items: mockTrainers });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/auth/trainer/identify',
        body: JSON.stringify({
          coachNickname: 'MATAN_COACH', // Different case
          firstName: 'יוסי',
          lastName: 'כהן'
        })
      };

      const result = await trainers.identifyTrainer(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.trainerId).toBe('trainer-1');
    });
  });
});
