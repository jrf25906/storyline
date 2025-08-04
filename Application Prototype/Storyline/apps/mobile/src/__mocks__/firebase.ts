/**
 * Firebase mocks for testing
 */

// Mock Firebase Auth instance
export const mockFirebaseAuth = {
  currentUser: null,
  _getRecaptchaConfig: jest.fn(),
  app: {
    name: 'test-app',
    options: {}
  }
};

// Mock Firestore instance
export const mockFirestore = {
  app: {
    name: 'test-app'
  }
};

// Mock Firebase Auth functions
export const createUserWithEmailAndPassword = jest.fn();
export const signInWithEmailAndPassword = jest.fn();
export const signOut = jest.fn();
export const sendPasswordResetEmail = jest.fn();
export const updateProfile = jest.fn();
export const onAuthStateChanged = jest.fn().mockReturnValue(jest.fn()); // Returns unsubscribe function

// Mock Firestore functions
export const doc = jest.fn();
export const setDoc = jest.fn();
export const getDoc = jest.fn();
export const updateDoc = jest.fn();
export const collection = jest.fn();

// Mock Firebase config
export const auth = mockFirebaseAuth;
export const db = mockFirestore;
export const isFirebaseConfigured = true;

// Reset all mocks function for test cleanup
export const resetFirebaseMocks = () => {
  // Reset auth functions
  createUserWithEmailAndPassword.mockReset();
  signInWithEmailAndPassword.mockReset();
  signOut.mockReset();
  sendPasswordResetEmail.mockReset();
  updateProfile.mockReset();
  onAuthStateChanged.mockReset();
  
  // Reset firestore functions
  doc.mockReset();
  setDoc.mockReset();
  getDoc.mockReset();
  updateDoc.mockReset();
  collection.mockReset();
  
  // Reset auth instance
  mockFirebaseAuth.currentUser = null;
  mockFirebaseAuth._getRecaptchaConfig.mockReset();
};

// Helper to simulate successful auth state change
export const simulateAuthStateChange = (user: any) => {
  const callback = onAuthStateChanged.mock.calls[0]?.[0];
  if (callback) {
    callback(user);
  }
};