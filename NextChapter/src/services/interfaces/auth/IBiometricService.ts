/**
 * Biometric authentication service interface
 */

import { Result } from '@services/interfaces/common/result';

export interface IBiometricService {
  // Availability checks
  isSupported(): Promise<Result<boolean>>;
  isEnrolled(): Promise<Result<boolean>>;
  getBiometricType(): Promise<Result<BiometricType[]>>;
  
  // Configuration
  isEnabled(): Promise<Result<boolean>>;
  enable(userId: string): Promise<Result<void>>;
  disable(): Promise<Result<void>>;
  
  // Authentication
  authenticate(options?: BiometricAuthOptions): Promise<Result<BiometricAuthResult>>;
  
  // Enrollment prompt
  promptForEnrollment(userId: string): Promise<Result<boolean>>;
  
  // Utility
  getBiometricTypeString(): Promise<Result<string>>;
}

export type BiometricType = 
  | 'fingerprint'
  | 'face'
  | 'iris'
  | 'voice'
  | 'unknown';

export interface BiometricAuthOptions {
  promptMessage?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  requireConfirmation?: boolean; // Android only
}

export interface BiometricAuthResult {
  success: boolean;
  userId?: string;
  error?: BiometricError;
  warning?: string;
}

export interface BiometricError {
  code: BiometricErrorCode;
  message: string;
}

export type BiometricErrorCode =
  | 'not_enrolled'
  | 'not_available'
  | 'user_cancel'
  | 'system_cancel'
  | 'lockout'
  | 'permanent_lockout'
  | 'authentication_failed'
  | 'hardware_error'
  | 'no_space'
  | 'timeout'
  | 'unable_to_process'
  | 'user_fallback'
  | 'passcode_not_set'
  | 'unknown';