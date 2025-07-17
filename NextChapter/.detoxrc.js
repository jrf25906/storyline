/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    // Local development builds
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/NextChapter.app',
      build: 'npx expo run:ios --configuration Debug --scheme NextChapter',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/NextChapter.app',
      build: 'npx expo run:ios --configuration Release --scheme NextChapter',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
    // EAS Build artifacts
    'ios.eas': {
      type: 'ios.app',
      binaryPath: process.env.EAS_BUILD_IOS_PATH || './NextChapter.app',
      build: 'echo "Using pre-built EAS artifact"',
    },
    'android.eas': {
      type: 'android.apk',
      binaryPath: process.env.EAS_BUILD_ANDROID_PATH || './app-release.apk',
      build: 'echo "Using pre-built EAS artifact"',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33',
      },
    },
  },
  configurations: {
    // Local development configurations
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
    // EAS Build configurations
    'ios.sim.eas': {
      device: 'simulator',
      app: 'ios.eas',
    },
    'android.emu.eas': {
      device: 'emulator',
      app: 'android.eas',
    },
  },
};