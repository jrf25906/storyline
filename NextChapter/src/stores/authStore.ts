// This file provides a compatibility layer for tests expecting authStore
// The actual authentication is handled by AuthContext

import { useAuth } from '../hooks/useAuth';

// Re-export useAuth as useAuthStore for backward compatibility with tests
export const useAuthStore = () => {
  const auth = useAuth();
  
  return {
    user: auth.user,
    isAuthenticated: !!auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
    resetPassword: auth.resetPassword,
    // Email verification
    isEmailVerified: auth.isEmailVerified,
    checkEmailVerification: auth.checkEmailVerification,
    resendVerificationEmail: auth.resendVerificationEmail,
    // Biometric authentication
    isBiometricSupported: auth.isBiometricSupported,
    isBiometricEnabled: auth.isBiometricEnabled,
    biometricType: auth.biometricType,
    authenticateWithBiometric: auth.authenticateWithBiometric,
    enableBiometric: auth.enableBiometric,
    disableBiometric: auth.disableBiometric,
  };
};