/**
 * Jest test setup file
 * Configures global test environment and mocks
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.BYPASS_AUTH = 'true'; // Allow bypassing auth in tests
process.env.MAX_CONTENT_LENGTH = '100000'; // Smaller limit for faster tests

// Mock console methods to reduce test output noise
const originalConsole = { ...console };

beforeAll(() => {
  // Mock console methods but preserve error logging for debugging
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    // Keep error for debugging failed tests
    error: originalConsole.error,
  };
});

afterAll(() => {
  // Restore original console
  global.console = originalConsole;
});

// Global test utilities
global.createMockRequest = (overrides: any = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ip: '127.0.0.1',
  method: 'GET',
  path: '/test',
  get: jest.fn((header: string) => {
    if (header === 'User-Agent') return 'test-agent';
    if (header === 'Content-Length') return '0';
    return undefined;
  }),
  ...overrides,
});

global.createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    headersSent: false,
    on: jest.fn(),
  };
  return res;
};

global.createMockNext = () => jest.fn();

// Mock AI Provider responses for testing
global.mockAIResponses = {
  structureAnalysis: {
    frameworkDetection: 'Three-Act Structure',
    adherence: JSON.stringify({
      confidence: 85,
      keyBeats: [
        { name: 'Hook', position: 5, present: true, strength: 90 },
        { name: 'Inciting Incident', position: 25, present: true, strength: 85 }
      ],
      missing: []
    }),
    acts: JSON.stringify([
      {
        act: 1,
        startPosition: 0,
        endPosition: 25,
        purpose: 'Setup and introduction',
        effectiveness: 85,
        keyEvents: ['Character introduction', 'Inciting incident']
      }
    ]),
    plotPoints: JSON.stringify([
      {
        type: 'inciting_incident',
        position: 25,
        description: 'Story begins',
        importance: 90,
        connected: true
      }
    ]),
    conflicts: JSON.stringify([
      {
        type: 'person_vs_self',
        intensity: 75,
        resolution: 'resolved',
        characters: ['protagonist'],
        escalation: [25, 50, 75]
      }
    ]),
    pacing: JSON.stringify({
      setup: 25,
      confrontation: 50,
      resolution: 25,
      balanced: true,
      recommendations: []
    })
  },
  
  characterAnalysis: {
    identification: JSON.stringify(['Protagonist', 'Antagonist']),
    individual: JSON.stringify({
      name: 'Protagonist',
      role: 'protagonist',
      arc: {
        type: 'positive',
        stages: [],
        completion: 85,
        clarity: 90,
        motivation: 'Test motivation',
        stakes: 'Test stakes',
        obstacles: ['Test obstacle']
      },
      development: {
        growth: 85,
        believability: 90,
        agency: 88,
        complexity: 75
      },
      consistency: 92,
      screenTime: 80,
      emotionalJourney: {
        startingEmotion: 'hopeful',
        endingEmotion: 'triumphant',
        keyEmotionalBeats: [],
        authenticity: 85
      }
    }),
    relationships: JSON.stringify([
      {
        character1: 'Protagonist',
        character2: 'Antagonist',
        type: 'enemy',
        strength: 90,
        development: 85,
        conflict: true
      }
    ])
  },
  
  themeAnalysis: JSON.stringify({
    primaryTheme: 'Good vs Evil',
    subthemes: ['Courage', 'Growth'],
    development: [
      {
        theme: 'Good vs Evil',
        introduction: 10,
        development: [25, 50, 75],
        resolution: 90,
        strength: 85
      }
    ],
    integration: 80,
    consistency: 85
  }),
  
  traumaAnalysis: {
    crisis: JSON.stringify({
      crisisLevel: 20,
      indicators: [],
      reasoning: 'No crisis indicators detected'
    }),
    emotional: JSON.stringify({
      emotionalIntensity: 30,
      themes: ['mild emotional processing'],
      supportNeeded: 'gentle',
      reasoning: 'Light emotional content'
    })
  }
};

// Global test data
global.testContent = {
  short: 'A very short story about a hero.',
  medium: `
    Once upon a time, there was a young woman named Sarah who lived in a small village.
    She had always dreamed of adventure, but her life was quiet and predictable.
    One day, a mysterious stranger arrived in town with news of a treasure hidden in the nearby mountains.
    Sarah decided to join the quest, despite the dangers.
    After many challenges and trials, she discovered not only the treasure but also her own courage.
    She returned home transformed, ready to embrace whatever adventures life might bring.
  `,
  long: `
    Chapter 1: The Beginning
    
    Once upon a time, in a land far, far away, there lived a young woman named Sarah...
    `.repeat(100), // Repeat to make it longer
  
  traumatic: `
    I feel hopeless and worthless. Sometimes I think everyone would be better off without me.
    I can't see any point in continuing. The pain is too much to bear.
  `,
  
  cultural: `
    In the time before time, when the world was young and the spirits walked freely among mortals,
    there lived a tribe by the great river. The elders would gather the children each evening
    as the sun painted the sky in colors of fire, and they would tell the stories that had been
    passed down through countless generations. These were not mere tales, but sacred teachings
    that connected the people to their ancestors and the land that sustained them.
  `
};

// Mock fetch for external API calls (if needed)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('OK'),
  } as Response)
);

// Extend Jest matchers for custom assertions
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidAnalysisStructure(received: any) {
    const requiredFields = [
      'id', 'userId', 'projectId', 'timestamp',
      'storyCoherence', 'characterDevelopment', 'plotStructure',
      'themeIntegration', 'writingCraft', 'suggestions'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in received));
    const pass = missingFields.length === 0;
    
    if (pass) {
      return {
        message: () => `expected analysis to be missing required fields`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected analysis to have fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  },

  toBeTraumaInformed(received: any) {
    const hasTraumaSupport = received.traumaInformedNotes !== undefined ||
                            received.supportMessage !== undefined ||
                            received.resources !== undefined;
    
    if (hasTraumaSupport) {
      return {
        message: () => `expected response not to be trauma-informed`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to include trauma-informed elements`,
        pass: false,
      };
    }
  }
});

// Global cleanup
afterEach(() => {
  jest.clearAllMocks();
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log the error
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Export test utilities for use in test files
export const testUtils = {
  createMockRequest: global.createMockRequest,
  createMockResponse: global.createMockResponse,
  createMockNext: global.createMockNext,
  mockAIResponses: global.mockAIResponses,
  testContent: global.testContent,
  
  // Helper to wait for promises to resolve
  waitForPromises: () => new Promise(resolve => setImmediate(resolve)),
  
  // Helper to create mock analysis request
  createAnalysisRequest: (overrides: any = {}) => ({
    userId: 'test-user-123',
    projectId: 'test-project-456',
    content: global.testContent.medium,
    config: {
      framework: 'three_act',
      culturalSensitivity: true,
      traumaInformed: true,
      realTime: false,
      depth: 'standard',
      aiProvider: 'openai',
    },
    metadata: {},
    ...overrides,
  }),
};

// Declare global types for TypeScript
declare global {
  function createMockRequest(overrides?: any): any;
  function createMockResponse(): any;
  function createMockNext(): any;
  
  var mockAIResponses: any;
  var testContent: any;
  
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidAnalysisStructure(): R;
      toBeTraumaInformed(): R;
    }
  }
}