/**
 * Mock Service Implementations for Testing
 * 
 * Provides test doubles for all service interfaces following SOLID principles.
 * These mocks are designed to be easily configurable and predictable for testing.
 */

import {
  IAuthService,
  IBiometricService,
  IDataService,
  IStorageService,
  IAIService,
  IChatService,
  IAnalyticsService,
  INotificationService,
  INetworkService,
  ISyncService,
  IEncryptionService,
  ServiceResult,
  ServiceError,
} from '@services/interfaces';

/**
 * Create a mock auth service
 */
export const createMockAuthService = (overrides?: Partial<IAuthService>): IAuthService => ({
  signIn: jest.fn().mockResolvedValue(ServiceResult.success({ user: { id: 'test-user' } })),
  signUp: jest.fn().mockResolvedValue(ServiceResult.success({ user: { id: 'test-user' } })),
  signOut: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  getCurrentUser: jest.fn().mockResolvedValue(ServiceResult.success({ id: 'test-user' })),
  refreshSession: jest.fn().mockResolvedValue(ServiceResult.success({ token: 'test-token' })),
  resetPassword: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  verifyEmail: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  ...overrides,
});

/**
 * Create a mock biometric service
 */
export const createMockBiometricService = (overrides?: Partial<IBiometricService>): IBiometricService => ({
  isAvailable: jest.fn().mockResolvedValue(ServiceResult.success(true)),
  authenticate: jest.fn().mockResolvedValue(ServiceResult.success(true)),
  getBiometryType: jest.fn().mockResolvedValue(ServiceResult.success('FaceID')),
  ...overrides,
});

/**
 * Create a mock data service
 */
export const createMockDataService = <T = any>(overrides?: Partial<IDataService<T>>): IDataService<T> => ({
  create: jest.fn().mockResolvedValue(ServiceResult.success({ id: '1' } as T)),
  read: jest.fn().mockResolvedValue(ServiceResult.success({ id: '1' } as T)),
  update: jest.fn().mockResolvedValue(ServiceResult.success({ id: '1' } as T)),
  delete: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  list: jest.fn().mockResolvedValue(ServiceResult.success([])),
  query: jest.fn().mockResolvedValue(ServiceResult.success([])),
  ...overrides,
});

/**
 * Create a mock storage service
 */
export const createMockStorageService = (overrides?: Partial<IStorageService>): IStorageService => {
  const store: Record<string, any> = {};
  
  return {
    get: jest.fn().mockImplementation((key: string) => 
      Promise.resolve(ServiceResult.success(store[key] || null))
    ),
    set: jest.fn().mockImplementation((key: string, value: any) => {
      store[key] = value;
      return Promise.resolve(ServiceResult.success(undefined));
    }),
    remove: jest.fn().mockImplementation((key: string) => {
      delete store[key];
      return Promise.resolve(ServiceResult.success(undefined));
    }),
    clear: jest.fn().mockImplementation(() => {
      Object.keys(store).forEach(key => delete store[key]);
      return Promise.resolve(ServiceResult.success(undefined));
    }),
    getAllKeys: jest.fn().mockImplementation(() => 
      Promise.resolve(ServiceResult.success(Object.keys(store)))
    ),
    ...overrides,
  };
};

/**
 * Create a mock AI service
 */
export const createMockAIService = (overrides?: Partial<IAIService>): IAIService => ({
  generateText: jest.fn().mockResolvedValue(
    ServiceResult.success({ text: 'AI generated response', tokens: 100 })
  ),
  analyzeContent: jest.fn().mockResolvedValue(
    ServiceResult.success({ sentiment: 'positive', confidence: 0.9 })
  ),
  moderateContent: jest.fn().mockResolvedValue(
    ServiceResult.success({ isSafe: true, flags: [] })
  ),
  ...overrides,
});

/**
 * Create a mock chat service
 */
export const createMockChatService = (overrides?: Partial<IChatService>): IChatService => ({
  sendMessage: jest.fn().mockResolvedValue(
    ServiceResult.success({ 
      id: 'msg-1', 
      content: 'Coach response', 
      role: 'assistant',
      timestamp: new Date() 
    })
  ),
  getConversation: jest.fn().mockResolvedValue(ServiceResult.success([])),
  clearConversation: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  detectEmotion: jest.fn().mockResolvedValue(
    ServiceResult.success({ emotion: 'neutral', confidence: 0.8 })
  ),
  ...overrides,
});

/**
 * Create a mock analytics service
 */
export const createMockAnalyticsService = (overrides?: Partial<IAnalyticsService>): IAnalyticsService => ({
  track: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  identify: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  screen: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  setUserProperties: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  reset: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  ...overrides,
});

/**
 * Create a mock notification service
 */
export const createMockNotificationService = (overrides?: Partial<INotificationService>): INotificationService => ({
  requestPermission: jest.fn().mockResolvedValue(ServiceResult.success(true)),
  scheduleNotification: jest.fn().mockResolvedValue(ServiceResult.success('notif-1')),
  cancelNotification: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  cancelAllNotifications: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  getScheduledNotifications: jest.fn().mockResolvedValue(ServiceResult.success([])),
  ...overrides,
});

/**
 * Create a mock network service
 */
export const createMockNetworkService = (overrides?: Partial<INetworkService>): INetworkService => ({
  isConnected: jest.fn().mockResolvedValue(ServiceResult.success(true)),
  getConnectionType: jest.fn().mockResolvedValue(ServiceResult.success('wifi')),
  onConnectionChange: jest.fn().mockReturnValue(() => {}),
  ...overrides,
});

/**
 * Create a mock sync service
 */
export const createMockSyncService = (overrides?: Partial<ISyncService>): ISyncService => ({
  sync: jest.fn().mockResolvedValue(ServiceResult.success({ synced: 10, failed: 0 })),
  syncCollection: jest.fn().mockResolvedValue(ServiceResult.success({ synced: 5, failed: 0 })),
  getQueueSize: jest.fn().mockResolvedValue(ServiceResult.success(0)),
  clearQueue: jest.fn().mockResolvedValue(ServiceResult.success(undefined)),
  ...overrides,
});

/**
 * Create a mock encryption service
 */
export const createMockEncryptionService = (overrides?: Partial<IEncryptionService>): IEncryptionService => ({
  encrypt: jest.fn().mockImplementation((data: string) => 
    Promise.resolve(ServiceResult.success(`encrypted_${data}`))
  ),
  decrypt: jest.fn().mockImplementation((data: string) => 
    Promise.resolve(ServiceResult.success(data.replace('encrypted_', '')))
  ),
  generateKey: jest.fn().mockResolvedValue(ServiceResult.success('test-key')),
  hash: jest.fn().mockImplementation((data: string) => 
    Promise.resolve(ServiceResult.success(`hash_${data}`))
  ),
  ...overrides,
});

/**
 * Service error builders for testing error scenarios
 */
export const serviceErrors = {
  network: () => new ServiceError('NETWORK_ERROR', 'Network request failed'),
  auth: () => new ServiceError('AUTH_ERROR', 'Authentication failed'),
  validation: (field: string) => new ServiceError('VALIDATION_ERROR', `Invalid ${field}`),
  notFound: (resource: string) => new ServiceError('NOT_FOUND', `${resource} not found`),
  permission: () => new ServiceError('PERMISSION_DENIED', 'Permission denied'),
  rateLimit: () => new ServiceError('RATE_LIMIT', 'Rate limit exceeded'),
  unknown: () => new ServiceError('UNKNOWN_ERROR', 'An unknown error occurred'),
};

/**
 * Helper to create a failing service method
 */
export const createFailingMethod = (error: ServiceError) => 
  jest.fn().mockResolvedValue(ServiceResult.failure(error));

/**
 * Helper to create a service method that fails after N calls
 */
export const createFlakeyMethod = <T>(successValue: T, failAfter: number, error: ServiceError) => {
  let callCount = 0;
  return jest.fn().mockImplementation(() => {
    callCount++;
    if (callCount > failAfter) {
      return Promise.resolve(ServiceResult.failure(error));
    }
    return Promise.resolve(ServiceResult.success(successValue));
  });
};