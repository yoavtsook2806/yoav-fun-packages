"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoachViewProgress = exports.getTrainerProgress = exports.createProgress = void 0;
const crypto_1 = require("crypto");
const database_1 = require("../services/database");
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
const createProgress = async (event) => {
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
        const requestData = JSON.parse(event.body);
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
        const progress = {
            progressId: (0, crypto_1.randomUUID)(),
            trainerId,
            planId,
            trainingId,
            performedAt,
            exercises,
            createdAt: new Date().toISOString()
        };
        await database_1.db.saveProgress(progress);
        const response = {
            progressId: progress.progressId
        };
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(response)
        };
    }
    catch (error) {
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
exports.createProgress = createProgress;
const getTrainerProgress = async (event) => {
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
        const progressEntries = await database_1.db.getProgressByTrainer(trainerId, filters);
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
    }
    catch (error) {
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
exports.getTrainerProgress = getTrainerProgress;
const getCoachViewProgress = async (event) => {
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
        const trainer = await database_1.db.getTrainer(trainerId);
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
        const progressEntries = await database_1.db.getProgressByTrainer(trainerId, filters);
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
    }
    catch (error) {
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
exports.getCoachViewProgress = getCoachViewProgress;
//# sourceMappingURL=progress.js.map