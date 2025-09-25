import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database';
import { 
  PlanCreateRequest, 
  PlanCreateResponse, 
  PlanListResponse,
  PlanAssignResponse,
  TrainerPlansListResponse,
  TrainingPlan,
  PlanAssignment 
} from '../types';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

export const createPlan = async (
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

    const requestData: PlanCreateRequest = JSON.parse(event.body);
    const { name, description, trainings } = requestData;

    if (!name || !trainings || trainings.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Name and trainings are required'
        })
      };
    }

    // TODO: Verify JWT token and check if coach exists and is valid

    const plan: TrainingPlan = {
      planId: uuidv4(),
      coachId,
      name,
      description,
      trainings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.savePlan(plan);

    const response: PlanCreateResponse = {
      planId: plan.planId
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error creating plan:', error);
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

export const listPlans = async (
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

    const plans = await db.getPlansByCoach(coachId);

    const response: PlanListResponse = {
      items: plans.map(plan => ({
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        trainingsCount: plan.trainings?.length || 0,
        createdAt: plan.createdAt
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error listing plans:', error);
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

export const assignPlan = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const coachId = event.pathParameters?.coachId;
    const trainerId = event.pathParameters?.trainerId;
    const planId = event.pathParameters?.planId;
    
    if (!coachId || !trainerId || !planId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID, Trainer ID and Plan ID are required'
        })
      };
    }

    // TODO: Verify JWT token and check if coach exists and is valid

    // Security check: Verify that both the trainer and plan belong to the requesting coach
    const [trainer, plan] = await Promise.all([
      db.getTrainer(trainerId),
      db.getPlan(planId)
    ]);

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

    if (!plan) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Plan not found'
        })
      };
    }

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

    if (plan.coachId !== coachId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'FORBIDDEN',
          message: 'Access denied: Plan does not belong to this coach'
        })
      };
    }

    const assignment: PlanAssignment = {
      assignmentId: uuidv4(),
      trainerId,
      planId,
      assignedAt: new Date().toISOString(),
      active: true
    };

    await db.savePlanAssignment(assignment);

    const response: PlanAssignResponse = {
      assignmentId: assignment.assignmentId,
      trainerId: assignment.trainerId,
      planId: assignment.planId,
      assignedAt: assignment.assignedAt,
      active: assignment.active
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error assigning plan:', error);
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

export const getTrainerPlans = async (
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

    const plans = await db.getPlansByTrainer(trainerId);

    const response: TrainerPlansListResponse = {
      items: plans.map(plan => ({
        planId: plan.planId,
        name: plan.name,
        description: plan.description,
        trainings: plan.trainings
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting trainer plans:', error);
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
