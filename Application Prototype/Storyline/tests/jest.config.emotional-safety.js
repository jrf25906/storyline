module.exports = {
  displayName: 'emotional-safety',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: [
    '<rootDir>/tests/emotional-safety/**/*.test.ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json'
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@storyline/shared-types$': '<rootDir>/packages/shared-types/dist/index.js'
  },
  coverageDirectory: '<rootDir>/coverage/emotional-safety',
  collectCoverageFrom: [
    '<rootDir>/services/crisis-detection/src/**/*.ts',
    '<rootDir>/tests/emotional-safety/**/*.ts',
    '!**/*.d.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};