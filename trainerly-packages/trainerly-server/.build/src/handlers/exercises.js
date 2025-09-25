"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listExercises = exports.createExercise = void 0;
const crypto_1 = require("crypto");
const database_1 = require("../services/database");
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
const createExercise = async (event) => {
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
        const exercise = {
            exerciseId: (0, crypto_1.randomUUID)(),
            coachId,
            name,
            link,
            note,
            short,
            muscleGroup: muscleGroup, // Type assertion to handle string vs enum
            createdAt: new Date().toISOString()
        };
        await database_1.db.saveExercise(exercise);
        const response = {
            exerciseId: exercise.exerciseId
        };
        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(response)
        };
    }
    catch (error) {
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
exports.createExercise = createExercise;
const listExercises = async (event) => {
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
        const exercises = await database_1.db.getExercisesByCoach(coachId);
        const response = {
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
    }
    catch (error) {
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
exports.listExercises = listExercises;
//# sourceMappingURL=exercises.js.map