// Export all design tokens
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './borders';
export * from './animations';

// Re-export theme types from styles/theme.ts for backward compatibility
export { type Theme, type ThemeType } from '../styles/theme';

// Import tokens
import { Colors } from '@theme/colors';
import { Typography } from '@theme/typography';
import { Spacing } from '@theme/spacing';
import { Borders, Shadows } from '@theme/borders';
import { Motion } from '@theme/animations';

// Import the base themes for backward compatibility
import { lightTheme as baseLightTheme, darkTheme as baseDarkTheme } from '@/styles/theme';

// Create new theme structure using design tokens
export const lightTheme = {
  colors: {
    ...Colors,
    // Map to match existing theme structure
    primary: Colors.primary,
    primaryLight: Colors.secondary,
    primaryDark: Colors.primary,
    secondary: Colors.secondary,
    background: Colors.background,
    backgroundHighContrast: Colors.highContrast.background,
    surface: Colors.surface,
    surfaceSection: Colors.surfaceSection,
    error: Colors.error,
    warning: Colors.warning,
    success: Colors.success,
    info: Colors.info,
    text: Colors.textPrimary,
    textHighContrast: Colors.highContrast.textPrimary,
    textMuted: Colors.muted,
    textSecondary: Colors.textSecondary,
    textTertiary: Colors.textTertiary,
    border: Colors.border,
    shadow: Colors.black,
    white: Colors.white,
    black: Colors.black,
    placeholder: Colors.muted,
    card: Colors.surface,
    // New emotional support colors
    calmBlue: Colors.calmBlue,
    gentleCoral: Colors.gentleCoral,
    softPurple: Colors.softPurple,
    successMint: Colors.successMint,
  },
  typography: Typography,
  spacing: Spacing,
  borders: Borders,
  shadows: Shadows,
  motion: Motion,
  // Legacy support
  borderRadius: Borders.radius,
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...Colors,
    ...Colors.dark,
    // Override with dark mode colors
    primary: Colors.primary,
    primaryLight: Colors.secondary,
    primaryDark: Colors.primary,
    secondary: Colors.secondary,
    background: Colors.dark.background,
    backgroundHighContrast: Colors.highContrast.background,
    surface: Colors.dark.surface,
    surfaceSection: Colors.dark.surfaceVariant,
    error: Colors.error,
    warning: Colors.warning,
    success: Colors.success,
    info: Colors.info,
    text: Colors.dark.textPrimary,
    textHighContrast: Colors.highContrast.textPrimary,
    textMuted: Colors.dark.textSecondary,
    textSecondary: Colors.dark.textSecondary,
    textTertiary: Colors.dark.textTertiary,
    border: Colors.dark.border,
    shadow: Colors.black,
    white: Colors.white,
    black: Colors.black,
    placeholder: Colors.dark.textSecondary,
    card: Colors.dark.surfaceVariant,
    // New emotional support colors (slightly adjusted for dark mode)
    calmBlue: Colors.calmBlue,
    gentleCoral: Colors.gentleCoral,
    softPurple: Colors.softPurple,
    successMint: Colors.successMint,
  },
};

// Create a comprehensive theme object that supports both old and new API
const createCompatibleTheme = (baseTheme: typeof baseLightTheme, newTheme: typeof lightTheme) => ({
  ...newTheme,
  colors: {
    ...newTheme.colors,
    ...baseTheme.colors,
    // Ensure all color mappings work
    primaryLight: newTheme.colors.primaryLight,
    primaryDark: newTheme.colors.primaryDark,
    secondaryLight: newTheme.colors.info,
    secondaryDark: newTheme.colors.secondary,
    errorLight: '#FADBD8',
    warningLight: '#FCF3CF',
    successLight: '#D5F4E6',
    infoLight: '#EBF5FB',
    disabled: '#BDC3C7',
  },
  
  spacing: {
    ...newTheme.spacing,
    ...baseTheme.spacing,
  },
  
  typography: {
    ...newTheme.typography,
    // Support both old and new API
    sizes: {
      ...newTheme.typography.fontSizes,
      h1: newTheme.typography.fontSizes.displayXL,
      h2: newTheme.typography.fontSizes.displayLG,
      h3: newTheme.typography.fontSizes.headingLG,
      h4: newTheme.typography.fontSizes.headingMD,
      body: newTheme.typography.fontSizes.body,
      bodySmall: newTheme.typography.fontSizes.bodySM,
      caption: newTheme.typography.fontSizes.caption,
      button: newTheme.typography.fontSizes.body,
    },
    weights: newTheme.typography.fontWeights,
    fontSize: {
      xs: newTheme.typography.fontSizes.caption,
      sm: newTheme.typography.fontSizes.bodySM,
      md: newTheme.typography.fontSizes.body,
      lg: newTheme.typography.fontSizes.bodyLG,
      xl: newTheme.typography.fontSizes.headingMD,
      xxl: newTheme.typography.fontSizes.headingLG,
      title: newTheme.typography.fontSizes.displayLG,
      hero: 36,
    },
    fontWeight: newTheme.typography.fontWeights,
    // Add individual typography styles for components expecting them
    heading1: {
      fontSize: newTheme.typography.fontSizes.displayXL,
      fontWeight: newTheme.typography.fontWeights.bold,
    },
    heading2: {
      fontSize: newTheme.typography.fontSizes.displayLG,
      fontWeight: newTheme.typography.fontWeights.bold,
    },
    heading3: {
      fontSize: newTheme.typography.fontSizes.headingLG,
      fontWeight: newTheme.typography.fontWeights.semiBold,
    },
    body: {
      fontSize: newTheme.typography.fontSizes.body,
      fontWeight: newTheme.typography.fontWeights.regular,
    },
    caption: {
      fontSize: newTheme.typography.fontSizes.caption,
      fontWeight: newTheme.typography.fontWeights.regular,
    },
  },
  
  borderRadius: {
    ...newTheme.borders.radius,
    ...baseTheme.borderRadius,
    small: newTheme.borders.radius.sm,
    medium: newTheme.borders.radius.md,
    large: newTheme.borders.radius.lg,
  },
  
  shadows: {
    ...newTheme.shadows,
    small: newTheme.shadows.shadow1,
    medium: newTheme.shadows.shadow2,
    large: newTheme.shadows.shadow3,
    sm: baseTheme.shadows.sm,
    md: baseTheme.shadows.md,
    lg: baseTheme.shadows.lg,
  },
});

// Export the default (light) theme as 'theme' for backward compatibility
export const theme = createCompatibleTheme(baseLightTheme, lightTheme);

// Also export explicitly named themes
export const defaultTheme = theme;
export const lightCompatibleTheme = theme;
export const darkCompatibleTheme = createCompatibleTheme(baseDarkTheme, darkTheme);