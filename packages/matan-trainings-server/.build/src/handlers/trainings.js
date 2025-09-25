"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTrainingPlan = exports.getLatest = void 0;
// import { z } from 'zod';
const database_1 = require("../services/database");
// Validation schemas - temporarily disabled
// const GetTrainingPlansSchema = z.object({
//   currentVersion: z.string().optional()
// });
// const ExerciseSchema = z.object({
//   numberOfSets: z.number(),
//   link: z.string().optional(),
//   minimumTimeToRest: z.number(),
//   maximumTimeToRest: z.number(),
//   minimumNumberOfRepeasts: z.number(),
//   maximumNumberOfRepeasts: z.number(),
//   note: z.string(),
//   short: z.string()
// });
// const AddTrainingPlanSchema = z.object({
//   trainingId: z.string(),
//   trainingData: z.record(z.record(ExerciseSchema)),
//   name: z.string().optional()
// });
const getLatest = async (event) => {
    console.log('Get training plans request:', event);
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    try {
        // Simple parsing instead of zod validation
        const currentVersion = event.queryStringParameters?.currentVersion;
        // Get all training plans from database
        const allPlans = await database_1.db.getTrainingPlans();
        let plansToReturn = allPlans;
        if (currentVersion) {
            // Filter to return only plans newer than current version
            plansToReturn = allPlans.filter(plan => {
                return compareVersions(plan.version, currentVersion) > 0;
            });
            console.log(`Returning ${plansToReturn.length} plans newer than ${currentVersion}`);
        }
        else {
            console.log(`Returning all ${plansToReturn.length} plans`);
        }
        const response = {
            success: true,
            data: plansToReturn,
            timestamp: new Date().toISOString()
        };
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
    }
    catch (error) {
        console.error('Error fetching training plans:', error);
        const response = {
            success: false,
            error: 'Failed to fetch training plans',
            timestamp: new Date().toISOString()
        };
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify(response)
        };
    }
};
exports.getLatest = getLatest;
const addTrainingPlan = async (event) => {
    console.log('Add training plan request:', event);
    console.log('Request body:', event.body);
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    try {
        // Parse and validate request body
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
        const requestData = JSON.parse(event.body);
        // Simple parsing instead of zod validation
        const { trainingId, trainingData, name } = requestData;
        // Create training plan object
        const trainingPlan = {
            version: trainingId,
            name: name || `Training Plan ${trainingId}`,
            trainings: trainingData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // Save to database
        const saved = await database_1.db.saveTrainingPlan(trainingPlan);
        if (saved) {
            console.log(`✅ Training plan ${trainingId} saved successfully`);
            const response = {
                success: true,
                data: { saved: true, version: trainingId },
                timestamp: new Date().toISOString()
            };
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(response)
            };
        }
        else {
            console.log(`❌ Failed to save training plan ${trainingId}`);
            const response = {
                success: false,
                error: 'Failed to save training plan to database',
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
        console.error('Error adding training plan:', error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: new Date().toISOString()
        };
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify(response)
        };
    }
};
exports.addTrainingPlan = addTrainingPlan;
/**
 * Compare two version strings (e.g., "3.6" vs "3.7")
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a, b) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    const maxLength = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < maxLength; i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        if (aPart < bPart)
            return -1;
        if (aPart > bPart)
            return 1;
    }
    return 0;
}
//# sourceMappingURL=trainings.js.map