import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { db } from '../services/database';
import { 
  ExerciseSession, 
  ExerciseSessionCreateRequest, 
  ExerciseSessionCreateResponse,
  ExerciseSessionListResponse 
} from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

/**
 * Create a new exercise session for a trainee
 * POST /trainers/{trainerId}/exercise-sessions
 */
export const createExerciseSession = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('🏋️ CREATE EXERCISE SESSION - Event:', JSON.stringify(event, null, 2));

  try {
    const trainerId = event.pathParameters?.trainerId;
    
    if (!trainerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Trainer ID is required'
        })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Request body is required'
        })
      };
    }

    const requestData: ExerciseSessionCreateRequest = JSON.parse(event.body);
    const { 
      exerciseName, 
      trainingType, 
      completedAt, 
      totalSets, 
      completedSets, 
      setsData, 
      restTime 
    } = requestData;

    // Validate required fields
    if (!exerciseName || !trainingType || !completedAt || totalSets === undefined || completedSets === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Missing required fields: exerciseName, trainingType, completedAt, totalSets, completedSets'
        })
      };
    }

    // Verify trainee exists
    const trainer = await db.getTrainer(trainerId);
    if (!trainer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Trainer not found'
        })
      };
    }

    // Create exercise session
    const sessionId = randomUUID();
    const session: ExerciseSession = {
      sessionId,
      trainerId,
      coachId: trainer.coachId,
      exerciseName,
      trainingType,
      completedAt,
      totalSets,
      completedSets,
      setsData: setsData || [],
      restTime,
      createdAt: new Date().toISOString()
    };

    const success = await db.saveExerciseSession(session);
    if (!success) {
      throw new Error('Failed to save exercise session');
    }

    console.log('✅ CREATE EXERCISE SESSION - Success:', sessionId);
    
    const response: ExerciseSessionCreateResponse = {
      sessionId
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ CREATE EXERCISE SESSION - Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create exercise session'
      })
    };
  }
};

/**
 * Get exercise sessions for a trainee
 * GET /trainers/{trainerId}/exercise-sessions
 */
export const getExerciseSessions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('📋 GET EXERCISE SESSIONS - Event:', JSON.stringify(event, null, 2));

  try {
    const trainerId = event.pathParameters?.trainerId;
    
    if (!trainerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Trainer ID is required'
        })
      };
    }

    // Optional limit parameter
    const limit = event.queryStringParameters?.limit 
      ? parseInt(event.queryStringParameters.limit, 10) 
      : undefined;

    // Verify trainee exists
    const trainer = await db.getTrainer(trainerId);
    if (!trainer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Trainer not found'
        })
      };
    }

    // Get exercise sessions
    const sessions = await db.getExerciseSessionsByTrainer(trainerId, limit);

    console.log(`✅ GET EXERCISE SESSIONS - Found ${sessions.length} sessions for trainer ${trainerId}`);
    
    const response: ExerciseSessionListResponse = {
      items: sessions
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ GET EXERCISE SESSIONS - Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Failed to get exercise sessions'
      })
    };
  }
};

/**
 * Get exercise sessions for a trainee (coach view)
 * GET /coaches/{coachId}/trainers/{trainerId}/exercise-sessions
 */
export const getTrainerExerciseSessions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('👨‍🏫 GET TRAINER EXERCISE SESSIONS - Event:', JSON.stringify(event, null, 2));

  try {
    const coachId = event.pathParameters?.coachId;
    const trainerId = event.pathParameters?.trainerId;
    
    if (!coachId || !trainerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID and Trainer ID are required'
        })
      };
    }

    // Optional limit parameter
    const limit = event.queryStringParameters?.limit 
      ? parseInt(event.queryStringParameters.limit, 10) 
      : undefined;

    // Verify coach exists
    const coach = await db.getCoach(coachId);
    if (!coach) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Coach not found'
        })
      };
    }

    // Verify trainee exists and belongs to this coach
    const trainer = await db.getTrainer(trainerId);
    if (!trainer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Trainer not found'
        })
      };
    }

    if (trainer.coachId !== coachId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'FORBIDDEN',
          message: 'Trainer does not belong to this coach'
        })
      };
    }

    // Get exercise sessions
    const sessions = await db.getExerciseSessionsByTrainer(trainerId, limit);

    console.log(`✅ GET TRAINER EXERCISE SESSIONS - Found ${sessions.length} sessions for trainer ${trainerId}`);
    
    const response: ExerciseSessionListResponse = {
      items: sessions
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ GET TRAINER EXERCISE SESSIONS - Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Failed to get trainer exercise sessions'
      })
    };
  }
};
