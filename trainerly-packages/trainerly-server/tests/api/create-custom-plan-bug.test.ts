import { createCustomTrainingPlan } from '../../src/handlers/trainers';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock the database service
jest.mock('../../src/services/database', () => ({
  db: {
    getTrainingPlan: jest.fn(),
    saveTrainingPlan: jest.fn()
  }
}));

// Get reference to the mocked database
const { db } = require('../../src/services/database');
const mockGetTrainingPlan = db.getTrainingPlan as jest.MockedFunction<typeof db.getTrainingPlan>;
const mockSaveTrainingPlan = db.saveTrainingPlan as jest.MockedFunction<typeof db.saveTrainingPlan>;

describe('Create Custom Training Plan Bug', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should fail when base training plan does not exist', async () => {
    const event: APIGatewayProxyEvent = {
      pathParameters: {
        coachId: 'coach-123',
        trainerId: 'trainer-456'
      },
      body: JSON.stringify({
        basePlanId: 'non-existent-plan',
        traineeName: 'יוסי כהן'
      }),
      httpMethod: 'POST',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      path: '/coaches/coach-123/trainers/trainer-456/custom-plan',
      resource: '/coaches/{coachId}/trainers/{trainerId}/custom-plan',
      requestContext: {} as any,
      stageVariables: null,
      isBase64Encoded: false
    };

    // Mock getTrainingPlan to return null (plan not found)
    mockGetTrainingPlan.mockResolvedValue(null);

    const response = await createCustomTrainingPlan(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      error: 'NOT_FOUND',
      message: 'Base training plan not found or not owned by coach'
    });
    expect(mockGetTrainingPlan).toHaveBeenCalledWith('non-existent-plan');
  });

  it('should fail when base plan belongs to different coach', async () => {
    const event: APIGatewayProxyEvent = {
      pathParameters: {
        coachId: 'coach-123',
        trainerId: 'trainer-456'
      },
      body: JSON.stringify({
        basePlanId: 'plan-789',
        traineeName: 'יוסי כהן'
      }),
      httpMethod: 'POST',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      path: '/coaches/coach-123/trainers/trainer-456/custom-plan',
      resource: '/coaches/{coachId}/trainers/{trainerId}/custom-plan',
      requestContext: {} as any,
      stageVariables: null,
      isBase64Encoded: false
    };

    // Mock getTrainingPlan to return a plan owned by different coach
    const basePlan = {
      planId: 'plan-789',
      coachId: 'different-coach-456', // Different coach!
      name: 'Base Plan',
      description: 'Test plan',
      trainings: [
        {
          trainingName: 'Training A',
          exercises: [
            {
              exerciseName: 'Push ups',
              sets: 3,
              minReps: 8,
              maxReps: 12,
              restTime: 60,
              note: ''
            }
          ]
        }
      ],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };
    mockGetTrainingPlan.mockResolvedValue(basePlan);

    const response = await createCustomTrainingPlan(event);

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      error: 'NOT_FOUND',
      message: 'Base training plan not found or not owned by coach'
    });
    expect(mockGetTrainingPlan).toHaveBeenCalledWith('plan-789');
  });

  it('should successfully create custom plan when base plan exists and belongs to coach', async () => {
    const event: APIGatewayProxyEvent = {
      pathParameters: {
        coachId: 'coach-123',
        trainerId: 'trainer-456'
      },
      body: JSON.stringify({
        basePlanId: 'plan-789',
        traineeName: 'יוסי כהן'
      }),
      httpMethod: 'POST',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      path: '/coaches/coach-123/trainers/trainer-456/custom-plan',
      resource: '/coaches/{coachId}/trainers/{trainerId}/custom-plan',
      requestContext: {} as any,
      stageVariables: null,
      isBase64Encoded: false
    };

    // Mock getTrainingPlan to return a valid plan owned by the coach
    const basePlan = {
      planId: 'plan-789',
      coachId: 'coach-123', // Same coach!
      name: 'Base Plan',
      description: 'Test plan',
      trainings: [
        {
          trainingName: 'Training A',
          exercises: [
            {
              exerciseName: 'Push ups',
              sets: 3,
              minReps: 8,
              maxReps: 12,
              restTime: 60,
              note: ''
            }
          ]
        }
      ],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };
    mockGetTrainingPlan.mockResolvedValue(basePlan);

    // Mock saveTrainingPlan to succeed
    mockSaveTrainingPlan.mockResolvedValue(true);

    const response = await createCustomTrainingPlan(event);

    expect(response.statusCode).toBe(201);
    const responseBody = JSON.parse(response.body);
    
    expect(responseBody).toMatchObject({
      coachId: 'coach-123',
      name: 'Base Plan - יוסי כהן',
      customTrainee: 'יוסי כהן',
      originalPlanId: 'plan-789',
      trainings: basePlan.trainings
    });
    
    expect(responseBody.planId).toBeDefined();
    expect(responseBody.planId).not.toBe('plan-789'); // Should be a new UUID
    expect(responseBody.createdAt).toBeDefined();
    expect(responseBody.updatedAt).toBeDefined();

    expect(mockGetTrainingPlan).toHaveBeenCalledWith('plan-789');
    expect(mockSaveTrainingPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId: 'coach-123',
        name: 'Base Plan - יוסי כהן',
        customTrainee: 'יוסי כהן',
        originalPlanId: 'plan-789'
      })
    );
  });

  it('should fail when database save operation fails', async () => {
    const event: APIGatewayProxyEvent = {
      pathParameters: {
        coachId: 'coach-123',
        trainerId: 'trainer-456'
      },
      body: JSON.stringify({
        basePlanId: 'plan-789',
        traineeName: 'יוסי כהן'
      }),
      httpMethod: 'POST',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      path: '/coaches/coach-123/trainers/trainer-456/custom-plan',
      resource: '/coaches/{coachId}/trainers/{trainerId}/custom-plan',
      requestContext: {} as any,
      stageVariables: null,
      isBase64Encoded: false
    };

    // Mock getTrainingPlan to return a valid plan
    const basePlan = {
      planId: 'plan-789',
      coachId: 'coach-123',
      name: 'Base Plan',
      description: 'Test plan',
      trainings: [],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };
    mockGetTrainingPlan.mockResolvedValue(basePlan);

    // Mock saveTrainingPlan to fail
    mockSaveTrainingPlan.mockResolvedValue(false);

    const response = await createCustomTrainingPlan(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create custom training plan'
    });
    expect(mockSaveTrainingPlan).toHaveBeenCalled();
  });

  it('should fail with proper validation errors for missing parameters', async () => {
    // Test missing coachId
    const eventMissingCoachId: APIGatewayProxyEvent = {
      pathParameters: {
        trainerId: 'trainer-456'
      },
      body: JSON.stringify({
        basePlanId: 'plan-789',
        traineeName: 'יוסי כהן'
      }),
      httpMethod: 'POST',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      path: '/coaches//trainers/trainer-456/custom-plan',
      resource: '/coaches/{coachId}/trainers/{trainerId}/custom-plan',
      requestContext: {} as any,
      stageVariables: null,
      isBase64Encoded: false
    } as any;

    const response1 = await createCustomTrainingPlan(eventMissingCoachId);
    expect(response1.statusCode).toBe(400);
    expect(JSON.parse(response1.body)).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Coach ID and trainer ID are required'
    });

    // Test missing body
    const eventMissingBody: APIGatewayProxyEvent = {
      pathParameters: {
        coachId: 'coach-123',
        trainerId: 'trainer-456'
      },
      body: null,
      httpMethod: 'POST',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      path: '/coaches/coach-123/trainers/trainer-456/custom-plan',
      resource: '/coaches/{coachId}/trainers/{trainerId}/custom-plan',
      requestContext: {} as any,
      stageVariables: null,
      isBase64Encoded: false
    };

    const response2 = await createCustomTrainingPlan(eventMissingBody);
    expect(response2.statusCode).toBe(400);
    expect(JSON.parse(response2.body)).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Request body is required'
    });

    // Test missing basePlanId in body
    const eventMissingBasePlanId: APIGatewayProxyEvent = {
      pathParameters: {
        coachId: 'coach-123',
        trainerId: 'trainer-456'
      },
      body: JSON.stringify({
        traineeName: 'יוסי כהן'
      }),
      httpMethod: 'POST',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      path: '/coaches/coach-123/trainers/trainer-456/custom-plan',
      resource: '/coaches/{coachId}/trainers/{trainerId}/custom-plan',
      requestContext: {} as any,
      stageVariables: null,
      isBase64Encoded: false
    };

    const response3 = await createCustomTrainingPlan(eventMissingBasePlanId);
    expect(response3.statusCode).toBe(400);
    expect(JSON.parse(response3.body)).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Base plan ID and trainee name are required'
    });
  });
});
