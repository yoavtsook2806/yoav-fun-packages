import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { db } from '../services/database';
import { 
  ExerciseCreateRequest, 
  ExerciseCreateResponse, 
  ExerciseListResponse,
  Exercise 
} from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export const createExercise = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const coachId = event.pathParameters?.coachId;
    
    if (!coachId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID is required'
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

    const requestData: ExerciseCreateRequest = JSON.parse(event.body);
    const { name, link, note, short, muscleGroup } = requestData;

    if (!name || !short) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Name and short description are required'
        })
      };
    }

    // TODO: Verify JWT token and check if coach exists and is valid

    const exercise: Exercise = {
      exerciseId: randomUUID(),
      coachId,
      name,
      link,
      note,
      short,
      muscleGroup: muscleGroup as any, // Type assertion to handle string vs enum
      createdAt: new Date().toISOString()
    };

    await db.saveExercise(exercise);

    const response: ExerciseCreateResponse = {
      exerciseId: exercise.exerciseId
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error creating exercise:', error);
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

export const listExercises = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const coachId = event.pathParameters?.coachId;
    
    if (!coachId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID is required'
        })
      };
    }

    // TODO: Verify JWT token and check if coach exists and is valid

    const exercises = await db.getExercisesByCoach(coachId);

    const response: ExerciseListResponse = {
      items: exercises.map(exercise => ({
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        link: exercise.link,
        note: exercise.note,
        short: exercise.short,
        muscleGroup: exercise.muscleGroup,
        createdAt: exercise.createdAt
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error listing exercises:', error);
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
