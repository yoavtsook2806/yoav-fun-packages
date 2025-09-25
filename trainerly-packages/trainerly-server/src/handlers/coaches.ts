import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
// Note: bcrypt and jwt only needed for coach creation/login, not nickname check
// import * as bcrypt from 'bcryptjs';
// import * as jwt from 'jsonwebtoken';
import { db } from '../services/database';
import { 
  CoachCreateRequest, 
  CoachCreateResponse, 
  CoachLoginRequest, 
  CoachLoginResponse,
  CoachGetResponse,
  CoachUpdateRequest,
  CoachUpdateResponse,
  NicknameCheckResponse,
  Coach 
} from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Nickname normalization utility
function normalizeNickname(nickname: string): string {
  return nickname
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const RESERVED_NICKNAMES = ['admin', 'root', 'support', 'help', 'api', 'billing', 'system', 'null', 'undefined'];

export const checkNickname = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log('🚀 checkNickname function started - v2');
    console.log('📥 Event:', JSON.stringify(event, null, 2));
    
    const nickname = event.queryStringParameters?.nickname;
    console.log('🔤 Nickname from query params:', nickname);
    
    if (!nickname) {
      console.log('❌ No nickname provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'NICKNAME_INVALID',
          message: 'Nickname is required'
        })
      };
    }

    console.log('🔧 Normalizing nickname...');
    const canonical = normalizeNickname(nickname);
    console.log('🔧 Canonical nickname:', canonical);
    
    const valid = canonical.length > 0 && /^[a-z0-9_]+$/.test(canonical);
    console.log('✅ Nickname valid:', valid);
    
    let available = true;
    let reason: string | undefined;

    if (!valid) {
      available = false;
      reason = 'NICKNAME_INVALID';
      console.log('❌ Nickname invalid');
    } else if (RESERVED_NICKNAMES.includes(canonical)) {
      available = false;
      reason = 'NICKNAME_RESERVED';
      console.log('❌ Nickname reserved');
    } else {
      console.log('🗄️ Skipping database check for now - assuming available');
      // Temporarily skip database check to isolate the issue
      // TODO: Re-enable database check once basic function works
      /*
      try {
        console.log(`🔍 Checking nickname in database: ${canonical}`);
        const existingCoach = await db.getCoachByNickname(canonical);
        console.log(`🔍 Database result:`, existingCoach);
        if (existingCoach) {
          available = false;
          reason = 'NICKNAME_TAKEN';
        }
      } catch (dbError) {
        console.error('❌ Database error in checkNickname:', dbError);
        // For now, assume nickname is available if DB check fails
        // This allows the app to work even with DB issues
        available = true;
        reason = undefined;
      }
      */
    }

    const response: NicknameCheckResponse = {
      input: nickname,
      canonical,
      valid,
      available,
      reason
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error checking nickname:', error);
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

export const createCoach = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

    const requestData: CoachCreateRequest = JSON.parse(event.body);
    const { name, email, password, nickname } = requestData;

    // Validate required fields
    if (!name || !email || !password || !nickname) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'All fields are required'
        })
      };
    }

    // Normalize and validate nickname
    const canonical = normalizeNickname(nickname);
    if (!canonical || RESERVED_NICKNAMES.includes(canonical)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'NICKNAME_INVALID',
          message: 'Invalid nickname'
        })
      };
    }

    // Check if nickname is taken
    const existingNickname = await db.getCoachByNickname(canonical);
    if (existingNickname) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'NICKNAME_TAKEN',
          message: 'Nickname is already taken'
        })
      };
    }

    // Check if email is taken
    const existingEmail = await db.getCoachByEmail(email);
    if (existingEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Email is already registered'
        })
      };
    }

    // Hash password (temporarily disabled for debugging)
    // const passwordHash = await bcrypt.hash(password, 10);
    const passwordHash = 'temp-hash-for-debugging';

    // Create coach
    const coach: Coach = {
      coachId: randomUUID(),
      name,
      email,
      nickname: canonical,
      passwordHash,
      valid: true,
      isAdmin: false, // Default to false for new coaches
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.saveCoach(coach);

    // Generate JWT token
    // Temporarily disabled JWT for debugging
    // const token = jwt.sign(
    //   { coachId: coach.coachId, email: coach.email },
    //   JWT_SECRET,
    //   { expiresIn: '7d' }
    // );
    const token = 'temp-jwt-token-for-debugging';

    const response: CoachCreateResponse = {
      coachId: coach.coachId,
      token,
      valid: coach.valid,
      nickname: coach.nickname
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error creating coach:', error);
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

export const loginCoach = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

    const requestData: CoachLoginRequest = JSON.parse(event.body);
    const { email, password } = requestData;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        })
      };
    }

    // Get coach by email
    const coach = await db.getCoachByEmail(email);
    if (!coach) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        })
      };
    }

    // Verify password (temporarily disabled for debugging)
    // const isValidPassword = await bcrypt.compare(password, coach.passwordHash);
    const isValidPassword = true; // Temporarily allow all passwords for debugging
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        })
      };
    }

    // Generate JWT token
    // Temporarily disabled JWT for debugging
    // const token = jwt.sign(
    //   { coachId: coach.coachId, email: coach.email },
    //   JWT_SECRET,
    //   { expiresIn: '7d' }
    // );
    const token = 'temp-jwt-token-for-debugging';

    const response: CoachLoginResponse = {
      coachId: coach.coachId,
      token,
      valid: coach.valid
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error logging in coach:', error);
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

export const getCoach = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

    // TODO: Verify JWT token and check if user can access this coach

    const coach = await db.getCoach(coachId);
    if (!coach) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Coach not found'
        })
      };
    }

    const response: CoachGetResponse = {
      coachId: coach.coachId,
      name: coach.name,
      email: coach.email,
      createdAt: coach.createdAt,
      valid: coach.valid,
      nickname: coach.nickname,
      phone: coach.phone,
      age: coach.age,
      isAdmin: coach.isAdmin || false
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting coach:', error);
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

export const updateCoach = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

    // TODO: Verify JWT token and check if user can update this coach

    const requestData: CoachUpdateRequest = JSON.parse(event.body);
    const { name, phone, age } = requestData;

    // Validate age if provided
    if (age !== undefined && (age < 18 || age > 120)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Age must be between 18 and 120'
        })
      };
    }

    // Validate phone if provided (basic validation)
    if (phone !== undefined && phone.length > 0 && !/^[\+]?[\d\s\-\(\)]{10,15}$/.test(phone)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Invalid phone number format'
        })
      };
    }

    // Get existing coach
    const existingCoach = await db.getCoach(coachId);
    if (!existingCoach) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Coach not found'
        })
      };
    }

    // Update coach data
    const updatedCoach: Coach = {
      ...existingCoach,
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(age !== undefined && { age }),
      updatedAt: new Date().toISOString()
    };

    const updateSuccess = await db.updateCoach(updatedCoach);
    
    if (!updateSuccess) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'Failed to update coach profile'
        })
      };
    }

    const response: CoachUpdateResponse = {
      coachId: updatedCoach.coachId,
      name: updatedCoach.name,
      email: updatedCoach.email,
      nickname: updatedCoach.nickname,
      phone: updatedCoach.phone,
      age: updatedCoach.age,
      updatedAt: updatedCoach.updatedAt
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error updating coach:', error);
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

/**
 * Copy an admin exercise to coach's personal library
 */
export const copyAdminExercise = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const coachId = event.pathParameters?.coachId;
    const adminExerciseId = event.pathParameters?.adminExerciseId;

    if (!coachId || !adminExerciseId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID and admin exercise ID are required'
        })
      };
    }

    // Get the admin exercise
    const adminExercise = await db.getExercise(adminExerciseId);
    if (!adminExercise || !adminExercise.isAdminExercise) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Admin exercise not found'
        })
      };
    }

    // Create a copy for the coach
    const copiedExercise = {
      ...adminExercise,
      exerciseId: randomUUID(),
      coachId,
      originalExerciseId: adminExerciseId,
      isAdminExercise: false,
      createdAt: new Date().toISOString()
    };

    const success = await db.saveExercise(copiedExercise);
    if (!success) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'Failed to copy admin exercise'
        })
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(copiedExercise)
    };
  } catch (error) {
    console.error('Error copying admin exercise:', error);
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

/**
 * Copy an admin training plan to coach's personal library
 */
export const copyAdminTrainingPlan = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const coachId = event.pathParameters?.coachId;
    const adminPlanId = event.pathParameters?.adminPlanId;

    if (!coachId || !adminPlanId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'Coach ID and admin plan ID are required'
        })
      };
    }

    // Get the admin training plan
    const adminPlan = await db.getTrainingPlan(adminPlanId);
    if (!adminPlan || !adminPlan.isAdminPlan) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'NOT_FOUND',
          message: 'Admin training plan not found'
        })
      };
    }

    // Create a copy for the coach
    const copiedPlan = {
      ...adminPlan,
      planId: randomUUID(),
      coachId,
      originalPlanId: adminPlanId,
      isAdminPlan: false,
      customTrainee: undefined, // Make it generic for the coach
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = await db.saveTrainingPlan(copiedPlan);
    if (!success) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'INTERNAL_ERROR',
          message: 'Failed to copy admin training plan'
        })
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(copiedPlan)
    };
  } catch (error) {
    console.error('Error copying admin training plan:', error);
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
