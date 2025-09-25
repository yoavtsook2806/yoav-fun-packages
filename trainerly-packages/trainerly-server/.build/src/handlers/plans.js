"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrainerPlans = exports.assignPlan = exports.listPlans = exports.createPlan = void 0;
const crypto_1 = require("crypto");
const database_1 = require("../services/database");
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
const createPlan = async (event) => {
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
        const requestData = JSON.parse(event.body);
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
        const plan = {
            planId: (0, crypto_1.randomUUID)(),
            coachId,
            name,
            description,
            trainings,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await database_1.db.savePlan(plan);
        const response = {
            planId: plan.planId
        };
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(response)
        };
    }
    catch (error) {
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
exports.createPlan = createPlan;
const listPlans = async (event) => {
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
        const plans = await database_1.db.getPlansByCoach(coachId);
        const response = {
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
    }
    catch (error) {
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
exports.listPlans = listPlans;
const assignPlan = async (event) => {
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
            database_1.db.getTrainer(trainerId),
            database_1.db.getPlan(planId)
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
        const assignment = {
            assignmentId: (0, crypto_1.randomUUID)(),
            trainerId,
            planId,
            assignedAt: new Date().toISOString(),
            active: true
        };
        await database_1.db.savePlanAssignment(assignment);
        const response = {
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
    }
    catch (error) {
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
exports.assignPlan = assignPlan;
const getTrainerPlans = async (event) => {
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
        const plans = await database_1.db.getPlansByTrainer(trainerId);
        const response = {
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
    }
    catch (error) {
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
exports.getTrainerPlans = getTrainerPlans;
//# sourceMappingURL=plans.js.map