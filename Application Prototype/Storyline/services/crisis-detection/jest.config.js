const baseConfig = require('../../packages/test-config/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'crisis-detection',
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ]
};
