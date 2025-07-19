/**
 * Legacy ThemeContext module - now redirects to SafeThemeProvider
 * This file is kept for backward compatibility
 */

// Re-export everything from SafeThemeProvider
export { SafeThemeProvider as ThemeProvider, useTheme } from '../components/common/SafeThemeProvider';

// Re-export types for backward compatibility
export type { Theme, ThemeType } from '../theme';
