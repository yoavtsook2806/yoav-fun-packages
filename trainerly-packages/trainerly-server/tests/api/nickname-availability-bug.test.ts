import { APIGatewayProxyEvent } from 'aws-lambda';
import { checkNickname } from '../../src/handlers/coaches';
import { mockDatabase } from '../__mocks__/database';

describe('Nickname Availability Bug', () => {
  const createMockEvent = (nickname: string): APIGatewayProxyEvent => ({
    queryStringParameters: { nickname },
    pathParameters: null,
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: `/nicknames/check?nickname=${encodeURIComponent(nickname)}`,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  beforeEach(() => {
    mockDatabase.clear();
  });

  it('should return available=false when nickname already exists in database', async () => {
    // Create a coach with nickname "yoav2"
    const existingCoach = {
      coachId: 'coach-123',
      name: 'Existing Coach',
      email: 'existing@test.com',
      nickname: 'yoav2',
      createdAt: '2025-09-26T10:00:00.000Z',
      valid: true
    };

    // Add coach to mock database
    mockDatabase.coaches.set(existingCoach.coachId, existingCoach);

    const event = createMockEvent('yoav2');
    const result = await checkNickname(event);

    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body);
    
    // BUG: Currently this returns available=true because database check is commented out
    // After fix, it should return available=false
    expect(response.available).toBe(false);
    expect(response.reason).toBe('NICKNAME_TAKEN');
    expect(response.canonical).toBe('yoav2');
  });

  it('should return available=true when nickname does not exist in database', async () => {
    // Database is empty (cleared in beforeEach)
    
    const event = createMockEvent('uniquenickname');
    const result = await checkNickname(event);

    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body);
    
    expect(response.available).toBe(true);
    expect(response.reason).toBeUndefined();
    expect(response.canonical).toBe('uniquenickname');
  });

  it('should be case-insensitive when checking nickname availability', async () => {
    // Create a coach with lowercase nickname
    const existingCoach = {
      coachId: 'coach-123',
      name: 'Existing Coach',
      email: 'existing@test.com',
      nickname: 'testuser',
      createdAt: '2025-09-26T10:00:00.000Z',
      valid: true
    };

    mockDatabase.coaches.set(existingCoach.coachId, existingCoach);

    // Check uppercase version
    const event = createMockEvent('TESTUSER');
    const result = await checkNickname(event);

    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body);
    
    // Should be unavailable because 'testuser' already exists
    expect(response.available).toBe(false);
    expect(response.reason).toBe('NICKNAME_TAKEN');
  });

  it('should return available=false for reserved nicknames', async () => {
    const event = createMockEvent('admin');
    const result = await checkNickname(event);

    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body);
    
    expect(response.available).toBe(false);
    expect(response.reason).toBe('NICKNAME_RESERVED');
    expect(response.canonical).toBe('admin');
  });

  it('should return available=false for invalid nicknames', async () => {
    const event = createMockEvent('invalid nickname with spaces');
    const result = await checkNickname(event);

    expect(result.statusCode).toBe(200);
    const response = JSON.parse(result.body);
    
    expect(response.available).toBe(false);
    expect(response.reason).toBe('NICKNAME_INVALID');
  });
});
