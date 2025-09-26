import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { db } from '../services/database';
import { 
  TraineeDataSyncRequest, 
  TraineeDataSyncResponse,
  TraineeDataGetResponse 
} from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

/**
 * Sync comprehensive trainee data to server
 * Rule: All data in local storage must also be saved to server
 * POST /trainers/{trainerId}/data
 */
export const syncTraineeData = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('💾 SYNC TRAINEE DATA - Event:', JSON.stringify(event, null, 2));

  try {
    const traineeId = event.pathParameters?.trainerId;
    
    if (!traineeId) {
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

    const requestData: TraineeDataSyncRequest = JSON.parse(event.body);

    // Verify trainee exists
    const trainer = await db.getTrainer(traineeId);
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

    // Sync comprehensive data
    const success = await db.syncTraineeData(traineeId, {
      exerciseDefaults: requestData.exerciseDefaults,
      trainingProgress: requestData.trainingProgress,
      exerciseHistory: requestData.exerciseHistory,
      firstTimeExperienceCompleted: requestData.firstTimeExperienceCompleted,
      customExerciseData: requestData.customExerciseData
    });

    if (!success) {
      throw new Error('Failed to sync trainee data');
    }

    console.log('✅ SYNC TRAINEE DATA - Success for trainer:', traineeId);
    
    const response: TraineeDataSyncResponse = {
      success: true,
      message: 'Trainee data synced successfully'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ SYNC TRAINEE DATA - Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Failed to sync trainee data'
      })
    };
  }
};

/**
 * Get comprehensive trainee data from server
 * GET /trainers/{trainerId}/data
 */
export const getTraineeData = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('📥 GET TRAINEE DATA - Event:', JSON.stringify(event, null, 2));

  try {
    const traineeId = event.pathParameters?.trainerId;
    
    if (!traineeId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Trainer ID is required'
        })
      };
    }

    // Verify trainee exists
    const trainer = await db.getTrainer(traineeId);
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

    // Get comprehensive data
    const data = await db.getTraineeDataForResponse(traineeId);

    console.log(`✅ GET TRAINEE DATA - Success for trainer ${traineeId}`);
    
    const response: TraineeDataGetResponse = data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ GET TRAINEE DATA - Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Failed to get trainee data'
      })
    };
  }
};
