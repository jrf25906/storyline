module.exports = {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Root directories for tests and source code
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts', // Main entry point - integration tested
    '!src/types/index.ts', // Type definitions only
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Test timeout (30 seconds for AI integration tests)
  testTimeout: 30000,
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Global variables available in tests
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          // Allow ES modules for testing
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          // Enable experimental decorators for mocking
          experimentalDecorators: true,
          emitDecoratorMetadata: true
        }
      }
    }
  },
  
  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Watch mode settings
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/logs/'
  ],
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ]
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance settings
  maxWorkers: '50%',
  
  // Test sequence settings
  randomize: true,
  
  // Mock settings
  automock: false,
  
  // Cache settings
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache'
};