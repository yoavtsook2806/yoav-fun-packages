import { createCustomTrainingPlan } from '../../src/handlers/trainers';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Don't mock the database - use the real one to debug the actual issue
describe('Create Custom Training Plan Debug', () => {
  it('should debug the actual failure scenario with real database', async () => {
    // This test uses the real database to see what's actually happening
    const event: APIGatewayProxyEvent = {
      pathParameters: {
        coachId: 'yoav-admin-coach-id', // Use the actual coach ID from the system
        trainerId: 'some-trainee-id'
      },
      body: JSON.stringify({
        basePlanId: 'some-plan-id', // This might be the issue - plan doesn't exist
        traineeName: 'יוסי כהן'
      }),
      httpMethod: 'POST',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      path: '/coaches/yoav-admin-coach-id/trainers/some-trainee-id/custom-plan',
      resource: '/coaches/{coachId}/trainers/{trainerId}/custom-plan',
      requestContext: {} as any,
      stageVariables: null,
      isBase64Encoded: false
    };

    const response = await createCustomTrainingPlan(event);
    
    console.log('Response status:', response.statusCode);
    console.log('Response body:', response.body);
    
    // This test is for debugging - we expect it might fail
    // The important part is to see what the actual error is
  });

  it('should test with a plan that definitely does not exist', async () => {
    const event: APIGatewayProxyEvent = {
      pathParameters: {
        coachId: 'yoav-admin-coach-id', 
        trainerId: 'some-trainee-id'
      },
      body: JSON.stringify({
        basePlanId: 'definitely-non-existent-plan-id', 
        traineeName: 'יוסי כהן'
      }),
      httpMethod: 'POST',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      path: '/coaches/yoav-admin-coach-id/trainers/some-trainee-id/custom-plan',
      resource: '/coaches/{coachId}/trainers/{trainerId}/custom-plan',
      requestContext: {} as any,
      stageVariables: null,
      isBase64Encoded: false
    };

    const response = await createCustomTrainingPlan(event);
    
    // This should return 404 with the specific error message
    expect(response.statusCode).toBe(404);
    const responseBody = JSON.parse(response.body);
    expect(responseBody).toEqual({
      error: 'NOT_FOUND',
      message: 'Base training plan not found or not owned by coach'
    });
    
    console.log('✅ Confirmed: Non-existent plan returns 404 as expected');
  });
});
