# E2E Testing with EAS Build

## Overview

The Next Chapter app uses Detox for E2E testing. Since we're using Expo's managed workflow, we need to use EAS Build to create testable builds for Detox.

## Setup

### Prerequisites

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Configure your project (if not already done):
   ```bash
   eas build:configure
   ```

## Running E2E Tests

### Option 1: Using EAS Build (Recommended for CI/CD)

#### iOS Testing

1. Create an E2E build for iOS:
   ```bash
   npm run eas:build:e2e:ios
   ```
   
   This creates a local build optimized for E2E testing. The build will be saved in your project directory.

2. Set the build path environment variable:
   ```bash
   export EAS_BUILD_IOS_PATH=/path/to/your/NextChapter.app
   ```

3. Run the E2E tests:
   ```bash
   npm run test:e2e:eas:ios
   ```

#### Android Testing

1. Create an E2E build for Android:
   ```bash
   npm run eas:build:e2e:android
   ```

2. Set the build path environment variable:
   ```bash
   export EAS_BUILD_ANDROID_PATH=/path/to/your/app-release.apk
   ```

3. Run the E2E tests:
   ```bash
   npm run test:e2e:eas:android
   ```

### Option 2: Local Development (Requires Bare Workflow)

If you need to run E2E tests locally without EAS Build, you'll need to eject to a bare workflow:

1. Eject from managed workflow (⚠️ This is irreversible):
   ```bash
   npx expo eject
   ```

2. Build for iOS:
   ```bash
   npm run test:e2e:build:ios
   ```

3. Build for Android:
   ```bash
   npm run test:e2e:build:android
   ```

4. Run tests:
   ```bash
   npm run test:e2e        # iOS
   npm run test:e2e:android # Android
   ```

## CI/CD Integration

For CI/CD pipelines, use the EAS Build approach:

```yaml
# Example GitHub Actions workflow
- name: Create EAS Build
  run: |
    eas build --platform ios --profile e2e --non-interactive
    
- name: Download Build Artifact
  run: |
    # Download the build artifact from EAS
    
- name: Run E2E Tests
  run: |
    export EAS_BUILD_IOS_PATH=./NextChapter.app
    npm run test:e2e:eas:ios
```

## Configuration Details

### EAS Configuration (eas.json)

The `e2e` profile in `eas.json` is configured for:
- Internal distribution (not for app stores)
- Release builds with test capabilities
- Environment variables set for testing

### Detox Configuration (.detoxrc.js)

The configuration includes:
- Local development configurations (ios.sim.debug, android.emu.debug)
- EAS Build configurations (ios.sim.eas, android.emu.eas)
- Proper simulator/emulator settings

## Troubleshooting

### Common Issues

1. **Build not found**: Ensure the EAS_BUILD_IOS_PATH or EAS_BUILD_ANDROID_PATH environment variables point to the correct build artifacts.

2. **Simulator/Emulator issues**: Make sure you have the required simulators/emulators installed:
   - iOS: iPhone 15 Pro simulator
   - Android: Pixel_7_API_33 emulator

3. **Permission issues**: On macOS, you may need to grant permissions for the test runner to control the simulator.

### Debug Commands

```bash
# List available simulators
xcrun simctl list devices

# List available Android emulators
emulator -list-avds

# Run with debug logging
detox test --configuration ios.sim.eas --loglevel debug
```

## Best Practices

1. **Use EAS Build for CI/CD**: It provides consistent, reproducible builds.

2. **Keep builds local when possible**: Use the `--local` flag to avoid upload/download times.

3. **Cache builds**: In CI/CD, cache EAS build artifacts to speed up subsequent test runs.

4. **Test on multiple devices**: Use different simulator/emulator configurations to ensure broad compatibility.

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo + Detox Guide](https://docs.expo.dev/build-reference/e2e-tests/)