// Mock sync manager for tests
export const syncManager = {
  hasPendingSyncs: jest.fn(() => false),
  syncAll: jest.fn(() => Promise.resolve({ 
    success: true, 
    errors: [] 
  })),
  addToQueue: jest.fn(),
  clearQueue: jest.fn(),
  getQueueSize: jest.fn(() => 0),
  processQueue: jest.fn(() => Promise.resolve()),
  isOnline: jest.fn(() => true),
  setOnlineStatus: jest.fn(),
};