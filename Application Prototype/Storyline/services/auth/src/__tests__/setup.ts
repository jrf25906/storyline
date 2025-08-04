// Test setup file for auth service
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

// Silence console during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

// Add custom matchers if needed
expect.extend({
  toBeValidJWT(received: string) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/;
    const pass = jwtRegex.test(received);
    
    return {
      pass,
      message: () => 
        pass
          ? `expected ${received} not to be a valid JWT`
          : `expected ${received} to be a valid JWT`,
    };
  },
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidJWT(): R;
    }
  }
}

export {};