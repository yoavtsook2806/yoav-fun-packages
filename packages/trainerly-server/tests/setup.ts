import AWS from 'aws-sdk-mock';
import './jest-matchers';

// Mock AWS services for testing
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DYNAMODB_TABLE_PREFIX = 'test-matan-trainings-server';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.IS_LOCAL = 'true';
  process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
});

afterAll(() => {
  // Restore AWS services
  AWS.restore();
});

// Global test utilities

// Custom Jest matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toBeValidISODate(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime()) && received === date.toISOString();
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ISO date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ISO date`,
        pass: false,
      };
    }
  }
});
