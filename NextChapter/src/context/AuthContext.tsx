import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/api/supabase';
import type { User } from '@supabase/supabase-js';
import { logAnalyticsEvent } from '../utils/analytics';
import { BiometricService } from '../services/auth/biometricService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  error: string | null;
  // Email verification
  isEmailVerified: boolean;
  checkEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  // Biometric authentication
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  biometricType: string;
  authenticateWithBiometric: () => Promise<boolean>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null; // For testing purposes
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric Authentication');

  useEffect(() => {
    // Skip getting initial session if initialUser is provided (for testing)
    if (initialUser !== undefined) {
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setIsEmailVerified(session?.user?.email_confirmed_at ? true : false);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();
    
    // Check biometric support
    const checkBiometric = async () => {
      const supported = await BiometricService.isBiometricSupported();
      setIsBiometricSupported(supported);
      
      if (supported) {
        const enabled = await BiometricService.isBiometricEnabled();
        setIsBiometricEnabled(enabled);
        
        const type = await BiometricService.getBiometricTypeString();
        setBiometricType(type);
      }
    };
    
    checkBiometric();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsEmailVerified(session?.user?.email_confirmed_at ? true : false);
        setIsLoading(false);
        
        if (event === 'SIGNED_IN') {
          logAnalyticsEvent('user_signed_in', { method: 'email' });
          
          // Check if we should prompt for biometric enrollment
          if (isBiometricSupported && !isBiometricEnabled && session?.user?.id && session?.user?.email_confirmed_at) {
            setTimeout(async () => {
              const enrolled = await BiometricService.promptForBiometricEnrollment(session.user.id);
              if (enrolled) {
                setIsBiometricEnabled(true);
              }
            }, 1000);
          }
        } else if (event === 'SIGNED_OUT') {
          logAnalyticsEvent('user_signed_out', {});
          setIsEmailVerified(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      logAnalyticsEvent('user_signed_up', { method: 'email' });
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      logAnalyticsEvent('password_reset_requested', { email });
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      const result = await BiometricService.authenticateWithBiometric();
      
      if (result.success && result.userId) {
        // Get the user session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id === result.userId) {
          logAnalyticsEvent('user_signed_in', { method: 'biometric' });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const enableBiometric = async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const enrolled = await BiometricService.promptForBiometricEnrollment(user.id);
      if (enrolled) {
        setIsBiometricEnabled(true);
        logAnalyticsEvent('biometric_enabled', { type: biometricType });
      }
      return enrolled;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      await BiometricService.disableBiometric();
      setIsBiometricEnabled(false);
      logAnalyticsEvent('biometric_disabled', { type: biometricType });
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const verified = currentUser?.email_confirmed_at ? true : false;
      setIsEmailVerified(verified);
      return verified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!user?.email) {
      throw new Error('No email address found');
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      logAnalyticsEvent('verification_email_resent', { email: user.email });
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    error,
    // Email verification
    isEmailVerified,
    checkEmailVerification,
    resendVerificationEmail,
    // Biometric authentication
    isBiometricSupported,
    isBiometricEnabled,
    biometricType,
    authenticateWithBiometric,
    enableBiometric,
    disableBiometric,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}