import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { db } from '../services/database';
import { 
  PlanCreateRequest, 
  PlanCreateResponse, 
  PlanListResponse,
  TrainerPlansListResponse,
  TrainingPlan
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
      planId: randomUUID(),
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
        isAdminPlan: plan.isAdminPlan,
        originalPlanId: plan.originalPlanId,
        customTrainee: plan.customTrainee,
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
      db.getTrainingPlan(planId)
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

    // Add planId to trainer's plans array (last one is current)
    const updatedPlans = trainer.plans ? [...trainer.plans, planId] : [planId];
    const updatedTrainer = {
      ...trainer,
      plans: updatedPlans
    };

    await db.saveTrainer(updatedTrainer);

    const response = {
      trainerId,
      planId,
      assignedAt: new Date().toISOString(),
      currentPlan: planId
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

/**
 * Make a custom training plan generic (remove trainee specificity)
 */
export const makeCustomPlanGeneric = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const coachId = event.pathParameters?.coachId;
    const planId = event.pathParameters?.planId;

    if (!coachId || !planId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID and plan ID are required'
        })
      };
    }

    // Get the training plan
    const plan = await db.getTrainingPlan(planId);
    if (!plan || plan.coachId !== coachId) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Training plan not found or not owned by coach'
        })
      };
    }

    if (!plan.customTrainee) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Plan is already generic'
        })
      };
    }

    // Make the plan generic by removing customTrainee and updating the name
    const updatedPlan = {
      ...plan,
      customTrainee: undefined,
      name: plan.name.replace(/ - .+$/, ''), // Remove trainee name from plan name
      updatedAt: new Date().toISOString()
    };

    const success = await db.updateTrainingPlan(updatedPlan);
    if (!success) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'Failed to make plan generic'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedPlan)
    };
  } catch (error) {
    console.error('Error making custom plan generic:', error);
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

/**
 * Get single training plan by ID
 */
export const getTrainingPlan = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const coachId = event.pathParameters?.coachId;
    const planId = event.pathParameters?.planId;

    if (!coachId || !planId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID and plan ID are required'
        })
      };
    }

    const plan = await db.getTrainingPlan(planId);
    if (!plan || plan.coachId !== coachId) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Training plan not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(plan)
    };
  } catch (error) {
    console.error('Error getting training plan:', error);
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

/**
 * Update training plan
 */
export const updateTrainingPlan = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const coachId = event.pathParameters?.coachId;
    const planId = event.pathParameters?.planId;

    if (!coachId || !planId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID and plan ID are required'
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

    const updateData = JSON.parse(event.body);

    // Get existing plan
    const existingPlan = await db.getTrainingPlan(planId);
    if (!existingPlan || existingPlan.coachId !== coachId) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Training plan not found'
        })
      };
    }

    // Update plan
    const updatedPlan = {
      ...existingPlan,
      ...updateData,
      planId, // Ensure ID doesn't change
      coachId, // Ensure coach doesn't change
      updatedAt: new Date().toISOString()
    };

    const success = await db.updateTrainingPlan(updatedPlan);
    if (!success) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'Failed to update training plan'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedPlan)
    };
  } catch (error) {
    console.error('Error updating training plan:', error);
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

/**
 * Delete training plan
 */
export const deleteTrainingPlan = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const coachId = event.pathParameters?.coachId;
    const planId = event.pathParameters?.planId;

    if (!coachId || !planId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID and plan ID are required'
        })
      };
    }

    // Check if plan exists and belongs to coach
    const existingPlan = await db.getTrainingPlan(planId);
    if (!existingPlan || existingPlan.coachId !== coachId) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Training plan not found'
        })
      };
    }

    const success = await db.deleteTrainingPlan(planId);
    if (!success) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'Failed to delete training plan'
        })
      };
    }

    return {
      statusCode: 204,
      headers,
      body: ''
    };
  } catch (error) {
    console.error('Error deleting training plan:', error);
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
