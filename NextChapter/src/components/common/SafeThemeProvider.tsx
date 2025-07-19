import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  lightCompatibleTheme,
  darkCompatibleTheme,
  Theme,
  ThemeType,
} from '@theme';

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  isHighContrast: boolean;
  setIsHighContrast: (enabled: boolean) => void;
}

const SafeThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface SafeThemeProviderProps {
  children: ReactNode;
  testTheme?: Partial<Theme>;
}

/**
 * A wrapper component that provides theme context with test override capability
 */
export const SafeThemeProvider: React.FC<SafeThemeProviderProps> = ({ children, testTheme }) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>('system');
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Calculate theme based on current state
  const theme = React.useMemo(() => {
    const isDark =
      themeType === 'system'
        ? systemColorScheme === 'dark'
        : themeType === 'dark';

    let calculatedTheme = isDark ? darkCompatibleTheme : lightCompatibleTheme;

    // Apply high contrast if enabled
    if (isHighContrast) {
      calculatedTheme = {
        ...calculatedTheme,
        colors: {
          ...calculatedTheme.colors,
          text: calculatedTheme.colors.textHighContrast,
          background: calculatedTheme.colors.backgroundHighContrast,
        },
      };
    }

    // Apply test theme overrides if provided
    if (testTheme) {
      calculatedTheme = {
        ...calculatedTheme,
        ...testTheme,
        colors: {
          ...calculatedTheme.colors,
          ...(testTheme.colors || {}),
        },
        typography: {
          ...calculatedTheme.typography,
          ...(testTheme.typography || {}),
        },
        spacing: {
          ...calculatedTheme.spacing,
          ...(testTheme.spacing || {}),
        },
        borders: {
          ...calculatedTheme.borders,
          ...(testTheme.borders || {}),
        },
        shadows: {
          ...calculatedTheme.shadows,
          ...(testTheme.shadows || {}),
        },
      };
    }

    return calculatedTheme;
  }, [themeType, systemColorScheme, isHighContrast, testTheme]);

  // Load saved preferences (skip in test environment)
  useEffect(() => {
    if (testTheme) return; // Skip loading preferences when testing

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
  }, [testTheme]);

  // Save theme type preference (skip in test environment)
  const handleSetThemeType = async (type: ThemeType) => {
    setThemeType(type);
    if (!testTheme) {
      try {
        await AsyncStorage.setItem('themeType', type);
      } catch (error) {
        console.warn('Failed to save theme type:', error);
      }
    }
  };

  // Save high contrast preference (skip in test environment)
  const handleSetIsHighContrast = async (enabled: boolean) => {
    setIsHighContrast(enabled);
    if (!testTheme) {
      try {
        await AsyncStorage.setItem('isHighContrast', JSON.stringify(enabled));
      } catch (error) {
        console.warn('Failed to save high contrast preference:', error);
      }
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
    <SafeThemeContext.Provider value={value}>
      {children}
    </SafeThemeContext.Provider>
  );
};

/**
 * Hook to use the safe theme context
 */
export function useSafeTheme(): ThemeContextType {
  const context = useContext(SafeThemeContext);
  if (!context) {
    throw new Error('useSafeTheme must be used within a SafeThemeProvider');
  }
  return context;
}

/**
 * Re-export useTheme hook for compatibility
 */
export { useSafeTheme as useTheme };