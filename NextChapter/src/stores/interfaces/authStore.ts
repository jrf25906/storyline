import { BaseStore } from '@stores/interfaces/base';
import { User } from '@supabase/supabase-js';

/**
 * Authentication store interface
 * Handles user authentication, email verification, and biometric auth
 */
export interface AuthStore extends BaseStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Email verification
  isEmailVerified: boolean;
  
  // Biometric authentication
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  biometricType: string | null;
  
  // Authentication actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // Email verification actions
  checkEmailVerification: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  
  // Biometric authentication actions
  authenticateWithBiometric: () => Promise<boolean>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
}