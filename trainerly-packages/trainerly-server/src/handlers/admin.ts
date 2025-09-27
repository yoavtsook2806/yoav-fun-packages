import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { db } from '../services/database';

/**
 * Admin handler for database operations and admin exercise/plan management
 * WARNING: These endpoints should be protected in production!
 */

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

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
        headers,
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
        headers,
        body: JSON.stringify({
          message: 'Database cleared successfully',
          timestamp: new Date().toISOString()
        })
      };
    } else {
      return {
        statusCode: 500,
        headers,
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
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

/**
 * Get all admin exercises (created by admin coaches)
 */
export const getAdminExercises = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log('📋 Get admin exercises request received');
    
    // Get all exercises marked as admin exercises
    const adminExercises = await db.getAdminExercises();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: adminExercises,
        count: adminExercises.length
      })
    };
  } catch (error) {
    console.error('Error in getAdminExercises:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

