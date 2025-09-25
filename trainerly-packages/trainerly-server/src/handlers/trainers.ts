import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { db } from '../services/database';
import { 
  TrainerCreateRequest, 
  TrainerCreateResponse, 
  TrainerIdentifyRequest,
  TrainerIdentifyResponse,
  TrainerListResponse,
  Trainer 
} from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Generate a simple trainer code (6 characters)
function generateTrainerCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createTrainer = async (
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

    const requestData: TrainerCreateRequest = JSON.parse(event.body);
    const { firstName, lastName, email } = requestData;

    if (!firstName || !lastName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'First name and last name are required'
        })
      };
    }

    // TODO: Verify JWT token and check if coach exists and is valid

    // Generate unique trainer code
    let trainerCode: string;
    let isUnique = false;
    do {
      trainerCode = generateTrainerCode();
      const existing = await db.getTrainerByCode(trainerCode);
      isUnique = !existing;
    } while (!isUnique);

    const trainer: Trainer = {
      trainerId: randomUUID(),
      coachId,
      firstName,
      lastName,
      email,
      trainerCode,
      createdAt: new Date().toISOString()
    };

    await db.saveTrainer(trainer);

    const response: TrainerCreateResponse = {
      trainerId: trainer.trainerId
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error creating trainer:', error);
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

export const listTrainers = async (
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

    const trainers = await db.getTrainersByCoach(coachId);

    const response: TrainerListResponse = {
      items: trainers.map(trainer => ({
        trainerId: trainer.trainerId,
        firstName: trainer.firstName,
        lastName: trainer.lastName,
        email: trainer.email,
        createdAt: trainer.createdAt
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error listing trainers:', error);
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

export const getTrainer = async (
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

    // TODO: Verify JWT token and check if coach exists and is valid

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

    const response = {
      trainerId: trainer.trainerId,
      coachId: trainer.coachId,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      createdAt: trainer.createdAt
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting trainer:', error);
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

export const identifyTrainer = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
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

    const requestData: TrainerIdentifyRequest = JSON.parse(event.body);
    const { coachNickname, firstName, lastName, trainerCode } = requestData;

    let trainer: Trainer | null = null;

    if (trainerCode) {
      // Option 2: Identify by trainer code
      trainer = await db.getTrainerByCode(trainerCode);
    } else if (coachNickname && firstName && lastName) {
      // Option 1: Identify by coach nickname + trainer name
      const coach = await db.getCoachByNickname(coachNickname.toLowerCase().trim());
      if (coach) {
        const trainers = await db.getTrainersByCoach(coach.coachId);
        trainer = trainers.find(t => 
          t.firstName.toLowerCase() === firstName.toLowerCase() &&
          t.lastName.toLowerCase() === lastName.toLowerCase()
        ) || null;
      }
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Either provide trainerCode OR (coachNickname + firstName + lastName)'
        })
      };
    }

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

    const response: TrainerIdentifyResponse = {
      trainerId: trainer.trainerId
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error identifying trainer:', error);
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
