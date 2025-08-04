const baseConfig = require('../../packages/test-config/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'ai-orchestrator',
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json'
      }
    ]
  }
};