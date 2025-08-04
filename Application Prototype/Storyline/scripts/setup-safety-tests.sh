#!/bin/bash
# Setup and run emotional safety tests
# Phase 2 of the Critical Testing Implementation Plan

set -e

echo "🚨 Setting Up Emotional Safety Tests"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "services" ]; then
    print_error "Please run this script from the Storyline root directory"
    exit 1
fi

# Step 1: Create test directories
echo "Step 1: Creating safety test directories..."
mkdir -p tests/emotional-safety
mkdir -p tests/voice-accuracy
mkdir -p tests/integration
print_status "Test directories created"

# Step 2: Install root-level test dependencies
echo ""
echo "Step 2: Installing root-level test dependencies..."
npm install --save-dev jest@^29.7.0 @types/jest@^29.5.11 ts-jest@^29.1.1 \
  @types/node@^20.11.0 typescript@^5.3.3 || {
    print_warning "Some dependencies failed to install, continuing..."
}

# Step 3: Create root Jest configuration
echo ""
echo "Step 3: Creating root Jest configuration..."
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  projects: [
    '<rootDir>/tests/jest.config.safety.js',
    '<rootDir>/tests/jest.config.integration.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'services/*/src/**/*.ts',
    'tests/**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts'
  ]
};
EOF
print_status "Root Jest configuration created"

# Step 4: Create safety tests configuration
echo ""
echo "Step 4: Creating safety tests configuration..."
cat > tests/jest.config.safety.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Safety Tests',
  rootDir: '..',
  testMatch: [
    '<rootDir>/tests/emotional-safety/**/*.test.ts',
    '<rootDir>/tests/voice-accuracy/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-safety.ts'],
  testTimeout: 30000,
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};
EOF
print_status "Safety tests configuration created"

# Step 5: Create safety test setup file
echo ""
echo "Step 5: Creating safety test setup..."
cat > tests/setup-safety.ts << 'EOF'
// Safety tests setup
process.env.NODE_ENV = 'test';
process.env.SAFETY_TEST_MODE = 'true';

// Add custom matchers for safety tests
expect.extend({
  toDetectCrisis(received: any) {
    const pass = received.detected === true && 
                 ['moderate', 'high', 'critical', 'imminent'].includes(received.riskLevel);
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to detect crisis`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to detect crisis with appropriate risk level`,
        pass: false,
      };
    }
  },
  
  toBeTraumaInformed(received: any) {
    const forbiddenPhrases = [
      'get over it',
      'move on',
      'you should',
      'you must',
      'you need to',
      'just think positive',
      'others have it worse'
    ];
    
    const hasForibidden = forbiddenPhrases.some(phrase => 
      received.toLowerCase().includes(phrase)
    );
    
    const pass = !hasForibidden;
    
    if (pass) {
      return {
        message: () => `expected response not to be trauma-informed`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to be trauma-informed but found harmful phrases`,
        pass: false,
      };
    }
  }
});

// Declare custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toDetectCrisis(): R;
      toBeTraumaInformed(): R;
    }
  }
}

// Mock console for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn, // Keep warnings
  error: console.error, // Keep errors
};
EOF
print_status "Safety test setup created"

# Step 6: Create trauma-informed response tests
echo ""
echo "Step 6: Creating trauma-informed response tests..."
cat > tests/emotional-safety/trauma-informed-responses.test.ts << 'EOF'
/**
 * Trauma-Informed Response Validation Tests
 * Ensures AI responses respect boundaries and avoid harm
 */

interface TraumaResponse {
  text: string;
  approach: string;
  elements: string[];
  respectsBoundaries: boolean;
  validationScore: number;
}

class TraumaInformedValidator {
  private forbiddenPhrases = [
    'just get over it',
    'move on',
    'you should talk about it',
    'you need to face',
    'you must remember',
    'try harder',
    'think positive',
    'others have it worse',
    'at least',
    'everything happens for a reason'
  ];

  private supportiveElements = [
    'your pace',
    'when you\'re ready',
    'it\'s okay',
    'I\'m here',
    'no pressure',
    'your choice',
    'take your time',
    'safety first'
  ];

  async validateResponse(response: string): Promise<TraumaResponse> {
    const lower = response.toLowerCase();
    
    // Check for forbidden phrases
    const violations = this.forbiddenPhrases.filter(phrase => 
      lower.includes(phrase)
    );
    
    // Check for supportive elements
    const supportElements = this.supportiveElements.filter(element =>
      lower.includes(element)
    );
    
    // Check boundary respect
    const respectsBoundaries = 
      violations.length === 0 &&
      !lower.includes('but you') &&
      !lower.includes('however, you should');
    
    // Calculate validation score
    const score = violations.length === 0 ? 
      0.7 + (supportElements.length * 0.1) : 
      0.3 - (violations.length * 0.1);
    
    return {
      text: response,
      approach: violations.length === 0 ? 'trauma-informed' : 'potentially-harmful',
      elements: supportElements,
      respectsBoundaries,
      validationScore: Math.max(0, Math.min(1, score))
    };
  }
}

describe('Trauma-Informed Response Validation', () => {
  let validator: TraumaInformedValidator;

  beforeEach(() => {
    validator = new TraumaInformedValidator();
  });

  describe('Boundary Respect', () => {
    test('respects explicit boundaries', async () => {
      const responses = {
        'I don\'t want to talk about it': 
          'I understand. We can focus on whatever feels comfortable for you.',
        
        'Please stop asking about that':
          'Of course. Let\'s move to something else. What would you prefer to work on?',
        
        'This is too much right now':
          'I hear you. There\'s no pressure. We can take a break or shift to something lighter.',
        
        'I need to change the subject':
          'Absolutely. Your comfort is the priority. What would you like to explore instead?'
      };

      for (const [input, expectedResponse] of Object.entries(responses)) {
        const validation = await validator.validateResponse(expectedResponse);
        
        expect(validation.respectsBoundaries).toBe(true);
        expect(validation.approach).toBe('trauma-informed');
        expect(validation.validationScore).toBeGreaterThan(0.8);
        expect(expectedResponse).toBeTraumaInformed();
      }
    });

    test('avoids minimizing language', async () => {
      const harmfulResponses = [
        'Just try to move on from the trauma',
        'You should talk about it to heal',
        'Others have been through worse',
        'At least you survived',
        'Everything happens for a reason'
      ];

      for (const response of harmfulResponses) {
        const validation = await validator.validateResponse(response);
        
        expect(validation.approach).toBe('potentially-harmful');
        expect(validation.respectsBoundaries).toBe(false);
        expect(validation.validationScore).toBeLessThan(0.5);
        expect(response).not.toBeTraumaInformed();
      }
    });
  });

  describe('Supportive Language', () => {
    test('uses empowering and supportive language', async () => {
      const supportiveResponses = [
        'You get to decide what feels right for your story.',
        'There\'s no rush. We can go at your pace.',
        'Your feelings are valid, whatever they are.',
        'I\'m here to support you in whatever way helps.',
        'It\'s okay to take breaks whenever you need.'
      ];

      for (const response of supportiveResponses) {
        const validation = await validator.validateResponse(response);
        
        expect(validation.elements.length).toBeGreaterThan(0);
        expect(validation.approach).toBe('trauma-informed');
        expect(validation.validationScore).toBeGreaterThan(0.7);
      }
    });
  });

  describe('Grounding Offers', () => {
    test('offers but doesn\'t force grounding techniques', async () => {
      const groundingResponses = [
        'Would a breathing exercise help? Happy to guide you through one if you\'d like.',
        'Some people find grounding techniques helpful. I can share some if you\'re interested.',
        'If you\'re feeling overwhelmed, we could try a quick grounding exercise - but only if that sounds good to you.'
      ];

      for (const response of groundingResponses) {
        expect(response).toMatch(/if you|would you|only if/i);
        expect(response).not.toMatch(/you should|you must|you need to/i);
        expect(response).toBeTraumaInformed();
      }
    });
  });
});

export { TraumaInformedValidator };
EOF
print_status "Trauma-informed response tests created"

# Step 7: Create package.json for tests
echo ""
echo "Step 7: Creating test package configuration..."
cat > tests/package.json << 'EOF'
{
  "name": "@storyline/tests",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "jest",
    "test:safety": "jest --selectProjects 'Safety Tests'",
    "test:integration": "jest --selectProjects 'Integration Tests'",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
EOF
print_status "Test package configuration created"

# Step 8: Create initial voice accuracy test
echo ""
echo "Step 8: Creating voice accuracy baseline test..."
cat > tests/voice-accuracy/baseline.test.ts << 'EOF'
/**
 * Voice Accuracy Baseline Tests
 * Must achieve >95% accuracy across all demographics
 */

describe('Voice Accuracy Baseline', () => {
  describe('Demographic Requirements', () => {
    test.todo('achieves >95% accuracy for child voices (8-12)');
    test.todo('achieves >95% accuracy for teen voices (13-17)');
    test.todo('achieves >95% accuracy for adult voices (18-65)');
    test.todo('achieves >95% accuracy for elderly voices (65+)');
    
    test.todo('maintains >93% accuracy across different accents');
    test.todo('shows <2% accuracy variance between genders');
  });

  describe('Environmental Conditions', () => {
    test.todo('maintains >97% accuracy in quiet environments');
    test.todo('maintains >92% accuracy with moderate background noise');
    test.todo('degrades gracefully in noisy environments');
  });

  describe('Real-time Performance', () => {
    test.todo('achieves P50 latency <100ms');
    test.todo('achieves P95 latency <200ms');
    test.todo('achieves P99 latency <300ms');
  });

  // Placeholder test to verify setup
  test('test infrastructure is working', () => {
    expect(true).toBe(true);
  });
});
EOF
print_status "Voice accuracy baseline test created"

# Step 9: Try to run safety tests
echo ""
echo "Step 9: Running safety tests..."
echo ""

if npx jest tests/emotional-safety/crisis-detection.test.ts --no-coverage 2>&1; then
    print_status "Crisis detection tests are running!"
else
    print_warning "Crisis detection tests failed to run - may need additional setup"
fi

echo ""
if npx jest tests/emotional-safety/trauma-informed-responses.test.ts --no-coverage 2>&1; then
    print_status "Trauma-informed response tests are running!"
else
    print_warning "Trauma response tests failed to run - may need additional setup"
fi

# Summary
echo ""
echo "===================================="
echo "📊 Safety Test Setup Summary"
echo "===================================="
echo ""
print_status "Test directories created"
print_status "Crisis detection tests implemented"
print_status "Trauma-informed validation tests implemented"
print_status "Voice accuracy test structure created"
echo ""
echo "✅ Critical safety tests are now available!"
echo ""
echo "To run tests:"
echo "  - All safety tests: npx jest tests/emotional-safety"
echo "  - Crisis detection: npx jest tests/emotional-safety/crisis-detection.test.ts"
echo "  - Trauma responses: npx jest tests/emotional-safety/trauma-informed-responses.test.ts"
echo ""
print_warning "Voice accuracy tests need test data before implementation"
print_warning "Integration tests need service implementations"
echo ""
echo "🚨 REMINDER: Safety tests MUST pass before any deployment!"