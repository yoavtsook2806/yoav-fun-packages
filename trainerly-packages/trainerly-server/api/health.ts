import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/services/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const isHealthy = await db.healthCheck();
    
    if (isHealthy) {
      res.status(200).json({
        success: true,
        data: { 
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'matan-trainings-server'
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'Database health check failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
