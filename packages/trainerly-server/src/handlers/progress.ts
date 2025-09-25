import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { db } from '../services/database';
import { 
  ProgressCreateRequest, 
  ProgressCreateResponse,
  TrainingProgress 
} from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export const createProgress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

    const requestData: ProgressCreateRequest = JSON.parse(event.body);
    const { planId, trainingId, performedAt, exercises } = requestData;

    if (!planId || !trainingId || !performedAt || !exercises || exercises.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Plan ID, training ID, performed date, and exercises are required'
        })
      };
    }

    const progress: TrainingProgress = {
      progressId: randomUUID(),
      trainerId,
      planId,
      trainingId,
      performedAt,
      exercises,
      createdAt: new Date().toISOString()
    };

    await db.saveProgress(progress);

    const response: ProgressCreateResponse = {
      progressId: progress.progressId
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error creating progress:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      })
    };
  }
};

export const getTrainerProgress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

    const queryParams = event.queryStringParameters || {};
    const filters = {
      planId: queryParams.planId,
      trainingId: queryParams.trainingId,
      from: queryParams.from,
      to: queryParams.to
    };

    const progressEntries = await db.getProgressByTrainer(trainerId, filters);

    const response = {
      items: progressEntries.map(progress => ({
        progressId: progress.progressId,
        planId: progress.planId,
        trainingId: progress.trainingId,
        performedAt: progress.performedAt,
        exercises: progress.exercises
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting trainer progress:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      })
    };
  }
};

export const getCoachViewProgress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

    // Verify that this trainer belongs to this coach
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

    // Security check: Verify that this trainer belongs to the requesting coach
    if (trainer.coachId !== coachId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'FORBIDDEN',
          message: 'Access denied: Trainer does not belong to this coach'
        })
      };
    }

    const queryParams = event.queryStringParameters || {};
    const filters = {
      from: queryParams.from,
      to: queryParams.to
    };

    const progressEntries = await db.getProgressByTrainer(trainerId, filters);

    const response = {
      trainer: {
        trainerId: trainer.trainerId,
        firstName: trainer.firstName,
        lastName: trainer.lastName
      },
      items: progressEntries.map(progress => ({
        progressId: progress.progressId,
        planId: progress.planId,
        trainingId: progress.trainingId,
        performedAt: progress.performedAt,
        exercises: progress.exercises
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting coach view progress:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      })
    };
  }
};
