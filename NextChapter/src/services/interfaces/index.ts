/**
 * Central export for all service interfaces
 */

// Common types and utilities
export * from './common';

// Core service interfaces
export * from './IAuthService';
export * from './IAIService';
export * from './IDataService';

// Specialized service interfaces
export * from './auth';
export * from './ai';
export * from './analytics';
export * from './data';
export * from './network';
export * from './notification';
export * from './security';

// Re-export commonly used types for convenience
export type {
  Result,
  AppError,
  ErrorType,
  Timestamp,
  SyncStatus,
  Syncable,
  PaginationParams,
  PaginatedResponse,
  QueryOptions,
  ServiceLifecycle,
  NetworkState,
  StorageLimits,
} from './common';

export type {
  UserProfile,
  AuthSession,
  BiometricType,
  BiometricStatus,
  AuthEventType,
  AuthEvent,
} from './IAuthService';

export type {
  CoachTone,
  CoachMessage,
  CoachConversation,
  ResumeAnalysis,
  DetectedEmotion,
  AIUsageStats,
} from './IAIService';

export type {
  BaseEntity,
  Transaction,
  SyncEvent,
  SyncEventType,
  ConflictResolution,
  SyncOptions,
} from './IDataService';