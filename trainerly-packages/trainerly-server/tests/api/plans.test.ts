import AWS from 'aws-sdk-mock';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as plans from '../../src/handlers/plans';

describe('Training Plans API', () => {
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

  describe('POST /coaches/{coachId}/plans', () => {
    const sampleTrainingPlan = {
      name: 'תוכנית אימונים v3.6',
      description: 'תוכנית אימונים מקיפה עם 3 אימונים',
      trainings: [
        {
          trainingId: 'training-a',
          name: 'Training A',
          order: 1,
          exercises: [
            {
              exerciseName: 'לחיצת חזה, מ. יד, שיפוע 30*',
              numberOfSets: 8,
              minimumTimeToRest: 15,
              maximumTimeToRest: 60,
              minimumNumberOfRepeasts: 8,
              maximumNumberOfRepeasts: 8
            },
            {
              exerciseName: 'פרפר, מ. יד/מכונה',
              numberOfSets: 8,
              minimumTimeToRest: 15,
              maximumTimeToRest: 60,
              minimumNumberOfRepeasts: 8,
              maximumNumberOfRepeasts: 8
            }
          ]
        },
        {
          trainingId: 'training-b',
          name: 'Training B',
          order: 2,
          exercises: [
            {
              exerciseName: 'משיכה בפולי עליון, ניטרלי',
              numberOfSets: 8,
              minimumTimeToRest: 15,
              maximumTimeToRest: 60,
              minimumNumberOfRepeasts: 8,
              maximumNumberOfRepeasts: 8
            }
          ]
        }
      ]
    };

    it('should create training plan successfully', async () => {
      mockDynamoPut.mockImplementation((params: any, callback?: any) => {
        if (callback) {
          callback(null, {});
        }
        return Promise.resolve({});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/plans',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify(sampleTrainingPlan)
      };

      const result = await plans.createPlan(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      
      expect(body.planId).toBeValidUUID();
      
      // Verify DynamoDB save was called with correct structure
      expect(mockDynamoPut).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: expect.stringContaining('plans'),
          Item: expect.objectContaining({
            coachId: 'coach-id',
            name: 'תוכנית אימונים v3.6',
            description: 'תוכנית אימונים מקיפה עם 3 אימונים',
            trainings: sampleTrainingPlan.trainings,
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        }),
        expect.any(Function)
      );
    });

    it('should validate required fields', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/plans',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify({
          // missing name and trainings
          description: 'תיאור'
        })
      };

      const result = await plans.createPlan(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Name and trainings are required');
    });

    it('should validate non-empty trainings array', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/plans',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify({
          name: 'תוכנית ריקה',
          trainings: []
        })
      };

      const result = await plans.createPlan(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Name and trainings are required');
    });

    it('should handle complex training structure with Hebrew content', async () => {
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const complexPlan = {
        name: 'תוכנית מתקדמת',
        description: 'תוכנית עם תרגילים מורכבים בעברית',
        trainings: [
          {
            trainingId: 'training-complex',
            name: 'אימון מורכב',
            order: 1,
            exercises: [
              {
                exerciseName: 'הרחקות אופקיות, שיפוע 30*, מ. יד',
                numberOfSets: 8,
                minimumTimeToRest: 15,
                maximumTimeToRest: 60,
                minimumNumberOfRepeasts: 8,
                maximumNumberOfRepeasts: 8,
                prescriptionNote: 'לתת לשכמות להשמט קדימה'
              }
            ]
          }
        ]
      };

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/plans',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify(complexPlan)
      };

      const result = await plans.createPlan(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      
      // Verify Hebrew content is preserved
      const savedData = mockDynamoPut.mock.calls[0][0].Item;
      expect(savedData.name).toBe('תוכנית מתקדמת');
      expect(savedData.trainings[0].name).toBe('אימון מורכב');
      expect(savedData.trainings[0].exercises[0].exerciseName).toBe('הרחקות אופקיות, שיפוע 30*, מ. יד');
    });
  });

  describe('GET /coaches/{coachId}/plans', () => {
    const mockPlans = [
      {
        planId: 'plan-1',
        coachId: 'coach-id',
        name: 'תוכנית בסיסית',
        description: 'תוכנית למתחילים',
        trainings: [
          { trainingId: 'training-1', name: 'Training A', order: 1, exercises: [] },
          { trainingId: 'training-2', name: 'Training B', order: 2, exercises: [] }
        ],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      {
        planId: 'plan-2',
        coachId: 'coach-id',
        name: 'תוכנית מתקדמת',
        trainings: [
          { trainingId: 'training-1', name: 'Training A', order: 1, exercises: [] },
          { trainingId: 'training-2', name: 'Training B', order: 2, exercises: [] },
          { trainingId: 'training-3', name: 'Training C', order: 3, exercises: [] }
        ],
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      }
    ];

    it('should list all plans for coach', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: mockPlans });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/coach-id/plans',
        pathParameters: { coachId: 'coach-id' }
      };

      const result = await plans.listPlans(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      expect(body.items).toHaveLength(2);
      
      expect(body.items[0]).toEqual({
        planId: 'plan-1',
        name: 'תוכנית בסיסית',
        description: 'תוכנית למתחילים',
        trainingsCount: 2,
        createdAt: '2023-01-01T00:00:00.000Z'
      });
      
      expect(body.items[1]).toEqual({
        planId: 'plan-2',
        name: 'תוכנית מתקדמת',
        description: undefined,
        trainingsCount: 3,
        createdAt: '2023-01-02T00:00:00.000Z'
      });
    });

    it('should return empty array for coach with no plans', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/coaches/coach-id/plans',
        pathParameters: { coachId: 'coach-id' }
      };

      const result = await plans.listPlans(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.items).toEqual([]);
    });
  });

  describe('POST /trainers/{trainerId}/plans/{planId}/assign', () => {
    it('should assign plan to trainer successfully', async () => {
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/trainers/trainer-id/plans/plan-id/assign',
        pathParameters: { 
          coachId: 'coach-id',
          trainerId: 'trainer-id',
          planId: 'plan-id'
        }
      };

      const result = await plans.assignPlan(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      expect(body.assignmentId).toBeValidUUID();
      expect(body.trainerId).toBe('trainer-id');
      expect(body.planId).toBe('plan-id');
      expect(body.assignedAt).toBeValidISODate();
      expect(body.active).toBe(true);
      
      // Verify DynamoDB save was called with correct assignment
      expect(mockDynamoPut).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: expect.stringContaining('plan-assignments'),
          Item: expect.objectContaining({
            trainerId: 'trainer-id',
            planId: 'plan-id',
            active: true
          })
        }),
        expect.any(Function)
      );
    });

    it('should validate required path parameters', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/trainers//plans//assign',
        pathParameters: null
      };

      const result = await plans.assignPlan(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Coach ID, Trainer ID and Plan ID are required');
    });
  });

  describe('GET /trainers/{trainerId}/plans', () => {
    const mockAssignments = [
      { assignmentId: 'assign-1', trainerId: 'trainer-id', planId: 'plan-1', active: true },
      { assignmentId: 'assign-2', trainerId: 'trainer-id', planId: 'plan-2', active: true }
    ];

    const mockPlansData = [
      {
        planId: 'plan-1',
        name: 'תוכנית בסיסית',
        description: 'תוכנית למתחילים',
        trainings: [
          {
            trainingId: 'training-a',
            name: 'Training A',
            order: 1,
            exercises: [
              {
                exerciseName: 'לחיצת חזה',
                numberOfSets: 8,
                minimumTimeToRest: 15,
                maximumTimeToRest: 60,
                minimumNumberOfRepeasts: 8,
                maximumNumberOfRepeasts: 8
              }
            ]
          }
        ]
      },
      {
        planId: 'plan-2',
        name: 'תוכנית מתקדמת',
        trainings: [
          {
            trainingId: 'training-b',
            name: 'Training B',
            order: 1,
            exercises: []
          }
        ]
      }
    ];

    it('should return assigned plans with full training details', async () => {
      // Mock plan assignments scan
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        callback(null, { Items: mockAssignments });
      });

      // Mock individual plan gets
      mockDynamoGet
        .mockImplementationOnce((params: any, callback: any) => {
          callback(null, { Item: mockPlansData[0] });
        })
        .mockImplementationOnce((params: any, callback: any) => {
          callback(null, { Item: mockPlansData[1] });
        });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/trainers/trainer-id/plans',
        pathParameters: { trainerId: 'trainer-id' }
      };

      const result = await plans.getTrainerPlans(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      
      expect(body.items).toHaveLength(2);
      
      // Verify full training plan structure is returned
      expect(body.items[0]).toEqual({
        planId: 'plan-1',
        name: 'תוכנית בסיסית',
        description: 'תוכנית למתחילים',
        trainings: [
          {
            trainingId: 'training-a',
            name: 'Training A',
            order: 1,
            exercises: [
              {
                exerciseName: 'לחיצת חזה',
                numberOfSets: 8,
                minimumTimeToRest: 15,
                maximumTimeToRest: 60,
                minimumNumberOfRepeasts: 8,
                maximumNumberOfRepeasts: 8
              }
            ]
          }
        ]
      });
    });

    it('should return empty array for trainer with no assigned plans', async () => {
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/trainers/trainer-id/plans',
        pathParameters: { trainerId: 'trainer-id' }
      };

      const result = await plans.getTrainerPlans(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.items).toEqual([]);
    });

    it('should handle missing plans gracefully', async () => {
      // Mock assignments exist but one plan is missing
      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [mockAssignments[0]] });
      });

      // Mock plan not found
      mockDynamoGet.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        path: '/trainers/trainer-id/plans',
        pathParameters: { trainerId: 'trainer-id' }
      };

      const result = await plans.getTrainerPlans(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.items).toEqual([]);
    });
  });

  describe('Training Plan Data Structure Validation', () => {
    it('should preserve Hebrew exercise names in training plans', async () => {
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      const hebrewPlan = {
        name: 'תוכנית עברית',
        trainings: [
          {
            trainingId: 'hebrew-training',
            name: 'אימון א',
            order: 1,
            exercises: [
              {
                exerciseName: 'כפיפות בטן, רגליים מקובעות',
                numberOfSets: 3,
                minimumTimeToRest: 60,
                maximumTimeToRest: 60,
                minimumNumberOfRepeasts: 10,
                maximumNumberOfRepeasts: 12
              }
            ]
          }
        ]
      };

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/plans',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify(hebrewPlan)
      };

      const result = await plans.createPlan(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      
      const savedData = mockDynamoPut.mock.calls[0][0].Item;
      expect(savedData.trainings[0].exercises[0].exerciseName).toBe('כפיפות בטן, רגליים מקובעות');
    });

    it('should handle the original v3.6 training structure', async () => {
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      // Based on the original trainingPlan-v3.6.ts structure
      const v36Plan = {
        name: 'Training Plan v3.6',
        trainings: [
          {
            trainingId: 'training-a',
            name: 'Training A',
            order: 1,
            exercises: [
              {
                exerciseName: 'לחיצת חזה, מ. יד, שיפוע 30*',
                numberOfSets: 8,
                minimumTimeToRest: 15,
                maximumTimeToRest: 60,
                minimumNumberOfRepeasts: 8,
                maximumNumberOfRepeasts: 8
              },
              {
                exerciseName: 'AB ROLLOUT',
                numberOfSets: 3,
                minimumTimeToRest: 60,
                maximumTimeToRest: 60,
                minimumNumberOfRepeasts: 6,
                maximumNumberOfRepeasts: 8
              }
            ]
          }
        ]
      };

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        path: '/coaches/coach-id/plans',
        pathParameters: { coachId: 'coach-id' },
        body: JSON.stringify(v36Plan)
      };

      const result = await plans.createPlan(
        event as APIGatewayProxyEvent
      );

      expect(result.statusCode).toBe(201);
      
      const savedData = mockDynamoPut.mock.calls[0][0].Item;
      expect(savedData.name).toBe('Training Plan v3.6');
      expect(savedData.trainings).toHaveLength(1);
      expect(savedData.trainings[0].exercises).toHaveLength(2);
      
      // Verify the exercise prescription data is preserved
      const firstExercise = savedData.trainings[0].exercises[0];
      expect(firstExercise.numberOfSets).toBe(8);
      expect(firstExercise.minimumTimeToRest).toBe(15);
      expect(firstExercise.maximumTimeToRest).toBe(60);
      expect(firstExercise.minimumNumberOfRepeasts).toBe(8);
      expect(firstExercise.maximumNumberOfRepeasts).toBe(8);
    });
  });
});
