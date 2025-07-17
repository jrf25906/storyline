// Next Chapter - Spacing System
// Based on 16px grid unit for "Grounded Optimism" design

export const Spacing = {
  // Base scale (following design system)
  xxs: 4,   // 0.4rem - Icon spacing, tight elements
  xs: 8,    // 0.8rem - Text spacing, close elements
  sm: 12,   // Keeping for backward compatibility
  md: 16,   // 1.6rem - Standard spacing, component gaps
  lg: 24,   // 2.4rem - Section spacing, breathing room
  xl: 32,   // 3.2rem - Major section breaks
  xxl: 48,  // 4.8rem - Page sections, major breaks
  xxxl: 64, // Extra large spacing
  
  // Semantic spacing
  none: 0,
  hairline: 1,
  thin: 2,
  
  // Grid unit
  gridUnit: 16,  // Base grid unit - everything aligns to this
  
  // Component-specific spacing
  inputPadding: 16,
  cardPadding: 24,      // Updated for more breathing room
  screenPadding: 16,
  sectionPadding: 32,   // Between major sections
  
  // Touch targets (accessibility requirements)
  minTouchTarget: 48,        // 48px minimum - accessibility requirement
  comfortableTouchTarget: 56, // 56px preferred - easier for stressed users
  
  // Layout specific
  bottomTabHeight: 80,   // Extra height for easier access
  headerHeight: 64,      // Standard header height
  keyboardOffset: 16,    // Space above keyboard
};

export type SpacingKey = keyof typeof Spacing;