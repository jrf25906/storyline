/**
 * ThemeProvider for the Storyline mobile app
 * Provides theme context with voice-first and emotional safety considerations
 */

import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows, animations, voice, safety } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof colors.light;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  animations: typeof animations;
  voice: typeof voice;
  safety: typeof safety;
}

interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'auto',
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultMode as ThemeMode);
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Determine if dark mode should be active
  const isDark = 
    themeMode === 'dark' || 
    (themeMode === 'auto' && systemColorScheme === 'dark');

  // Create theme object with current mode
  const theme: Theme = {
    mode: themeMode,
    isDark,
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    borderRadius,
    shadows: {
      ...shadows,
      // Adjust shadow opacity for dark mode
      sm: {
        ...shadows.sm,
        shadowOpacity: isDark ? 0.3 : 0.05,
      },
      base: {
        ...shadows.base,
        shadowOpacity: isDark ? 0.4 : 0.1,
      },
      md: {
        ...shadows.md,
        shadowOpacity: isDark ? 0.4 : 0.1,
      },
      lg: {
        ...shadows.lg,
        shadowOpacity: isDark ? 0.5 : 0.15,
      },
      xl: {
        ...shadows.xl,
        shadowOpacity: isDark ? 0.6 : 0.2,
      },
    },
    animations,
    voice: {
      ...voice,
      // Adapt voice bubble colors to theme
      bubble: {
        user: {
          backgroundColor: isDark ? colors.dark.softPlum : colors.light.softPlum,
          textColor: isDark ? colors.dark.inkBlack : colors.light.parchmentWhite,
        },
        ai: {
          backgroundColor: isDark ? colors.dark.whisperGray : colors.light.whisperGray,
          textColor: isDark ? colors.dark.text : colors.light.text,
        },
      },
    },
    safety: {
      ...safety,
      // Adapt safety theming to current mode
      safeSpace: {
        backgroundColor: isDark ? colors.dark.safeSpace : colors.light.safeSpace,
        borderColor: isDark ? colors.dark.softBlush : colors.light.softBlush,
        textColor: isDark ? colors.dark.text : colors.light.text,
      },
    },
  };

  const toggleTheme = () => {
    setThemeMode(current => {
      switch (current) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'auto';
        case 'auto':
          return 'light';
        default:
          return 'light';
      }
    });
  };

  const contextValue: ThemeContextType = {
    theme,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hooks for common theme usage patterns
export const useColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

export const useTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

export const useSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};

export const useVoiceTheme = () => {
  const { theme } = useTheme();
  return theme.voice;
};

export const useSafetyTheme = () => {
  const { theme } = useTheme();
  return theme.safety;
};

// Style helpers for common patterns
export const createThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: Theme) => T
) => {
  return (theme: Theme): T => styleFactory(theme);
};

// Predefined theme variants for voice states
export const voiceStateThemes = {
  idle: (theme: Theme) => ({
    color: theme.colors.slateGray,
    backgroundColor: theme.colors.background,
  }),
  listening: (theme: Theme) => ({
    color: theme.voice.feedback.processing,
    backgroundColor: theme.colors.softBlush,
  }),
  recording: (theme: Theme) => ({
    color: theme.voice.feedback.error,
    backgroundColor: theme.colors.error + '10', // 10% opacity
  }),
  processing: (theme: Theme) => ({
    color: theme.voice.feedback.processing,
    backgroundColor: theme.colors.warning + '10', // 10% opacity
  }),
  complete: (theme: Theme) => ({
    color: theme.voice.feedback.success,
    backgroundColor: theme.colors.success + '10', // 10% opacity
  }),
};

// Safety state themes for emotional safety features
export const safetyStateThemes = {
  safe: (theme: Theme) => ({
    color: theme.safety.emotional.safe,
    backgroundColor: theme.colors.success + '10',
  }),
  caution: (theme: Theme) => ({
    color: theme.safety.emotional.caution,
    backgroundColor: theme.colors.warning + '10',
  }),
  concern: (theme: Theme) => ({
    color: theme.safety.emotional.concern,
    backgroundColor: theme.colors.error + '10',
  }),
};