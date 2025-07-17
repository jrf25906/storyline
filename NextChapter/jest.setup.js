// Fix for jest-expo with React 19
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

// Ensure timer functions are available
global.setTimeout = global.setTimeout || ((fn, delay, ...args) => fn(...args));
global.clearTimeout = global.clearTimeout || jest.fn();
global.setInterval = global.setInterval || jest.fn(() => 123);
global.clearInterval = global.clearInterval || jest.fn();

// Mock NativeDeviceInfo early before any React Native imports
const mockDeviceInfoModule = {
  default: {
    getConstants: () => ({
      Dimensions: {
        window: {
          width: 375,
          height: 812,
          scale: 2,
          fontScale: 1,
        },
        screen: {
          width: 375,
          height: 812,
          scale: 2,
          fontScale: 1,
        },
      },
    }),
  },
  __esModule: true,
};

// Mock the native module that Dimensions relies on
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeDeviceInfo', () => mockDeviceInfoModule);

// Mock DevMenu module
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeDevMenu', () => ({
  default: {
    show: jest.fn(),
    reload: jest.fn(),
    debugRemotely: jest.fn(),
    setProfilingEnabled: jest.fn(),
    setLiveReloadEnabled: jest.fn(),
    setHotLoadingEnabled: jest.fn(),
  },
  __esModule: true,
}));

// Mock SettingsManager module
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeSettingsManager', () => ({
  default: {
    getConstants: () => ({}),
    setValues: jest.fn(),
    deleteValues: jest.fn(),
  },
  __esModule: true,
}));

// Set up environment variables for tests
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NODE_ENV = 'test';

// Mock global objects that might be missing
if (typeof global.window === 'undefined') {
  global.window = {};
}

if (typeof global.navigator === 'undefined') {
  global.navigator = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  };
}

// Mock expo modules
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-constants', () => ({
  default: {
    manifest: {},
    expoConfig: {},
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])), // FINGERPRINT and FACIAL_RECOGNITION
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('View', { ...props, testID: 'blur-view' }, children);
  },
}));

// expo-notifications is mocked via __mocks__/expo-notifications.js


// React Native is now mocked via __mocks__/react-native.js


// Mock NetInfo with better implementation
const netInfoListeners = [];
const mockNetInfoState = {
  isConnected: true,
  type: 'wifi',
  isInternetReachable: true,
  details: {},
};

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((callback) => {
    netInfoListeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = netInfoListeners.indexOf(callback);
      if (index > -1) {
        netInfoListeners.splice(index, 1);
      }
    };
  }),
  fetch: jest.fn(() => Promise.resolve(mockNetInfoState)),
  // Helper to trigger state changes in tests
  __triggerNetworkStateChange: (newState) => {
    Object.assign(mockNetInfoState, newState);
    netInfoListeners.forEach(listener => listener(mockNetInfoState));
  },
}));

// React Native mocks are handled by __mocks__/react-native.js

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock zustand with proper persist support
jest.mock('zustand', () => {
  const actualZustand = jest.requireActual('zustand');
  
  // Store reset functions for cleanup
  const storeResetFns = new Set();
  
  // Override create to track stores
  const create = (stateCreator) => {
    // Handle persist middleware
    const store = actualZustand.create(stateCreator);
    
    // Track initial state for reset
    if (store.getState) {
      const initialState = store.getState();
      storeResetFns.add(() => {
        if (store.setState) {
          store.setState(initialState, true);
        }
      });
    }
    
    return store;
  };
  
  // Store reset functions will be called manually in tests that need them
  // Export reset functions for tests to use
  actualZustand._resetAllStores = () => {
    storeResetFns.forEach(resetFn => resetFn());
  };
  
  return { 
    ...actualZustand,
    create,
  };
});

// Mock zustand persist middleware
jest.mock('zustand/middleware', () => {
  const mockStorage = {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  };
  
  const createJSONStorage = (getStorage) => {
    const storage = getStorage?.() || mockStorage;
    return {
      getItem: async (name) => {
        const value = await storage.getItem(name);
        return value ? JSON.parse(value) : null;
      },
      setItem: async (name, value) => {
        await storage.setItem(name, JSON.stringify(value));
      },
      removeItem: async (name) => {
        await storage.removeItem(name);
      },
    };
  };
  
  return {
    persist: (config, options) => (set, get, api) => {
      const state = config(
        (...args) => {
          set(...args);
          // Simulate persistence
          if (options?.name) {
            const currentState = get();
            mockStorage.setItem(options.name, JSON.stringify(currentState));
          }
        },
        get,
        api
      );
      
      // Add rehydrate for testing
      api.rehydrate = async () => {
        if (options?.name) {
          const data = await mockStorage.getItem(options.name);
          if (data) {
            set(JSON.parse(data));
          }
        }
      };
      
      return state;
    },
    devtools: (config) => config,
    createJSONStorage,
  };
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      getSession: jest.fn(() => ({ data: { session: null } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => ({ data: null, error: null })),
      execute: jest.fn(() => ({ data: [], error: null })),
    })),
  })),
}));

// Note: sync manager will be mocked in individual tests that need it

// Mock crypto-js
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn((data) => ({ toString: () => `encrypted_${data}` })),
    decrypt: jest.fn((data) => ({ toString: () => data.replace('encrypted_', '') })),
  },
  SHA256: jest.fn((data) => ({ toString: () => `hashed_${data}` })),
  lib: {
    WordArray: {
      random: jest.fn(() => ({ toString: () => 'random_key' })),
    },
  },
  PBKDF2: jest.fn(() => ({ toString: () => 'derived_key' })),
  enc: {
    Utf8: {},
  },
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn().mockResolvedValue(true),
  getInternetCredentials: jest.fn().mockResolvedValue(null),
  resetInternetCredentials: jest.fn().mockResolvedValue(true),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(() => jest.fn()),
  }),
  useRoute: () => ({
    params: {},
    name: 'TestScreen',
    key: 'test-key',
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: jest.fn(() => true),
  CommonActions: {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  },
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
    Group: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Configure timers for async testing
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Add test utilities to global scope
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Configure async test defaults
jest.setTimeout(10000); // 10 second timeout for async tests

// Import custom matchers
require('./src/test-utils/styleHelpers');