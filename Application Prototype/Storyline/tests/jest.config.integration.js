module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.integration.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup.integration.ts'],
  testTimeout: 60000, // 1 minute for integration tests
  maxWorkers: 1, // Run integration tests serially
};
