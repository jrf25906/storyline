// Next Chapter - Border & Shadow System
// "Grounded Optimism" Design Language
import { Colors } from '@theme/colors';

export const Borders = {
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,      // 0.8rem - Standard radius for inputs, buttons
    lg: 16,     // 1.6rem - Cards and containers
    xl: 24,     // 2.4rem - Special elements, pills
    full: 9999, // Fully rounded elements
  },
  
  width: {
    none: 0,
    hairline: 0.5,
    thin: 1,
    medium: 2,   // Standard border width
    thick: 3,    // Emphasis borders (crisis mode)
    heavy: 4,
  },
};

export const Shadows = {
  none: {
    shadowColor: Colors.transparent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  // Subtle shadows for gentle depth
  shadow1: {
    shadowColor: Colors.textPrimary,  // Using textPrimary for warmer shadows
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  
  shadow2: {
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  
  shadow3: {
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  
  shadow4: {
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 32,
    elevation: 12,
  },
  
  // Component-specific shadows (gentler approach)
  card: {
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  
  cardHover: {
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  
  button: {
    shadowColor: Colors.primary,  // Primary color shadow for buttons
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 3,
  },
  
  buttonActive: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  
  modal: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  
  // Focus state shadow for accessibility
  focus: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 0,
  },
};

// Legacy support
export const Border = {
  radius: Borders.radius,
  shadow1: Shadows.shadow1,
  lightBorder: {
    borderWidth: Borders.width.thin,
    borderColor: Colors.border,
  },
};

export type BorderRadiusKey = keyof typeof Borders.radius;
export type ShadowKey = keyof typeof Shadows;