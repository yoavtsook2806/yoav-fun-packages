import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { db } from '../services/database';
import { SaveExerciseDataResponse, GetUserDataResponse, ExerciseCompletionData } from '../types';

// Validation schemas
const ExerciseCompletionDataSchema = z.object({
  userId: z.string(),
  exerciseName: z.string(),
  trainingType: z.string(),
  date: z.string(),
  weight: z.number().optional(),
  repeats: z.number().optional(),
  restTime: z.number(),
  setsData: z.array(z.object({
    weight: z.number().optional(),
    repeats: z.number().optional()
  })).optional(),
  completed: z.boolean(),
  timestamp: z.string().optional()
});

const SaveExerciseDataSchema = z.object({
  exerciseData: ExerciseCompletionDataSchema
});

const GetUserDataSchema = z.object({
  userId: z.string(),
  fromDate: z.string().optional(),
  toDate: z.string().optional()
});

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export const saveExerciseData = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Save exercise data request:', event);

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Request body is required',
          timestamp: new Date().toISOString()
        })
      };
    }

    const body = JSON.parse(event.body);
    const validation = SaveExerciseDataSchema.safeParse(body);
    
    if (!validation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid request body',
          details: validation.error.errors,
          timestamp: new Date().toISOString()
        })
      };
    }

    const { exerciseData } = validation.data;
    
    // Ensure timestamp is set
    const completeExerciseData: ExerciseCompletionData = {
      ...exerciseData,
      timestamp: exerciseData.timestamp || new Date().toISOString()
    };

    const saved = await db.saveExerciseData(completeExerciseData);
    
    if (saved) {
      const response: SaveExerciseDataResponse = {
        success: true,
        data: { saved: true },
        timestamp: new Date().toISOString()
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
    } else {
      const response: SaveExerciseDataResponse = {
        success: false,
        error: 'Failed to save exercise data',
        timestamp: new Date().toISOString()
      };
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify(response)
      };
    }
    
  } catch (error) {
    console.error('Error in saveExerciseData:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      })
    };
  }
};

export const getUserData = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Get user data request:', event);

  try {
    const validation = GetUserDataSchema.safeParse(event.queryStringParameters || {});
    if (!validation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors,
          timestamp: new Date().toISOString()
        })
      };
    }

    const { userId, fromDate, toDate } = validation.data;
    
    // Get user profile
    let profile = await db.getUserProfile(userId);
    if (!profile) {
      // Create default profile if doesn't exist
      profile = {
        userId,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      await db.saveUserProfile(profile);
    }
    
    // Get exercise data
    const exerciseData = await db.getUserExerciseData(userId, fromDate, toDate);
    
    const response: GetUserDataResponse = {
      success: true,
      data: {
        profile,
        exerciseData
      },
      timestamp: new Date().toISOString()
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error in getUserData:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      })
    };
  }
};
