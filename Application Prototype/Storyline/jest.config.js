module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        skipLibCheck: true
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@storyline/shared-types$': '<rootDir>/packages/shared-types/dist/index.js'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'services/*/src/**/*.{ts,tsx}',
    'tests/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  projects: [
    '<rootDir>/tests/jest.config.integration.js'
  ]
};