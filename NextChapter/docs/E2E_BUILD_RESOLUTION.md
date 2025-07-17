# E2E Build Configuration Resolution

## Summary

We've successfully resolved the E2E build configuration issues by:
1. Replacing incompatible `react-native-linear-gradient` with `expo-linear-gradient`
2. Setting up EAS Build configuration for E2E testing with Detox
3. Maintaining the managed Expo workflow benefits

## Changes Made

### 1. Fixed Linear Gradient Compatibility

**Problem**: `react-native-linear-gradient` doesn't work with Expo Go
**Solution**: Switched to `expo-linear-gradient`

```typescript
// Before
import LinearGradient from 'react-native-linear-gradient';

// After
import { LinearGradient } from 'expo-linear-gradient';
```

### 2. EAS Build Configuration

Created `eas.json` with E2E testing profile:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {},
    "e2e": {
      "extends": "production",
      "distribution": "internal",
      "env": {
        "DETOX_BUILD": "true"
      },
      "ios": {
        "simulator": true,
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3. Updated Detox Configuration

Added EAS build support to `.detoxrc.js`:

```javascript
apps: {
  // ... existing configs
  'ios.eas': {
    type: 'ios.app',
    binaryPath: process.env.EAS_BUILD_IOS_PATH || 'NextChapter.app',
  },
  'android.eas': {
    type: 'android.apk',
    binaryPath: process.env.EAS_BUILD_ANDROID_PATH || 'app-release.apk',
    testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
  },
}
```

### 4. New NPM Scripts

Added EAS build scripts to `package.json`:

```json
"eas:build:e2e:ios": "eas build --platform ios --profile e2e",
"eas:build:e2e:android": "eas build --platform android --profile e2e",
"test:e2e:eas:ios": "detox test --configuration ios.sim.eas.release",
"test:e2e:eas:android": "detox test --configuration android.emu.eas.release"
```

## How to Run E2E Tests

### Prerequisites

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Create Expo account and login:
   ```bash
   eas login
   ```

3. Configure the project:
   ```bash
   eas build:configure
   ```

### Running E2E Tests

#### Option 1: Using EAS Build (Recommended)

1. Build for E2E testing:
   ```bash
   npm run eas:build:e2e:ios    # For iOS
   npm run eas:build:e2e:android # For Android
   ```

2. Download the build artifacts when ready

3. Set environment variables:
   ```bash
   export EAS_BUILD_IOS_PATH=/path/to/NextChapter.app
   export EAS_BUILD_ANDROID_PATH=/path/to/app-release.apk
   ```

4. Run tests:
   ```bash
   npm run test:e2e:eas:ios      # For iOS
   npm run test:e2e:eas:android  # For Android
   ```

#### Option 2: Using the Convenience Script

```bash
./scripts/run-e2e-tests.sh --use-eas -p ios
```

### CI/CD Integration

For GitHub Actions or other CI/CD platforms:

1. Store EAS credentials as secrets
2. Use the provided workflow in `.github/workflows/e2e-tests.yml`
3. Tests will run automatically on PR and nightly

## Why EAS Build?

We chose EAS Build over ejecting to bare workflow because:

1. **Preserves managed workflow**: Keep Expo's benefits like OTA updates
2. **Reproducible builds**: Consistent across environments
3. **CI/CD friendly**: Easy integration with pipelines
4. **Reversible**: No permanent changes to project structure
5. **Official support**: Expo's recommended approach

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Run `npm install --legacy-peer-deps`
2. **Build failures**: Check `eas build --platform [ios|android] --profile e2e --clear-cache`
3. **Test timeouts**: Increase timeout in test files or detox config

### Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Detox with EAS Build](https://docs.expo.dev/build-reference/e2e-tests/)
- [Project E2E Test Documentation](./docs/technical/testing/E2E_TESTING_WITH_EAS.md)

## Next Steps

1. Set up EAS account and configure project
2. Run first E2E build
3. Execute test suite on both platforms
4. Set up CI/CD integration

The app is now fully configured for E2E testing while maintaining all the benefits of Expo's managed workflow!