import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  lightCompatibleTheme,
  darkCompatibleTheme,
  Theme,
  ThemeType,
} from '../theme';

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
    const isDark =
      themeType === 'system'
        ? systemColorScheme === 'dark'
        : themeType === 'dark';

    let theme = isDark ? darkCompatibleTheme : lightCompatibleTheme;

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
