import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { db } from '../services/database';

/**
 * Admin handler for database operations
 * WARNING: These endpoints should be protected in production!
 */

export const clearDatabase = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log('🗑️  Clear database request received');
    
    // In production, you should add authentication here
    // For now, we'll add a simple confirmation parameter
    const confirm = event.queryStringParameters?.confirm;
    
    if (confirm !== 'yes-delete-everything') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
        },
        body: JSON.stringify({
          error: 'Missing confirmation',
          message: 'Add ?confirm=yes-delete-everything to confirm database deletion',
          warning: 'This will permanently delete ALL data!'
        })
      };
    }
    
    const success = await db.clearAllDB();
    
    if (success) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
        },
        body: JSON.stringify({
          message: 'Database cleared successfully',
          timestamp: new Date().toISOString()
        })
      };
    } else {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
        },
        body: JSON.stringify({
          error: 'Failed to clear database',
          message: 'Check server logs for details'
        })
      };
    }
  } catch (error) {
    console.error('Error in clearDatabase:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
