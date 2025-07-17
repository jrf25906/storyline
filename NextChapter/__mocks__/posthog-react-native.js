// Mock for posthog-react-native
const mockPosthog = {
  capture: jest.fn(),
  screen: jest.fn(),
  identify: jest.fn(),
  alias: jest.fn(),
  distinctId: jest.fn(() => 'mock-distinct-id'),
  reset: jest.fn(),
  flush: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
  enable: jest.fn(),
  disable: jest.fn(),
  isFeatureEnabled: jest.fn(() => false),
  reloadFeatureFlags: jest.fn(() => Promise.resolve()),
  getFeatureFlag: jest.fn(() => false),
  getFeatureFlagPayload: jest.fn(() => null),
  group: jest.fn(),
  register: jest.fn(),
  unregister: jest.fn(),
  getDistinctId: jest.fn(() => Promise.resolve('mock-distinct-id')),
  optIn: jest.fn(),
  optOut: jest.fn(),
  debug: jest.fn(),
};

class PostHog {
  constructor(apiKey, options = {}) {
    Object.assign(this, mockPosthog);
    this.apiKey = apiKey;
    this.options = options;
  }
}

// Static method
PostHog.initAsync = jest.fn(() => Promise.resolve(new PostHog('test-api-key')));

module.exports = PostHog;
module.exports.PostHog = PostHog;
module.exports.default = PostHog;