module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/emotional-safety/**/*.test.ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
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
  coverageDirectory: '<rootDir>/coverage/emotional-safety',
  collectCoverageFrom: [
    'services/crisis-detection/src/**/*.ts',
    'tests/emotional-safety/**/*.ts',
    '!**/*.d.ts'
  ]
};