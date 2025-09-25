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
    const { name, link, note, short } = requestData;

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

    // Check if exercise name already exists for this coach
    const existingExercises = await db.getExercisesByCoach(coachId);
    const nameExists = existingExercises.some(
      (exercise) => exercise.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    
    if (nameExists) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'DUPLICATE_NAME',
          message: 'Exercise with this name already exists'
        })
      };
    }

    // Check if coach is admin to mark exercise as admin exercise
    const coach = await db.getCoach(coachId);
    const isAdminExercise = coach?.isAdmin || false;

    const exercise: Exercise = {
      exerciseId: randomUUID(),
      coachId,
      name,
      link,
      note,
      short,
      createdAt: new Date().toISOString(),
      isAdminExercise
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

export const deleteExercise = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const { coachId, exerciseId } = event.pathParameters || {};

    if (!coachId || !exerciseId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID and Exercise ID are required'
        })
      };
    }

    // Get exercise to verify ownership
    const exercise = await db.getExercise(exerciseId);
    if (!exercise) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Exercise not found'
        })
      };
    }

    // Verify coach owns this exercise
    if (exercise.coachId !== coachId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'FORBIDDEN',
          message: 'Access denied: Exercise does not belong to this coach'
        })
      };
    }

    // Check if exercise is used in any training plans
    const trainingPlans = await db.getPlansByCoach(coachId);
    const plansUsingExercise = [];
    
    for (const plan of trainingPlans) {
      for (const training of plan.trainings || []) {
        for (const prescribedExercise of training.exercises || []) {
          if (prescribedExercise.exerciseName === exercise.name) {
            plansUsingExercise.push(plan.name);
            break;
          }
        }
        if (plansUsingExercise.includes(plan.name)) break;
      }
    }

    if (plansUsingExercise.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'EXERCISE_IN_USE',
          message: `Cannot delete exercise "${exercise.name}" because it is used in the following training plans: ${plansUsingExercise.join(', ')}. Please remove it from these plans first.`
        })
      };
    }

    // Delete the exercise
    const deleteResult = await db.deleteExercise(exerciseId);
    
    if (!deleteResult) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'Failed to delete exercise'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Exercise deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error deleting exercise:', error);
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

export const updateExercise = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const { coachId, exerciseId } = event.pathParameters || {};

    if (!coachId || !exerciseId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID and Exercise ID are required'
        })
      };
    }

    const requestData = JSON.parse(event.body || '{}');
    const { name, short, note, link } = requestData;

    if (!name || !short) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Exercise name and short description are required'
        })
      };
    }

    // Get existing exercise to verify ownership
    const existingExercise = await db.getExercise(exerciseId);
    if (!existingExercise) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Exercise not found'
        })
      };
    }

    // Verify coach owns this exercise
    if (existingExercise.coachId !== coachId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'FORBIDDEN',
          message: 'Access denied: Exercise does not belong to this coach'
        })
      };
    }

    // Check for duplicate names (excluding current exercise)
    const existingExercises = await db.getExercisesByCoach(coachId);
    const duplicateExercise = existingExercises.find(ex => 
      ex.name === name && ex.exerciseId !== exerciseId
    );

    if (duplicateExercise) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'DUPLICATE_NAME',
          message: 'Exercise with this name already exists'
        })
      };
    }

    // Update the exercise
    const updatedExercise = {
      ...existingExercise,
      name,
      short,
      note: note || '',
      link: link || '',
      updatedAt: new Date().toISOString()
    };

    await db.updateExercise(updatedExercise);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedExercise)
    };

  } catch (error) {
    console.error('Error updating exercise:', error);
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
