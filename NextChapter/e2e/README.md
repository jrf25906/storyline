# E2E Testing with Detox

This directory contains end-to-end tests for the Next Chapter React Native app using Detox.

## Overview

Our E2E tests cover critical user flows including:
- Onboarding flow (from start to first task)
- Bounce Plan daily task completion
- AI Coach interaction with tone switching
- Job application tracker CRUD operations
- Offline/online sync scenarios
- Biometric authentication flow
- Performance benchmarks

## Setup

### Prerequisites

1. **iOS Requirements:**
   - macOS with Xcode installed
   - iOS Simulator configured
   - CocoaPods installed (`brew install cocoapods`)

2. **Android Requirements:**
   - Android Studio with Android SDK
   - Android Emulator configured (Pixel 7 API 33 recommended)
   - Java 17+ installed

3. **Node.js Requirements:**
   - Node.js 18+
   - npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install Detox CLI globally:
```bash
npm install -g detox-cli
```

3. For iOS, install pods:
```bash
cd ios && pod install && cd ..
```

## Running Tests Locally

### iOS Tests

1. Build the app for testing:
```bash
npm run test:e2e:build:ios
```

2. Run all tests:
```bash
npm run test:e2e
```

3. Run specific test suite:
```bash
detox test e2e/tests/onboarding.e2e.ts --configuration ios.sim.debug
```

### Android Tests

1. Start Android emulator:
```bash
emulator -avd Pixel_7_API_33
```

2. Build the app for testing:
```bash
npm run test:e2e:build:android
```

3. Run tests:
```bash
npm run test:e2e:android
```

## Test Structure

```
e2e/
├── tests/                    # Test suites
│   ├── onboarding.e2e.ts    # Onboarding flow tests
│   ├── bouncePlan.e2e.ts    # Bounce plan task tests
│   ├── aiCoach.e2e.ts       # AI coach interaction tests
│   ├── jobTracker.e2e.ts    # Job tracker CRUD tests
│   ├── offlineSync.e2e.ts   # Offline/online sync tests
│   ├── biometricAuth.e2e.ts # Biometric auth tests
│   └── performance.e2e.ts   # Performance benchmark tests
├── helpers/                  # Test utilities
│   ├── testIds.ts           # Centralized test IDs
│   ├── actions.ts           # Common test actions
│   └── testData.ts          # Test fixtures
├── init.ts                  # Test setup
└── jest.config.js           # Jest configuration
```

## Writing Tests

### Test ID Convention

Add `testID` props to React Native components:

```tsx
<TouchableOpacity 
  testID="complete-task-button"
  onPress={handleComplete}
>
  <Text>Complete Task</Text>
</TouchableOpacity>
```

Use the centralized `TestIds` object in tests:

```typescript
import { TestIds } from '../helpers/testIds';

await TestActions.tap(TestIds.bouncePlan.completeTaskButton);
```

### Common Test Patterns

1. **Basic interaction:**
```typescript
await TestActions.typeText(TestIds.coach.messageInput, 'Hello coach');
await TestActions.tap(TestIds.coach.sendButton);
await TestActions.waitForElement(TestIds.coach.messageBubble(1));
```

2. **Offline testing:**
```typescript
await TestActions.disableNetwork();
// Perform actions offline
await TestActions.enableNetwork();
// Verify sync
```

3. **Performance testing:**
```typescript
const loadTime = await TestActions.measurePerformance(async () => {
  await TestActions.tap(TestIds.common.homeTab);
  await TestActions.waitForElement(TestIds.home.screen);
});
expect(loadTime).toBeLessThan(300);
```

## Debugging

### View Hierarchy

To inspect the view hierarchy during test execution:

```bash
detox test --debug-synchronization 500 --loglevel trace
```

### Screenshots

Tests automatically capture screenshots on failure. Find them in:
- `e2e/artifacts/` (local runs)
- GitHub Actions artifacts (CI runs)

### Test Recordings

For iOS, enable video recording:

```bash
detox test --record-videos all
```

## CI/CD Integration

Tests run automatically:
- On every PR to main/develop branches
- Nightly at 2 AM UTC
- On manual trigger via GitHub Actions

### Nightly Test Reports

Nightly test failures trigger:
1. Slack notifications (if configured)
2. Artifact uploads to GitHub
3. Email alerts to team

## Troubleshooting

### Common Issues

1. **"Cannot find element" errors:**
   - Verify testID is set on component
   - Check if element is within viewport
   - Increase timeout: `await TestActions.waitForElement(id, 10000)`

2. **Flaky tests:**
   - Add explicit waits: `await TestActions.waitForLoadingToComplete()`
   - Use `withTimeout()` for async operations
   - Check for race conditions

3. **Build failures:**
   - Clean build: `cd ios && rm -rf build && cd ..`
   - Reset Metro: `npm start -- --reset-cache`
   - Clear Detox cache: `detox clean-framework-cache`

### Platform-Specific Issues

**iOS:**
- Simulator not found: Open Xcode > Window > Devices and Simulators
- Build errors: Check Xcode build settings match Detox config

**Android:**
- Emulator offline: `adb devices` to check status
- APK not found: Verify build output path in `.detoxrc.js`

## Best Practices

1. **Test Independence:** Each test should be able to run in isolation
2. **Clear State:** Use `device.launchApp({ delete: true })` for clean state
3. **Descriptive Names:** Use clear test descriptions for better reporting
4. **Accessibility:** Always add accessibility labels for screen readers
5. **Performance:** Keep tests fast - mock slow operations when possible

## Measuring Success

Our E2E tests validate:
- ✅ Critical user journeys work end-to-end
- ✅ Offline functionality works correctly
- ✅ Performance meets benchmarks (<3s cold start)
- ✅ Accessibility features function properly
- ✅ Crisis intervention triggers appropriately
- ✅ Data syncs correctly between offline/online states

## Contributing

When adding new features:
1. Add testIDs to new components
2. Update `TestIds` helper with new IDs
3. Write E2E tests covering happy path + edge cases
4. Ensure tests pass locally before submitting PR
5. Update this documentation if needed

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [React Native Testing Best Practices](https://reactnative.dev/docs/testing-overview)
- [Next Chapter Testing Standards](../docs/technical/testing/)