import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../src/services/database';
import { GetTrainingPlansResponse } from '../../src/types';

// Validation schema
const GetTrainingPlansSchema = z.object({
  currentVersion: z.string().optional()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Validate query parameters
    const validation = GetTrainingPlansSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors,
        timestamp: new Date().toISOString()
      });
    }

    const { currentVersion } = validation.data;
    
    // Get all training plans from database
    const allPlans = await db.getTrainingPlans();
    
    let plansToReturn = allPlans;
    
    if (currentVersion) {
      // Filter to return only plans newer than current version
      plansToReturn = allPlans.filter(plan => {
        return compareVersions(plan.version, currentVersion) > 0;
      });
      
      console.log(`Returning ${plansToReturn.length} plans newer than ${currentVersion}`);
    } else {
      console.log(`Returning all ${plansToReturn.length} plans`);
    }

    const response: GetTrainingPlansResponse = {
      success: true,
      data: plansToReturn,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error fetching training plans:', error);
    
    const response: GetTrainingPlansResponse = {
      success: false,
      error: 'Failed to fetch training plans',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
}

/**
 * Compare two version strings (e.g., "3.6" vs "3.7")
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  const maxLength = Math.max(aParts.length, bParts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  
  return 0;
}
