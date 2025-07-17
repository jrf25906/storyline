import { device, init } from 'detox';
import adapter from 'detox/runners/jest/adapter';
import { detox as detoxConfig } from '../package.json';

// Set the default test timeout
jest.setTimeout(120000);

// Set up Detox adapter
jasmine.getEnv().addReporter(adapter);

// Set up test hooks
beforeAll(async () => {
  await init(detoxConfig, { initGlobals: false });
  await device.launchApp({
    newInstance: true,
    permissions: {
      notifications: 'YES',
      camera: 'NO',
      photos: 'NO',
      location: 'NO',
      microphone: 'NO',
    },
  });
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await cleanup();
});

async function cleanup() {
  // Cleanup any test data if needed
}