import '@testing-library/jest-native/extend-expect';

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  firebase: {
    app: jest.fn(() => ({
      delete: jest.fn(),
    })),
  },
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn();
    }),
    currentUser: null,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Global test user
global.mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
};
