import AWS from 'aws-sdk-mock';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as coaches from '../../src/handlers/coaches';
import * as trainers from '../../src/handlers/trainers';
import * as exercises from '../../src/handlers/exercises';
import * as plans from '../../src/handlers/plans';

describe('Complete API Integration Flow', () => {
  let mockDynamoGet: jest.Mock;
  let mockDynamoPut: jest.Mock;
  let mockDynamoScan: jest.Mock;
  
  // Test data that will be used throughout the flow
  let testCoachId: string;
  let testTrainerId: string;
  let testExerciseIds: string[] = [];
  let testPlanId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDynamoGet = jest.fn();
    mockDynamoPut = jest.fn();
    mockDynamoScan = jest.fn();
    
    AWS.mock('DynamoDB.DocumentClient', 'get', mockDynamoGet);
    AWS.mock('DynamoDB.DocumentClient', 'put', mockDynamoPut);
    AWS.mock('DynamoDB.DocumentClient', 'scan', mockDynamoScan);
    
    // Mock bcrypt for password operations
    const bcrypt = require('bcryptjs');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2a$10$hashedpassword');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
  });

  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
  });

  describe('Complete Training Platform Workflow', () => {
    it('should complete the full coach-trainer-exercise-plan workflow', async () => {
      // Step 1: Check nickname availability
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        callback(null, { Items: [] }); // Nickname available
      });

      const nicknameCheckEvent: Partial<APIGatewayProxyEvent> = {
        queryStringParameters: { nickname: 'matan_coach' }
      };

      const nicknameResult = await coaches.checkNickname(
        nicknameCheckEvent as APIGatewayProxyEvent
      );

      expect(nicknameResult.statusCode).toBe(200);
      const nicknameBody = JSON.parse(nicknameResult.body);
      expect(nicknameBody.available).toBe(true);

      // Step 2: Register new coach
      mockDynamoScan
        .mockImplementationOnce((params: any, callback: any) => {
          callback(null, { Items: [] }); // Nickname available
        })
        .mockImplementationOnce((params: any, callback: any) => {
          callback(null, { Items: [] }); // Email available
        });

      mockDynamoPut.mockImplementationOnce((params: any, callback: any) => {
        testCoachId = params.Item.coachId;
        callback(null, {});
      });

      const registerEvent: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          name: 'מתן המאמן',
          email: 'matan@example.com',
          password: 'password123',
          nickname: 'matan_coach'
        })
      };

      const registerResult = await coaches.createCoach(
        registerEvent as APIGatewayProxyEvent
      );

      expect(registerResult.statusCode).toBe(201);
      const registerBody = JSON.parse(registerResult.body);
      expect(registerBody.coachId).toBeValidUUID();
      expect(registerBody.token).toBeDefined();
      testCoachId = registerBody.coachId;

      // Step 3: Create exercises
      const exerciseData = [
        {
          name: 'לחיצת חזה, מ. יד, שיפוע 30*',
          link: 'https://www.youtube.com/watch?v=example1',
          note: '',
          short: 'חזה'
        },
        {
          name: 'פרפר, מ. יד/מכונה',
          link: 'https://www.youtube.com/watch?v=example2',
          note: 'מרפקים מעט מכופפים, חזה פתוח',
          short: 'פרפר'
        },
        {
          name: 'לחיצת רגליים',
          link: 'https://www.youtube.com/watch?v=example3',
          note: 'גב תחתון ואגן נשארים צמודים',
          short: 'רגליים'
        }
      ];

      for (const exercise of exerciseData) {
        mockDynamoPut.mockImplementationOnce((params: any, callback: any) => {
          testExerciseIds.push(params.Item.exerciseId);
          callback(null, {});
        });

        const exerciseEvent: Partial<APIGatewayProxyEvent> = {
          pathParameters: { coachId: testCoachId },
          body: JSON.stringify(exercise)
        };

        const exerciseResult = await exercises.createExercise(
          exerciseEvent as APIGatewayProxyEvent
        );

        expect(exerciseResult.statusCode).toBe(201);
        const exerciseBody = JSON.parse(exerciseResult.body);
        expect(exerciseBody.exerciseId).toBeValidUUID();
      }

      // Step 4: List exercises to verify they were created
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        const mockExercises = exerciseData.map((exercise, index) => ({
          exerciseId: testExerciseIds[index] || `exercise-${index}`,
          coachId: testCoachId,
          ...exercise,
          createdAt: new Date().toISOString()
        }));
        callback(null, { Items: mockExercises });
      });

      const listExercisesEvent: Partial<APIGatewayProxyEvent> = {
        pathParameters: { coachId: testCoachId }
      };

      const listExercisesResult = await exercises.listExercises(
        listExercisesEvent as APIGatewayProxyEvent,
      );

      expect(listExercisesResult.statusCode).toBe(200);
      const exercisesList = JSON.parse(listExercisesResult.body);
      expect(exercisesList.items).toHaveLength(3);
      expect(exercisesList.items[0].name).toBe('לחיצת חזה, מ. יד, שיפוע 30*');

      // Step 5: Create a training plan
      mockDynamoPut.mockImplementationOnce((params: any, callback: any) => {
        testPlanId = params.Item.planId;
        callback(null, {});
      });

      const trainingPlan = {
        name: 'תוכנית אימונים v3.6',
        description: 'תוכנית אימונים מקיפה',
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
                exerciseName: 'לחיצת רגליים',
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

      const createPlanEvent: Partial<APIGatewayProxyEvent> = {
        pathParameters: { coachId: testCoachId },
        body: JSON.stringify(trainingPlan)
      };

      const createPlanResult = await plans.createPlan(
        createPlanEvent as APIGatewayProxyEvent,
      );

      expect(createPlanResult.statusCode).toBe(201);
      const planBody = JSON.parse(createPlanResult.body);
      expect(planBody.planId).toBeValidUUID();
      testPlanId = planBody.planId;

      // Step 6: Create a trainer
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        callback(null, { Items: [] }); // No existing trainer codes
      });

      mockDynamoPut.mockImplementationOnce((params: any, callback: any) => {
        testTrainerId = params.Item.trainerId;
        callback(null, {});
      });

      const createTrainerEvent: Partial<APIGatewayProxyEvent> = {
        pathParameters: { coachId: testCoachId },
        body: JSON.stringify({
          firstName: 'יוסי',
          lastName: 'כהן',
          email: 'yossi@example.com'
        })
      };

      const createTrainerResult = await trainers.createTrainer(
        createTrainerEvent as APIGatewayProxyEvent,
      );

      expect(createTrainerResult.statusCode).toBe(201);
      const trainerBody = JSON.parse(createTrainerResult.body);
      expect(trainerBody.trainerId).toBeValidUUID();
      testTrainerId = trainerBody.trainerId;

      // Step 7: Assign plan to trainer
      mockDynamoPut.mockImplementationOnce((params: any, callback: any) => {
        callback(null, {});
      });

      const assignPlanEvent: Partial<APIGatewayProxyEvent> = {
        pathParameters: { 
          trainerId: testTrainerId,
          planId: testPlanId
        }
      };

      const assignResult = await plans.assignPlan(
        assignPlanEvent as APIGatewayProxyEvent,
      );

      expect(assignResult.statusCode).toBe(200);
      const assignBody = JSON.parse(assignResult.body);
      expect(assignBody.assignmentId).toBeValidUUID();
      expect(assignBody.trainerId).toBe(testTrainerId);
      expect(assignBody.planId).toBe(testPlanId);

      // Step 8: Trainer identifies themselves
      mockDynamoScan
        .mockImplementationOnce((params: any, callback: any) => {
          // Mock coach lookup
          callback(null, { 
            Items: [{ 
              coachId: testCoachId, 
              nickname: 'matan_coach' 
            }] 
          });
        })
        .mockImplementationOnce((params: any, callback: any) => {
          // Mock trainers lookup
          callback(null, { 
            Items: [{ 
              trainerId: testTrainerId,
              coachId: testCoachId,
              firstName: 'יוסי',
              lastName: 'כהן'
            }] 
          });
        });

      const identifyEvent: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          coachNickname: 'matan_coach',
          firstName: 'יוסי',
          lastName: 'כהן'
        })
      };

      const identifyResult = await trainers.identifyTrainer(
        identifyEvent as APIGatewayProxyEvent,
      );

      expect(identifyResult.statusCode).toBe(200);
      const identifyBody = JSON.parse(identifyResult.body);
      expect(identifyBody.trainerId).toBe(testTrainerId);

      // Step 9: Get trainer's assigned plans
      mockDynamoScan.mockImplementationOnce((params: any, callback: any) => {
        // Mock plan assignments
        callback(null, { 
          Items: [{ 
            assignmentId: 'assignment-1',
            trainerId: testTrainerId,
            planId: testPlanId,
            active: true
          }] 
        });
      });

      mockDynamoGet.mockImplementationOnce((params: any, callback: any) => {
        // Mock plan details
        callback(null, { 
          Item: {
            planId: testPlanId,
            name: 'תוכנית אימונים v3.6',
            description: 'תוכנית אימונים מקיפה',
            trainings: trainingPlan.trainings
          }
        });
      });

      const getTrainerPlansEvent: Partial<APIGatewayProxyEvent> = {
        pathParameters: { trainerId: testTrainerId }
      };

      const trainerPlansResult = await plans.getTrainerPlans(
        getTrainerPlansEvent as APIGatewayProxyEvent,
      );

      expect(trainerPlansResult.statusCode).toBe(200);
      const trainerPlansBody = JSON.parse(trainerPlansResult.body);
      expect(trainerPlansBody.items).toHaveLength(1);
      expect(trainerPlansBody.items[0].name).toBe('תוכנית אימונים v3.6');
      expect(trainerPlansBody.items[0].trainings).toHaveLength(2);
      expect(trainerPlansBody.items[0].trainings[0].exercises[0].exerciseName).toBe('לחיצת חזה, מ. יד, שיפוע 30*');

      // Verify the complete data flow
      console.log('✅ Complete workflow test passed:');
      console.log(`   Coach ID: ${testCoachId}`);
      console.log(`   Trainer ID: ${testTrainerId}`);
      console.log(`   Plan ID: ${testPlanId}`);
      console.log(`   Exercises created: ${testExerciseIds.length}`);
      console.log('   All Hebrew content preserved correctly');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing data gracefully throughout the flow', async () => {
      // Test nickname check with invalid characters
      const invalidNicknameEvent: Partial<APIGatewayProxyEvent> = {
        queryStringParameters: { nickname: '!@#$%^&*()' }
      };

      const invalidResult = await coaches.checkNickname(
        invalidNicknameEvent as APIGatewayProxyEvent,
      );

      expect(invalidResult.statusCode).toBe(200);
      const body = JSON.parse(invalidResult.body);
      expect(body.valid).toBe(false);
    });

    it('should validate training plan structure', async () => {
      const invalidPlanEvent: Partial<APIGatewayProxyEvent> = {
        pathParameters: { coachId: 'test-coach' },
        body: JSON.stringify({
          name: 'Invalid Plan',
          trainings: [] // Empty trainings array
        })
      };

      const result = await plans.createPlan(
        invalidPlanEvent as APIGatewayProxyEvent,
      );

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('Data Integrity and Hebrew Support', () => {
    it('should preserve Hebrew characters and special symbols throughout the system', async () => {
      const hebrewTestData = {
        coachName: 'מתן המאמן הישראלי',
        trainerName: { firstName: 'יוסי', lastName: 'כהן-לוי' },
        exerciseName: 'כפיפות בטן, רגליים מקובעות ב-45°',
        exerciseNote: 'להוסיף משקל על החזה כשאפשר. ירידה בשליטה ⬇️',
        planName: 'תוכנית אימונים מתקדמת 💪'
      };

      // Mock successful saves for all operations
      mockDynamoPut.mockImplementation((params: any, callback: any) => {
        callback(null, {});
      });

      mockDynamoScan.mockImplementation((params: any, callback: any) => {
        callback(null, { Items: [] });
      });

      // Test exercise creation with Hebrew and special characters
      const exerciseEvent: Partial<APIGatewayProxyEvent> = {
        pathParameters: { coachId: 'test-coach' },
        body: JSON.stringify({
          name: hebrewTestData.exerciseName,
          note: hebrewTestData.exerciseNote,
          short: 'בטן'
        })
      };

      const exerciseResult = await exercises.createExercise(
        exerciseEvent as APIGatewayProxyEvent,
      );

      expect(exerciseResult.statusCode).toBe(201);

      // Verify the Hebrew content was stored correctly
      const savedExercise = mockDynamoPut.mock.calls[0][0].Item;
      expect(savedExercise.name).toBe(hebrewTestData.exerciseName);
      expect(savedExercise.note).toBe(hebrewTestData.exerciseNote);
      expect(savedExercise.short).toBe('בטן');
    });
  });
});
