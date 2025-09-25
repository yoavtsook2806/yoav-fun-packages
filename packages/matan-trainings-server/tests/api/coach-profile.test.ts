import { APIGatewayProxyEvent } from 'aws-lambda';
import { updateCoach } from '../../src/handlers/coaches';

// Mock the database service
jest.mock('../../src/services/database', () => ({
  db: {
    getCoach: jest.fn(),
    updateCoach: jest.fn(),
  }
}));

import { db } from '../../src/services/database';

describe('Coach Profile Management', () => {
  const mockCoach = {
    coachId: 'coach-123',
    name: 'John Doe',
    email: 'john@example.com',
    nickname: 'john_coach',
    passwordHash: 'hashed_password',
    valid: true,
    phone: '+1-555-0123',
    age: 35,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateCoach', () => {
    it('should update coach profile successfully', async () => {
      // Arrange
      (db.getCoach as jest.Mock).mockResolvedValue(mockCoach);
      (db.updateCoach as jest.Mock).mockResolvedValue(true);

      const event: APIGatewayProxyEvent = {
        pathParameters: { coachId: 'coach-123' },
        body: JSON.stringify({
          name: 'John Updated',
          phone: '+1-555-9999',
          age: 36
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/coaches/coach-123',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      // Act
      const result = await updateCoach(event);

      // Assert
      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual({
        coachId: 'coach-123',
        name: 'John Updated',
        email: 'john@example.com',
        nickname: 'john_coach',
        phone: '+1-555-9999',
        age: 36,
        updatedAt: expect.toBeValidISODate()
      });

      expect(db.getCoach).toHaveBeenCalledWith('coach-123');
      expect(db.updateCoach).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockCoach,
          name: 'John Updated',
          phone: '+1-555-9999',
          age: 36,
          updatedAt: expect.toBeValidISODate()
        })
      );
    });

    it('should update only provided fields', async () => {
      // Arrange
      (db.getCoach as jest.Mock).mockResolvedValue(mockCoach);
      (db.updateCoach as jest.Mock).mockResolvedValue(true);

      const event: APIGatewayProxyEvent = {
        pathParameters: { coachId: 'coach-123' },
        body: JSON.stringify({
          phone: '+1-555-7777'
          // Only updating phone, not name or age
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/coaches/coach-123',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      // Act
      const result = await updateCoach(event);

      // Assert
      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.name).toBe('John Doe'); // Original name preserved
      expect(responseBody.phone).toBe('+1-555-7777'); // Phone updated
      expect(responseBody.age).toBe(35); // Original age preserved
    });

    it('should validate age range', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        pathParameters: { coachId: 'coach-123' },
        body: JSON.stringify({
          age: 150 // Invalid age
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/coaches/coach-123',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      // Act
      const result = await updateCoach(event);

      // Assert
      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('VALIDATION_ERROR');
      expect(responseBody.message).toBe('Age must be between 18 and 120');
    });

    it('should validate phone number format', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        pathParameters: { coachId: 'coach-123' },
        body: JSON.stringify({
          phone: 'invalid-phone'
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/coaches/coach-123',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      // Act
      const result = await updateCoach(event);

      // Assert
      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('VALIDATION_ERROR');
      expect(responseBody.message).toBe('Invalid phone number format');
    });

    it('should return 404 if coach not found', async () => {
      // Arrange
      (db.getCoach as jest.Mock).mockResolvedValue(null);

      const event: APIGatewayProxyEvent = {
        pathParameters: { coachId: 'nonexistent-coach' },
        body: JSON.stringify({
          name: 'Updated Name'
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/coaches/nonexistent-coach',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      // Act
      const result = await updateCoach(event);

      // Assert
      expect(result.statusCode).toBe(404);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('NOT_FOUND');
      expect(responseBody.message).toBe('Coach not found');
    });

    it('should return 400 if coachId is missing', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        pathParameters: null,
        body: JSON.stringify({
          name: 'Updated Name'
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/coaches/',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      // Act
      const result = await updateCoach(event);

      // Assert
      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('VALIDATION_ERROR');
      expect(responseBody.message).toBe('Coach ID is required');
    });

    it('should return 400 if request body is missing', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        pathParameters: { coachId: 'coach-123' },
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/coaches/coach-123',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      // Act
      const result = await updateCoach(event);

      // Assert
      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('VALIDATION_ERROR');
      expect(responseBody.message).toBe('Request body is required');
    });

    it('should handle database update failure', async () => {
      // Arrange
      (db.getCoach as jest.Mock).mockResolvedValue(mockCoach);
      (db.updateCoach as jest.Mock).mockResolvedValue(false);

      const event: APIGatewayProxyEvent = {
        pathParameters: { coachId: 'coach-123' },
        body: JSON.stringify({
          name: 'Updated Name'
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/coaches/coach-123',
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      // Act
      const result = await updateCoach(event);

      // Assert
      expect(result.statusCode).toBe(500);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('INTERNAL_ERROR');
      expect(responseBody.message).toBe('Failed to update coach profile');
    });
  });
});
