const baseConfig = require('../../packages/test-config/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'auth',
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json'
    }]
  }
};
