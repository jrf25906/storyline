import { Result, ServiceLifecycle, ServiceObserver } from '@services/interfaces/common';

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  avatarUrl?: string;
  layoffDate?: Date;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication session
 */
export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

/**
 * Sign up data
 */
export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Sign in data
 */
export interface SignInData {
  email: string;
  password: string;
}

/**
 * Biometric authentication types
 */
export enum BiometricType {
  FACE_ID = 'FACE_ID',
  TOUCH_ID = 'TOUCH_ID',
  FINGERPRINT = 'FINGERPRINT',
  FACE_RECOGNITION = 'FACE_RECOGNITION',
  NONE = 'NONE',
}

/**
 * Biometric authentication status
 */
export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  type: BiometricType;
  lastUsedAt?: Date;
}

/**
 * Auth state change events
 */
export enum AuthEventType {
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  BIOMETRIC_ENROLLED = 'BIOMETRIC_ENROLLED',
  BIOMETRIC_REMOVED = 'BIOMETRIC_REMOVED',
}

/**
 * Auth event data
 */
export interface AuthEvent {
  type: AuthEventType;
  user?: UserProfile;
  timestamp: Date;
}

/**
 * Password reset data
 */
export interface PasswordResetData {
  email: string;
}

/**
 * Password update data
 */
export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Email verification status
 */
export interface EmailVerificationStatus {
  isVerified: boolean;
  lastSentAt?: Date;
  canResend: boolean;
  resendCooldownSeconds?: number;
}

/**
 * Authentication service interface
 * Handles user authentication, biometrics, and session management
 */
export interface IAuthService extends ServiceLifecycle {
  /**
   * Sign up a new user
   */
  signUp(data: SignUpData): Promise<Result<AuthSession>>;

  /**
   * Sign in an existing user
   */
  signIn(data: SignInData): Promise<Result<AuthSession>>;

  /**
   * Sign in with biometric authentication
   */
  signInWithBiometric(): Promise<Result<AuthSession>>;

  /**
   * Sign out the current user
   */
  signOut(): Promise<Result<void>>;

  /**
   * Get current session
   */
  getCurrentSession(): Promise<Result<AuthSession | null>>;

  /**
   * Get current user profile
   */
  getCurrentUser(): Promise<Result<UserProfile | null>>;

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Promise<Result<boolean>>;

  /**
   * Refresh the current session
   */
  refreshSession(): Promise<Result<AuthSession>>;

  /**
   * Update user profile
   */
  updateProfile(data: Partial<UserProfile>): Promise<Result<UserProfile>>;

  /**
   * Request password reset
   */
  requestPasswordReset(data: PasswordResetData): Promise<Result<void>>;

  /**
   * Confirm password reset with token
   */
  confirmPasswordReset(token: string, newPassword: string): Promise<Result<void>>;

  /**
   * Update password for authenticated user
   */
  updatePassword(data: PasswordUpdateData): Promise<Result<void>>;

  /**
   * Get email verification status
   */
  getEmailVerificationStatus(): Promise<Result<EmailVerificationStatus>>;

  /**
   * Send email verification
   */
  sendEmailVerification(): Promise<Result<void>>;

  /**
   * Verify email with token
   */
  verifyEmail(token: string): Promise<Result<void>>;

  /**
   * Change user email
   */
  changeEmail(newEmail: string, password: string): Promise<Result<void>>;

  /**
   * Get biometric authentication status
   */
  getBiometricStatus(): Promise<Result<BiometricStatus>>;

  /**
   * Check if biometric authentication is available
   */
  isBiometricAvailable(): Promise<Result<boolean>>;

  /**
   * Enroll biometric authentication
   */
  enrollBiometric(): Promise<Result<void>>;

  /**
   * Remove biometric authentication
   */
  removeBiometric(): Promise<Result<void>>;

  /**
   * Prompt for biometric authentication
   */
  authenticateWithBiometric(reason: string): Promise<Result<boolean>>;

  /**
   * Delete user account
   */
  deleteAccount(password: string): Promise<Result<void>>;

  /**
   * Subscribe to auth state changes
   */
  subscribeAuthState(observer: ServiceObserver<AuthEvent>): () => void;

  /**
   * Set up automatic session refresh
   */
  enableAutoRefresh(enabled: boolean): void;

  /**
   * Clear all stored auth data (for security)
   */
  clearAuthData(): Promise<Result<void>>;

  /**
   * Handle deep link for auth (email verification, password reset)
   */
  handleAuthDeepLink(url: string): Promise<Result<{
    type: 'email_verification' | 'password_reset';
    success: boolean;
  }>>;

  /**
   * Get auth state for debugging/logging
   */
  getAuthState(): Promise<Result<{
    isAuthenticated: boolean;
    userId?: string;
    sessionExpiresAt?: Date;
    biometricEnrolled: boolean;
  }>>;
}