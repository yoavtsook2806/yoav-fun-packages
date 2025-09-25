"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCoach = exports.getCoach = exports.loginCoach = exports.createCoach = exports.checkNickname = void 0;
const crypto_1 = require("crypto");
// Note: bcrypt and jwt only needed for coach creation/login, not nickname check
// import * as bcrypt from 'bcryptjs';
// import * as jwt from 'jsonwebtoken';
const database_1 = require("../services/database");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
// Nickname normalization utility
function normalizeNickname(nickname) {
    return nickname
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
}
const RESERVED_NICKNAMES = ['admin', 'root', 'support', 'help', 'api', 'billing', 'system', 'null', 'undefined'];
const checkNickname = async (event) => {
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
        let reason;
        if (!valid) {
            available = false;
            reason = 'NICKNAME_INVALID';
            console.log('❌ Nickname invalid');
        }
        else if (RESERVED_NICKNAMES.includes(canonical)) {
            available = false;
            reason = 'NICKNAME_RESERVED';
            console.log('❌ Nickname reserved');
        }
        else {
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
        const response = {
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
    }
    catch (error) {
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
exports.checkNickname = checkNickname;
const createCoach = async (event) => {
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
        const requestData = JSON.parse(event.body);
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
        const existingNickname = await database_1.db.getCoachByNickname(canonical);
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
        const existingEmail = await database_1.db.getCoachByEmail(email);
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
        const coach = {
            coachId: (0, crypto_1.randomUUID)(),
            name,
            email,
            nickname: canonical,
            passwordHash,
            valid: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await database_1.db.saveCoach(coach);
        // Generate JWT token
        // Temporarily disabled JWT for debugging
        // const token = jwt.sign(
        //   { coachId: coach.coachId, email: coach.email },
        //   JWT_SECRET,
        //   { expiresIn: '7d' }
        // );
        const token = 'temp-jwt-token-for-debugging';
        const response = {
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
    }
    catch (error) {
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
exports.createCoach = createCoach;
const loginCoach = async (event) => {
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
        const requestData = JSON.parse(event.body);
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
        const coach = await database_1.db.getCoachByEmail(email);
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
        const response = {
            coachId: coach.coachId,
            token,
            valid: coach.valid
        };
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
    }
    catch (error) {
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
exports.loginCoach = loginCoach;
const getCoach = async (event) => {
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
        const coach = await database_1.db.getCoach(coachId);
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
        const response = {
            coachId: coach.coachId,
            name: coach.name,
            email: coach.email,
            createdAt: coach.createdAt,
            valid: coach.valid,
            nickname: coach.nickname,
            phone: coach.phone,
            age: coach.age
        };
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };
    }
    catch (error) {
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
exports.getCoach = getCoach;
const updateCoach = async (event) => {
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
        const requestData = JSON.parse(event.body);
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
        const existingCoach = await database_1.db.getCoach(coachId);
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
        const updatedCoach = {
            ...existingCoach,
            ...(name !== undefined && { name }),
            ...(phone !== undefined && { phone }),
            ...(age !== undefined && { age }),
            updatedAt: new Date().toISOString()
        };
        const updateSuccess = await database_1.db.updateCoach(updatedCoach);
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
        const response = {
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
    }
    catch (error) {
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
exports.updateCoach = updateCoach;
//# sourceMappingURL=coaches.js.map