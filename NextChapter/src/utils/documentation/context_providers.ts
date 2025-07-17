// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme, ThemeType } from '../styles/theme';

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  isHighContrast: boolean;
  setIsHighContrast: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>('system');
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Determine the actual theme to use
  const getTheme = (): Theme => {
    const isDark = themeType === 'system' 
      ? systemColorScheme === 'dark' 
      : themeType === 'dark';
    
    let theme = isDark ? darkTheme : lightTheme;
    
    // Apply high contrast if enabled
    if (isHighContrast) {
      theme = {
        ...theme,
        colors: {
          ...theme.colors,
          text: theme.colors.textHighContrast,
          background: theme.colors.backgroundHighContrast,
        },
      };
    }
    
    return theme;
  };

  const [theme, setTheme] = useState<Theme>(getTheme());

  // Load saved preferences
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        const savedThemeType = await AsyncStorage.getItem('themeType');
        const savedHighContrast = await AsyncStorage.getItem('isHighContrast');
        
        if (savedThemeType) {
          setThemeType(savedThemeType as ThemeType);
        }
        if (savedHighContrast) {
          setIsHighContrast(JSON.parse(savedHighContrast));
        }
      } catch (error) {
        console.warn('Failed to load theme preferences:', error);
      }
    };

    loadThemePreferences();
  }, []);

  // Update theme when preferences change
  useEffect(() => {
    setTheme(getTheme());
  }, [themeType, systemColorScheme, isHighContrast]);

  // Save theme type preference
  const handleSetThemeType = async (type: ThemeType) => {
    setThemeType(type);
    try {
      await AsyncStorage.setItem('themeType', type);
    } catch (error) {
      console.warn('Failed to save theme type:', error);
    }
  };

  // Save high contrast preference
  const handleSetIsHighContrast = async (enabled: boolean) => {
    setIsHighContrast(enabled);
    try {
      await AsyncStorage.setItem('isHighContrast', JSON.stringify(enabled));
    } catch (error) {
      console.warn('Failed to save high contrast preference:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    themeType,
    setThemeType: handleSetThemeType,
    isHighContrast,
    setIsHighContrast: handleSetIsHighContrast,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/api/supabase';
import type { User } from '@supabase/supabase-js';
import { logAnalyticsEvent } from '../utils/analytics';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (event === 'SIGNED_IN') {
          logAnalyticsEvent('user_signed_in', { method: 'email' });
        } else if (event === 'SIGNED_OUT') {
          logAnalyticsEvent('user_signed_out', {});
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

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    error,
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

// src/context/OfflineContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface OfflineContextType {
  isConnected: boolean;
  isWifiEnabled: boolean;
  networkType: string | null;
  hasPendingSyncs: boolean;
  syncInProgress: boolean;
  triggerSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isWifiEnabled, setIsWifiEnabled] = useState(false);
  const [networkType, setNetworkType] = useState<string | null>(null);
  const [hasPendingSyncs, setHasPendingSyncs] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsWifiEnabled(state.type === 'wifi');
      setNetworkType(state.type);
    });

    return unsubscribe;
  }, []);

  const triggerSync = async () => {
    if (!isConnected || syncInProgress) return;
    
    setSyncInProgress(true);
    try {
      // Import sync manager dynamically to avoid circular dependencies
      const { syncManager } = await import('../services/database/sync/syncManager');
      await syncManager.syncAll();
      setHasPendingSyncs(false);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isConnected && hasPendingSyncs && !syncInProgress) {
      triggerSync();
    }
  }, [isConnected, hasPendingSyncs, syncInProgress]);

  const value: OfflineContextType = {
    isConnected,
    isWifiEnabled,
    networkType,
    hasPendingSyncs,
    syncInProgress,
    triggerSync,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}