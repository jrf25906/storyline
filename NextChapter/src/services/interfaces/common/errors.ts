/**
 * Common error types for service layer
 */

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public readonly name: string = 'ServiceError',
    public readonly details?: any
  ) {
    super(message);
    this.name = name;
  }
}

// Network errors
export class NetworkError extends ServiceError {
  constructor(message: string, details?: any) {
    super('NETWORK_ERROR', message, details);
  }
}

export class TimeoutError extends NetworkError {
  constructor(message: string = 'Operation timed out', details?: any) {
    super(message, details);
  }
}

export class OfflineError extends NetworkError {
  constructor(message: string = 'No network connection', details?: any) {
    super(message, details);
  }
}

// Authentication errors
export class AuthenticationError extends ServiceError {
  constructor(message: string, details?: any) {
    super('AUTH_ERROR', message, details);
  }
}

export class UnauthorizedError extends AuthenticationError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, details);
  }
}

export class SessionExpiredError extends AuthenticationError {
  constructor(message: string = 'Session expired', details?: any) {
    super(message, details);
  }
}

// Data errors
export class DataError extends ServiceError {
  constructor(message: string, details?: any) {
    super('DATA_ERROR', message, details);
  }
}

export class NotFoundError extends DataError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message);
  }
}

export class ValidationError extends DataError {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]>
  ) {
    super(message, errors);
  }
}

export class ConflictError extends DataError {
  constructor(message: string, details?: any) {
    super(message, details);
  }
}

// Storage errors
export class StorageError extends ServiceError {
  constructor(message: string, details?: any) {
    super('STORAGE_ERROR', message, details);
  }
}

export class StorageLimitError extends StorageError {
  constructor(
    public readonly currentSize: number,
    public readonly maxSize: number
  ) {
    super(`Storage limit exceeded: ${currentSize} / ${maxSize} bytes`);
  }
}

// AI/API errors
export class ExternalServiceError extends ServiceError {
  constructor(
    public readonly service: string,
    message: string,
    public readonly statusCode?: number,
    details?: any
  ) {
    super('EXTERNAL_SERVICE_ERROR', message, details);
  }
}

export class RateLimitError extends ExternalServiceError {
  constructor(
    service: string,
    public readonly retryAfter?: number,
    details?: any
  ) {
    super(service, 'Rate limit exceeded', 429, details);
  }
}

export class QuotaExceededError extends ExternalServiceError {
  constructor(
    service: string,
    public readonly quotaType: string,
    details?: any
  ) {
    super(service, `${quotaType} quota exceeded`, 429, details);
  }
}

// Security errors
export class SecurityError extends ServiceError {
  constructor(message: string, details?: any) {
    super('SECURITY_ERROR', message, details);
  }
}

export class EncryptionError extends SecurityError {
  constructor(message: string = 'Encryption/decryption failed', details?: any) {
    super(message, details);
  }
}

export class BiometricError extends SecurityError {
  constructor(
    message: string,
    public readonly reason?: 'not_enrolled' | 'not_available' | 'user_cancel' | 'failed',
    details?: any
  ) {
    super(message, details);
  }
}

// Sync errors
export class SyncError extends ServiceError {
  constructor(message: string, details?: any) {
    super('SYNC_ERROR', message, details);
  }
}

export class SyncConflictError extends SyncError {
  constructor(
    public readonly localVersion: any,
    public readonly remoteVersion: any,
    details?: any
  ) {
    super('Sync conflict detected', details);
  }
}

// Helper to determine if error is recoverable
export function isRecoverableError(error: Error): boolean {
  return error instanceof NetworkError ||
         error instanceof TimeoutError ||
         error instanceof RateLimitError ||
         (error instanceof ExternalServiceError && error.statusCode && error.statusCode >= 500);
}

// Helper to get user-friendly error message
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof OfflineError) {
    return "You're currently offline. Your changes will sync when you're back online.";
  }
  if (error instanceof SessionExpiredError) {
    return 'Your session has expired. Please sign in again.';
  }
  if (error instanceof StorageLimitError) {
    return "You're running out of storage space. Please free up some space to continue.";
  }
  if (error instanceof RateLimitError) {
    return "You've made too many requests. Please try again in a few moments.";
  }
  if (error instanceof BiometricError) {
    switch (error.reason) {
      case 'not_enrolled':
        return 'Please set up biometric authentication in your device settings.';
      case 'not_available':
        return 'Biometric authentication is not available on this device.';
      case 'user_cancel':
        return 'Authentication was cancelled.';
      default:
        return 'Biometric authentication failed. Please try again.';
    }
  }
  
  // Default message
  return 'Something went wrong. Please try again.';
}