// Next Chapter - Visual Language & Design System
// "Grounded Optimism" Color Tokens

export const Colors = {
  // Core Brand Colors
  primary: '#2D5A27',          // Deep Forest - Primary actions, progress
  secondary: '#7BA05B',        // Warm Sage - Secondary actions, support
  accent: '#E8A317',           // Soft Amber - Celebrations, highlights
  
  // Emotional Support Colors
  calmBlue: '#4A6FA5',         // Coach interactions, reassurance
  gentleCoral: '#D4736A',      // Gentle alerts, non-critical warnings
  softPurple: '#8B7CA6',       // Mood tracking, introspection
  successMint: '#A8DADC',      // Completion states, positive feedback
  
  // Feedback colors (updated for gentler approach)
  success: '#A8DADC',          // Success Mint
  error: '#D4736A',            // Gentle Coral (not harsh red)
  warning: '#E8A317',          // Soft Amber
  info: '#4A6FA5',             // Calm Blue
  
  // Functional Grays & Backgrounds
  background: '#FDFCF8',       // Warm Off-White - Primary background
  surface: '#FFFFFF',          // Card backgrounds
  surfaceSection: '#F7F9F7',   // Section backgrounds
  border: '#E8EDE9',           // Subtle borders, dividers
  textPrimary: '#1D2B1F',      // Primary text, high contrast
  textSecondary: '#5A6B5D',    // Secondary text, metadata
  textTertiary: '#8A9B8D',     // Placeholder text, disabled states
  muted: '#8A9B8D',            // Alias for textTertiary
  
  // Additional neutrals (updated to match design system)
  neutral: {
    50: '#FDFCF8',   // Warm Off-White
    100: '#F7F9F7',  // Section background
    200: '#E8EDE9',  // Light border
    300: '#D5DAD6',  // Medium border
    400: '#B3BDB6',  // Disabled elements
    500: '#8A9B8D',  // Tertiary text
    600: '#5A6B5D',  // Secondary text
    700: '#3A453C',  // Dark accent
    800: '#2A352C',  // Darker accent
    900: '#1D2B1F',  // Primary text
  },
  
  // Dark mode colors (maintain contrast while keeping warmth)
  dark: {
    background: '#1A1F1B',       // Dark green-gray
    surface: '#252B26',          // Slightly lighter surface
    surfaceVariant: '#2F3630',   // Card backgrounds
    textPrimary: '#FDFCF8',      // Warm off-white
    textSecondary: '#B3BDB6',    // Muted green-gray
    textTertiary: '#8A9B8D',     // Dimmer text
    border: '#3A453C',           // Subtle dark borders
  },
  
  // High contrast colors for accessibility
  highContrast: {
    background: '#000000',
    surface: '#000000',
    textPrimary: '#FFFFFF',
    textSecondary: '#FFFFFF',
    border: '#FFFFFF',
  },
  
  // Semantic colors (gentler approach)
  semantic: {
    positive: '#A8DADC',         // Success Mint
    negative: '#D4736A',         // Gentle Coral
    neutral: '#8A9B8D',          // Neutral gray
    warning: '#E8A317',          // Soft Amber
  },
  
  // Transparent colors
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export type ColorKeys = keyof typeof Colors;