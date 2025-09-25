"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserData = exports.saveExerciseData = void 0;
const zod_1 = require("zod");
const database_1 = require("../services/database");
// Validation schemas
const ExerciseCompletionDataSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    exerciseName: zod_1.z.string(),
    trainingType: zod_1.z.string(),
    date: zod_1.z.string(),
    weight: zod_1.z.number().optional(),
    repeats: zod_1.z.number().optional(),
    restTime: zod_1.z.number(),
    setsData: zod_1.z.array(zod_1.z.object({
        weight: zod_1.z.number().optional(),
        repeats: zod_1.z.number().optional()
    })).optional(),
    completed: zod_1.z.boolean(),
    timestamp: zod_1.z.string().optional()
});
const SaveExerciseDataSchema = zod_1.z.object({
    exerciseData: ExerciseCompletionDataSchema
});
const GetUserDataSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    fromDate: zod_1.z.string().optional(),
    toDate: zod_1.z.string().optional()
});
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
const saveExerciseData = async (event) => {
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
        const completeExerciseData = {
            ...exerciseData,
            timestamp: exerciseData.timestamp || new Date().toISOString()
        };
        const saved = await database_1.db.saveExerciseData(completeExerciseData);
        if (saved) {
            const response = {
                success: true,
                data: { saved: true },
                timestamp: new Date().toISOString()
            };
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(response)
            };
        }
        else {
            const response = {
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
    }
    catch (error) {
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
exports.saveExerciseData = saveExerciseData;
const getUserData = async (event) => {
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
        let profile = await database_1.db.getUserProfile(userId);
        if (!profile) {
            // Create default profile if doesn't exist
            profile = {
                userId,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };
            await database_1.db.saveUserProfile(profile);
        }
        // Get exercise data
        const exerciseData = await database_1.db.getUserExerciseData(userId, fromDate, toDate);
        const response = {
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
    }
    catch (error) {
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
exports.getUserData = getUserData;
//# sourceMappingURL=user.js.map