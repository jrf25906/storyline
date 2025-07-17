export type ThemeType = 'light' | 'dark' | 'system';

export interface Theme {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    background: string;
    backgroundHighContrast: string;
    surface: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    text: string;
    textHighContrast: string;
    textMuted: string;
    textSecondary: string;
    border: string;
    shadow: string;
    white: string;
    black: string;
    placeholder: string;
    card: string;
  };
  typography: {
    sizes: {
      h1: number;
      h2: number;
      h3: number;
      h4: number;
      body: number;
      bodySmall: number;
      caption: number;
      button: number;
    };
    weights: {
      regular: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

export const lightTheme: Theme = {
  colors: {
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    secondary: '#7C3AED',
    background: '#FFFFFF',
    backgroundHighContrast: '#000000',
    surface: '#F9FAFB',
    error: '#DC2626',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    text: '#111827',
    textHighContrast: '#FFFFFF',
    textMuted: '#6B7280',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    shadow: '#000000',
    white: '#FFFFFF',
    black: '#000000',
    placeholder: '#6B7280', // Improved from #9CA3AF for better contrast (4.5:1)
    card: '#FFFFFF',
  },
  typography: {
    sizes: {
      h1: 32,
      h2: 28,
      h3: 24,
      h4: 20,
      body: 16,
      bodySmall: 14,
      caption: 12,
      button: 16,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 10,
    },
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    secondary: '#8B5CF6',
    background: '#0F172A',
    backgroundHighContrast: '#FFFFFF',
    surface: '#1E293B',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#60A5FA',
    text: '#F9FAFB',
    textHighContrast: '#000000',
    textMuted: '#94A3B8',
    textSecondary: '#94A3B8',
    border: '#334155',
    shadow: '#000000',
    white: '#FFFFFF',
    black: '#000000',
    placeholder: '#94A3B8', // Improved from #64748B for better contrast on dark background
    card: '#1E293B',
  },
};