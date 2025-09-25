import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../src/services/database';
import { SaveExerciseDataResponse, GetUserDataResponse, ExerciseCompletionData } from '../../src/types';

// Validation schemas
const ExerciseCompletionDataSchema = z.object({
  userId: z.string(),
  exerciseName: z.string(),
  trainingType: z.string(),
  date: z.string(),
  weight: z.number().optional(),
  repeats: z.number().optional(),
  restTime: z.number(),
  setsData: z.array(z.object({
    weight: z.number().optional(),
    repeats: z.number().optional()
  })).optional(),
  completed: z.boolean(),
  timestamp: z.string()
});

const SaveExerciseDataSchema = z.object({
  exerciseData: ExerciseCompletionDataSchema
});

const GetUserDataSchema = z.object({
  userId: z.string(),
  fromDate: z.string().optional(),
  toDate: z.string().optional()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // Save exercise data
      const validation = SaveExerciseDataSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: validation.error.errors,
          timestamp: new Date().toISOString()
        });
      }

      const { exerciseData } = validation.data;
      
      // Ensure timestamp is current if not provided
      if (!exerciseData.timestamp) {
        exerciseData.timestamp = new Date().toISOString();
      }

      const saved = await db.saveExerciseData(exerciseData);
      
      if (saved) {
        // Add user to users list if not already there
        await db.addUser(exerciseData.userId);
        
        const response: SaveExerciseDataResponse = {
          success: true,
          data: { saved: true },
          timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
      } else {
        const response: SaveExerciseDataResponse = {
          success: false,
          error: 'Failed to save exercise data',
          timestamp: new Date().toISOString()
        };
        
        res.status(500).json(response);
      }
      
    } else if (req.method === 'GET') {
      // Get user data
      const validation = GetUserDataSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors,
          timestamp: new Date().toISOString()
        });
      }

      const { userId, fromDate, toDate } = validation.data;
      
      // Get user profile
      let profile = await db.getUserProfile(userId);
      if (!profile) {
        // Create default profile if doesn't exist
        profile = {
          userId,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        await db.saveUserProfile(profile);
        await db.addUser(userId);
      }
      
      // Get exercise data
      const exerciseData = await db.getUserExerciseData(userId, fromDate, toDate);
      
      const response: GetUserDataResponse = {
        success: true,
        data: {
          profile,
          exerciseData
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
      
    } else {
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error in exercise-data endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
