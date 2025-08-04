const baseConfig = require('../../packages/test-config/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'voice-processing',
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'StreamingWebSocket.test.ts'
  ]
};
