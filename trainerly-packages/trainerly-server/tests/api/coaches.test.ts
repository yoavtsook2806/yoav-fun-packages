import request from 'supertest';
import AWS from 'aws-sdk-mock';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as coaches from '../../src/handlers/coaches';

describe('Coach Authentication API', () => {
  let mockDynamoGet: jest.Mock;
  let mockDynamoPut: jest.Mock;
  let mockDynamoScan: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock DynamoDB operations
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

  describe('GET /nicknames/check', () => {
    it('should return available for valid unique nickname', async () => {
      // Mock: nickname doesn't exist in DB
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/nicknames/check',
        queryStringParameters: { nickname: 'test_coach' }
      };

      const result = await coaches.checkNickname(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body).toEqual({
        input: 'test_coach',
        canonical: 'test_coach',
        valid: true,
        available: true
      });
    });

    it('should return unavailable for taken nickname', async () => {
      // Mock: nickname exists in DB
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { 
          Items: [{ 
            coachId: 'existing-coach-id', 
            nickname: 'test_coach' 
          }] 
        });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/nicknames/check',
        queryStringParameters: { nickname: 'test_coach' }
      };

      const result = await coaches.checkNickname(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body).toEqual({
        input: 'test_coach',
        canonical: 'test_coach',
        valid: true,
        available: false,
        reason: 'NICKNAME_TAKEN'
      });
    });

    it('should normalize nickname properly', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/nicknames/check',
        queryStringParameters: { nickname: '  Test Coach  123  ' }
      };

      const result = await coaches.checkNickname(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.canonical).toBe('test_coach_123');
    });

    it('should reject reserved nicknames', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/nicknames/check',
        queryStringParameters: { nickname: 'admin' }
      };

      const result = await coaches.checkNickname(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.available).toBe(false);
      expect(body.reason).toBe('NICKNAME_RESERVED');
    });

    it('should return 400 for missing nickname', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/nicknames/check',
        queryStringParameters: null
      };

      const result = await coaches.checkNickname(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('NICKNAME_INVALID');
    });
  });

  describe('POST /coaches (Registration)', () => {
    it('should create coach successfully with valid data', async () => {
      // Mock: nickname and email don't exist
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });
      
      // Mock: successful save
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches',
        body: JSON.stringify({
          name: 'Test Coach',
          email: 'test@example.com',
          password: 'password123',
          nickname: 'test_coach'
        })
      };

      const result = await coaches.createCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      
      expect(body.coachId).toBeValidUUID();
      expect(body.token).toBeDefined();
      expect(body.valid).toBe(true);
      expect(body.nickname).toBe('test_coach');
      
      // Verify DynamoDB calls
      expect(mockDynamoPut).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: expect.stringContaining('coaches'),
          Item: expect.objectContaining({
            name: 'Test Coach',
            email: 'test@example.com',
            nickname: 'test_coach',
            valid: true
          })
        }),
        expect.any(Function)
      );
    });

    it('should reject registration with taken nickname', async () => {
      // Mock: nickname exists
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        if (params.FilterExpression.includes('nickname')) {
          callback(null, { Items: [{ coachId: 'existing', nickname: 'test_coach' }] });
        } else {
          callback(null, { Items: [] });
        }
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches',
        body: JSON.stringify({
          name: 'Test Coach',
          email: 'test@example.com',
          password: 'password123',
          nickname: 'test_coach'
        })
      };

      const result = await coaches.createCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('NICKNAME_TAKEN');
    });

    it('should reject registration with taken email', async () => {
      // Mock: nickname available, email taken
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        if (params.FilterExpression.includes('email')) {
          callback(null, { Items: [{ coachId: 'existing', email: 'test@example.com' }] });
        } else {
          callback(null, { Items: [] });
        }
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches',
        body: JSON.stringify({
          name: 'Test Coach',
          email: 'test@example.com',
          password: 'password123',
          nickname: 'test_coach'
        })
      };

      const result = await coaches.createCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Email is already registered');
    });

    it('should validate required fields', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches',
        body: JSON.stringify({
          name: 'Test Coach',
          // missing email, password, nickname
        })
      };

      const result = await coaches.createCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('All fields are required');
    });
  });

  describe('POST /auth/coach/login', () => {
    const mockCoach = {
      coachId: 'test-coach-id',
      name: 'Test Coach',
      email: 'test@example.com',
      nickname: 'test_coach',
      passwordHash: '$2a$10$dummyHashForTesting', // This would be a real bcrypt hash
      valid: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };

    it('should login successfully with correct credentials', async () => {
      // Mock: coach exists
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [mockCoach] });
      });

      // Mock bcrypt.compare to return true
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/auth/coach/login',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      };

      const result = await coaches.loginCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      expect(body.coachId).toBe('test-coach-id');
      expect(body.token).toBeDefined();
      expect(body.valid).toBe(true);
    });

    it('should reject login with incorrect password', async () => {
      // Mock: coach exists
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [mockCoach] });
      });

      // Mock bcrypt.compare to return false
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/auth/coach/login',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      };

      const result = await coaches.loginCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent email', async () => {
      // Mock: no coach found
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/auth/coach/login',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
      };

      const result = await coaches.loginCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /coaches/{coachId}', () => {
    const mockCoach = {
      coachId: 'test-coach-id',
      name: 'Test Coach',
      email: 'test@example.com',
      nickname: 'test_coach',
      valid: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    };

    it('should return coach details successfully', async () => {
      // Mock: coach exists
      mockDynamoGet.mockImplementation((params: any, callback: any) => {
        callback(null, { Item: mockCoach });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/test-coach-id',
        pathParameters: { coachId: 'test-coach-id' }
      };

      const result = await coaches.getCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      expect(body.coachId).toBe('test-coach-id');
      expect(body.name).toBe('Test Coach');
      expect(body.email).toBe('test@example.com');
      expect(body.nickname).toBe('test_coach');
      expect(body.valid).toBe(true);
      expect(body.createdAt).toBeValidISODate();
      
      // Should not include sensitive data
      expect(body.passwordHash).toBeUndefined();
    });

    it('should return 404 for non-existent coach', async () => {
      // Mock: coach not found
      mockDynamoGet.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/non-existent-id',
        pathParameters: { coachId: 'non-existent-id' }
      };

      const result = await coaches.getCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('NOT_FOUND');
    });

    it('should return 400 for missing coachId', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/',
        pathParameters: null
      };

      const result = await coaches.getCoach(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
    });
  });
});
