import { APIGatewayProxyEvent } from 'aws-lambda';
import { copyAdminExercise } from '../../src/handlers/coaches';
import { mockDatabase } from '../__mocks__/database';

describe('Copy Admin Exercise Bug', () => {
  const mockAdminExercise = {
    exerciseId: 'admin-exercise-1',
    name: 'לחיצת חזה במוט',
    muscleGroup: 'חזה אמצעי',
    note: 'שכיבה על הספסל, אחיזה רחבה במוט',
    link: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    isAdminExercise: true,
    coachId: 'admin-coach',
    createdAt: '2025-09-26T09:35:09.466Z'
  };

  const mockExistingExercise = {
    exerciseId: 'coach-exercise-1',
    name: 'לחיצת חזה במוט', // Same name as admin exercise
    muscleGroup: 'חזה אמצעי',
    note: 'תרגיל קיים של המאמן',
    link: 'https://www.youtube.com/watch?v=different',
    isAdminExercise: false,
    coachId: 'coach-123',
    createdAt: '2025-09-25T10:00:00.000Z'
  };

  const createMockEvent = (coachId: string, adminExerciseId: string): APIGatewayProxyEvent => ({
    pathParameters: { coachId, adminExerciseId },
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: `/coaches/${coachId}/exercises/copy-admin/${adminExerciseId}`,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  beforeEach(() => {
    mockDatabase.clear();
  });

  it('should fail when admin exercise does not exist', async () => {
    // Admin exercise does not exist in database (cleared in beforeEach)

    const event = createMockEvent('coach-123', 'nonexistent-exercise');
    const result = await copyAdminExercise(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      error: 'NOT_FOUND',
      message: 'Admin exercise not found'
    });
  });

  it('should fail when admin exercise is not marked as admin', async () => {
    // Add non-admin exercise to database
    const nonAdminExercise = { ...mockAdminExercise, isAdminExercise: false };
    await mockDatabase.saveExercise(nonAdminExercise);

    const event = createMockEvent('coach-123', 'admin-exercise-1');
    const result = await copyAdminExercise(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      error: 'NOT_FOUND',
      message: 'Admin exercise not found'
    });
  });

  it('should fail when coach already has exercise with same name', async () => {
    // Add admin exercise to database
    await mockDatabase.saveExercise(mockAdminExercise);
    
    // Add existing exercise for coach with same name
    await mockDatabase.saveExercise(mockExistingExercise);

    const event = createMockEvent('coach-123', 'admin-exercise-1');
    const result = await copyAdminExercise(event);

    expect(result.statusCode).toBe(409);
    expect(JSON.parse(result.body)).toEqual({
      error: 'DUPLICATE_NAME',
      message: 'Exercise with this name already exists'
    });
  });

  it('should succeed when coach does not have exercise with same name', async () => {
    // Add admin exercise to database
    await mockDatabase.saveExercise(mockAdminExercise);

    const event = createMockEvent('coach-123', 'admin-exercise-1');
    const result = await copyAdminExercise(event);

    expect(result.statusCode).toBe(201);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody.name).toBe('לחיצת חזה במוט');
    expect(responseBody.coachId).toBe('coach-123');
    expect(responseBody.isAdminExercise).toBe(false);
    expect(responseBody.originalExerciseId).toBe('admin-exercise-1');
    expect(responseBody.exerciseId).toBeDefined();
    expect(responseBody.exerciseId).not.toBe('admin-exercise-1'); // Should be new ID

    // Verify the exercise was saved to the database
    const savedExercise = await mockDatabase.getExercise(responseBody.exerciseId);
    expect(savedExercise).toBeTruthy();
    expect(savedExercise.name).toBe('לחיצת חזה במוט');
    expect(savedExercise.coachId).toBe('coach-123');
  });

  it('should be case insensitive when checking for duplicate names', async () => {
    // Add admin exercise to database
    await mockDatabase.saveExercise(mockAdminExercise);
    
    // Add existing exercise for coach with different case
    const differentCaseExercise = {
      ...mockExistingExercise,
      name: 'לחיצת חזה במוט'.toUpperCase() // Different case
    };
    await mockDatabase.saveExercise(differentCaseExercise);

    const event = createMockEvent('coach-123', 'admin-exercise-1');
    const result = await copyAdminExercise(event);

    expect(result.statusCode).toBe(409);
    expect(JSON.parse(result.body)).toEqual({
      error: 'DUPLICATE_NAME',
      message: 'Exercise with this name already exists'
    });
  });

  it('should handle missing path parameters', async () => {
    const event = createMockEvent('', '');
    const result = await copyAdminExercise(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'VALIDATION_ERROR',
      message: 'Coach ID and admin exercise ID are required'
    });
  });
});
