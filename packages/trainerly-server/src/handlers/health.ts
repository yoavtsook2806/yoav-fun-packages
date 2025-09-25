import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { db } from '../services/database';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Health check request:', event);

  try {
    const isHealthy = await db.healthCheck();
    
    if (isHealthy) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          data: { 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'matan-trainings-server',
            stage: process.env.STAGE || 'dev'
          }
        })
      };
    } else {
      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Database health check failed',
          timestamp: new Date().toISOString()
        })
      };
    }
  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      })
    };
  }
};
