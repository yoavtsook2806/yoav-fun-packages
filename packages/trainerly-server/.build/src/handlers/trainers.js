"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyTrainer = exports.getTrainer = exports.listTrainers = exports.createTrainer = void 0;
const crypto_1 = require("crypto");
const database_1 = require("../services/database");
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
// Generate a simple trainer code (6 characters)
function generateTrainerCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
const createTrainer = async (event) => {
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
        let trainerCode;
        let isUnique = false;
        do {
            trainerCode = generateTrainerCode();
            const existing = await database_1.db.getTrainerByCode(trainerCode);
            isUnique = !existing;
        } while (!isUnique);
        const trainer = {
            trainerId: (0, crypto_1.randomUUID)(),
            coachId,
            firstName,
            lastName,
            email,
            trainerCode,
            createdAt: new Date().toISOString()
        };
        await database_1.db.saveTrainer(trainer);
        const response = {
            trainerId: trainer.trainerId
        };
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(response)
        };
    }
    catch (error) {
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
exports.createTrainer = createTrainer;
const listTrainers = async (event) => {
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
        const trainers = await database_1.db.getTrainersByCoach(coachId);
        const response = {
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
    }
    catch (error) {
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
exports.listTrainers = listTrainers;
const getTrainer = async (event) => {
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
    }
    catch (error) {
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
exports.getTrainer = getTrainer;
const identifyTrainer = async (event) => {
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
        const requestData = JSON.parse(event.body);
        const { coachNickname, firstName, lastName, trainerCode } = requestData;
        let trainer = null;
        if (trainerCode) {
            // Option 2: Identify by trainer code
            trainer = await database_1.db.getTrainerByCode(trainerCode);
        }
        else if (coachNickname && firstName && lastName) {
            // Option 1: Identify by coach nickname + trainer name
            const coach = await database_1.db.getCoachByNickname(coachNickname.toLowerCase().trim());
            if (coach) {
                const trainers = await database_1.db.getTrainersByCoach(coach.coachId);
                trainer = trainers.find(t => t.firstName.toLowerCase() === firstName.toLowerCase() &&
                    t.lastName.toLowerCase() === lastName.toLowerCase()) || null;
            }
        }
        else {
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
        const response = {
            trainerId: trainer.trainerId
        };
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
    }
    catch (error) {
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
exports.identifyTrainer = identifyTrainer;
//# sourceMappingURL=trainers.js.map