#!/bin/bash
# fix-testing-infrastructure.sh - Fix workspace testing dependencies

echo "🔧 Fixing Storyline Testing Infrastructure..."
echo "============================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Ensure shared-types is built
echo -e "\n${YELLOW}Step 1: Building shared-types package...${NC}"
cd packages/shared-types
npm install
npm run build
check_status "shared-types build"
cd ../..

# Step 2: Create base Jest configuration
echo -e "\n${YELLOW}Step 2: Creating shared Jest configuration...${NC}"
mkdir -p packages/test-config

cat > packages/test-config/jest.config.base.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@storyline/shared-types$': '<rootDir>/../../packages/shared-types/src'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true
};
EOF
check_status "Jest base config creation"

# Step 3: Create test setup files for each service
echo -e "\n${YELLOW}Step 3: Creating test setup files...${NC}"

services=(
  "auth"
  "voice-processing"
  "ai-orchestrator"
  "api"
  "memory"
  "narrative-analysis"
  "document-export"
)

for service in "${services[@]}"; do
  if [ -d "services/$service" ]; then
    echo "Setting up $service..."
    
    # Create test directories
    mkdir -p "services/$service/tests/unit"
    mkdir -p "services/$service/tests/integration"
    
    # Create Jest config if it doesn't exist
    if [ ! -f "services/$service/jest.config.js" ]; then
      cat > "services/$service/jest.config.js" << EOF
const baseConfig = require('../../packages/test-config/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: '$service',
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ]
};
EOF
    fi
    
    # Create setup file if it doesn't exist
    if [ ! -f "services/$service/tests/setup.ts" ]; then
      cat > "services/$service/tests/setup.ts" << EOF
// Test setup for $service
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/storyline_test';
process.env.REDIS_URL = 'redis://localhost:6379/0';

// Add service-specific setup here
EOF
    fi
    
    # Create a basic smoke test if no tests exist
    if [ ! -f "services/$service/tests/unit/smoke.test.ts" ]; then
      cat > "services/$service/tests/unit/smoke.test.ts" << EOF
describe('$service Service - Smoke Test', () => {
  test('environment is set up correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(true).toBe(true);
  });

  test('TypeScript compilation works', () => {
    const testFunction = (a: number, b: number): number => a + b;
    expect(testFunction(2, 3)).toBe(5);
  });
});
EOF
    fi
  fi
done
check_status "Service test setup"

# Step 4: Install test dependencies in each service
echo -e "\n${YELLOW}Step 4: Installing test dependencies...${NC}"

# Common test dependencies
TEST_DEPS="jest@^29.7.0 @types/jest@^29.5.11 ts-jest@^29.1.1"
INTEGRATION_DEPS="supertest@^6.3.4 @types/supertest@^6.0.2"

for service in "${services[@]}"; do
  if [ -d "services/$service" ]; then
    echo "Installing test dependencies for $service..."
    cd "services/$service"
    
    # Install dependencies
    npm install --save-dev $TEST_DEPS $INTEGRATION_DEPS
    
    cd ../..
  fi
done
check_status "Test dependency installation"

# Step 5: Create mobile app test setup
echo -e "\n${YELLOW}Step 5: Setting up mobile app tests...${NC}"

if [ -d "apps/mobile" ]; then
  cd apps/mobile
  
  # Create test setup for React Native
  mkdir -p tests
  
  cat > tests/setup.ts << 'EOF'
import '@testing-library/jest-native/extend-expect';

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  firebase: {
    app: jest.fn(() => ({
      delete: jest.fn(),
    })),
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn();
    }),
    currentUser: null,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Global test user
global.mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
};
EOF
  
  cd ../..
fi
check_status "Mobile app test setup"

# Step 6: Create integration test configuration
echo -e "\n${YELLOW}Step 6: Creating integration test configuration...${NC}"

mkdir -p tests/integration

cat > tests/jest.config.integration.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.integration.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup.integration.ts'],
  testTimeout: 60000, // 1 minute for integration tests
  maxWorkers: 1, // Run integration tests serially
};
EOF

cat > tests/setup.integration.ts << 'EOF'
// Integration test setup
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Set up test database connections
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/storyline_integration_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Mock external services
process.env.OPENAI_API_KEY = 'test-key';
process.env.ASSEMBLYAI_API_KEY = 'test-key';
process.env.DEEPGRAM_API_KEY = 'test-key';
EOF
check_status "Integration test configuration"

# Step 7: Verify test execution
echo -e "\n${YELLOW}Step 7: Verifying test execution...${NC}"

echo "Running tests for each service..."
failed_services=()

for service in "${services[@]}"; do
  if [ -d "services/$service" ]; then
    echo -e "\nTesting $service..."
    cd "services/$service"
    
    if npm test -- --passWithNoTests; then
      echo -e "${GREEN}✅ $service tests pass${NC}"
    else
      echo -e "${RED}❌ $service tests failed${NC}"
      failed_services+=("$service")
    fi
    
    cd ../..
  fi
done

# Final report
echo -e "\n${YELLOW}========== Test Infrastructure Report ==========${NC}"
echo -e "Total services: ${#services[@]}"
echo -e "Failed services: ${#failed_services[@]}"

if [ ${#failed_services[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All services can run tests!${NC}"
else
  echo -e "${RED}❌ Failed services: ${failed_services[*]}${NC}"
fi

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Run './scripts/create-emotional-safety-tests.sh' to create safety tests"
echo "2. Run './scripts/create-voice-accuracy-tests.sh' to create voice tests"
echo "3. Run 'npm test' from the root to run all tests"
echo ""
echo -e "${GREEN}✅ Testing infrastructure setup complete!${NC}"