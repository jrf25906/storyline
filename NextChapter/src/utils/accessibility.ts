/**
 * Accessibility utilities for NextChapter app
 * Ensures WCAG 2.1 AA compliance
 */

/**
 * Calculate relative luminance of a color
 * @param hex - Hex color code (e.g., '#FFFFFF')
 * @returns Relative luminance value between 0 and 1
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 * @param hex - Hex color code
 * @returns RGB values array or null if invalid
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ]
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 - First hex color
 * @param color2 - Second hex color
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const bright = Math.max(lum1, lum2);
  const dark = Math.min(lum1, lum2);
  
  return (bright + 0.05) / (dark + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio - Contrast ratio
 * @param largeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether contrast meets AA standards
 */
export function meetsWCAGAA(ratio: number, largeText: boolean = false): boolean {
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 * @param ratio - Contrast ratio
 * @param largeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether contrast meets AAA standards
 */
export function meetsWCAGAAA(ratio: number, largeText: boolean = false): boolean {
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get accessible color recommendation
 * @param foreground - Foreground color hex
 * @param background - Background color hex
 * @param largeText - Whether text is large
 * @returns Object with contrast info and recommendations
 */
export function getAccessibleColorRecommendation(
  foreground: string,
  background: string,
  largeText: boolean = false
): {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  recommendation?: string;
} {
  const ratio = getContrastRatio(foreground, background);
  const meetsAA = meetsWCAGAA(ratio, largeText);
  const meetsAAA = meetsWCAGAAA(ratio, largeText);

  let recommendation;
  if (!meetsAA) {
    const requiredRatio = largeText ? 3 : 4.5;
    recommendation = `Contrast ratio ${ratio.toFixed(2)}:1 fails WCAG AA (requires ${requiredRatio}:1). Consider darkening the foreground or lightening the background.`;
  }

  return {
    ratio,
    meetsAA,
    meetsAAA,
    recommendation,
  };
}

/**
 * Minimum touch target size in density-independent pixels (dp)
 * WCAG 2.5.5 requires 44x44 CSS pixels, we use 48 for better usability
 */
export const MINIMUM_TOUCH_TARGET_SIZE = 48;

/**
 * Check if a size meets minimum touch target requirements
 * @param width - Width in dp
 * @param height - Height in dp
 * @returns Whether size meets minimum requirements
 */
export function meetsTouchTargetSize(width: number, height: number): boolean {
  return width >= MINIMUM_TOUCH_TARGET_SIZE && height >= MINIMUM_TOUCH_TARGET_SIZE;
}

/**
 * Get appropriate focus indicator styles
 * @param color - Primary color for focus
 * @returns Style object for focus indicators
 */
export function getFocusIndicatorStyle(color: string) {
  return {
    borderWidth: 3,
    borderColor: color,
    borderStyle: 'solid' as const,
    outline: 'none',
  };
}

/**
 * Format time for screen readers
 * @param date - Date object
 * @returns Formatted time string
 */
export function formatTimeForScreenReader(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get appropriate haptic feedback type based on action
 * @param action - Type of action being performed
 * @returns Haptic feedback type
 */
export function getHapticFeedbackType(
  action: 'success' | 'warning' | 'error' | 'selection' | 'impact'
): 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' {
  switch (action) {
    case 'success':
      return 'light';
    case 'warning':
      return 'medium';
    case 'error':
      return 'heavy';
    case 'selection':
      return 'light';
    case 'impact':
      return 'rigid';
    default:
      return 'light';
  }
}

/**
 * Crisis resource phone numbers for easy access
 */
export const CRISIS_RESOURCES = {
  suicideHotline: {
    number: '988',
    text: '988 Suicide & Crisis Lifeline',
    url: 'tel:988',
  },
  crisisTextLine: {
    number: '741741',
    text: 'Text "HELLO" to 741741',
    url: 'sms:741741&body=HELLO',
  },
  emergency: {
    number: '911',
    text: 'Emergency Services',
    url: 'tel:911',
  },
} as const;

/**
 * Generate accessible name for interactive elements
 * @param role - Element role
 * @param label - Primary label
 * @param state - Current state
 * @returns Accessible name
 */
export function generateAccessibleName(
  role: string,
  label: string,
  state?: { disabled?: boolean; selected?: boolean; checked?: boolean }
): string {
  let name = label;
  
  if (state?.disabled) {
    name += ', disabled';
  }
  if (state?.selected) {
    name += ', selected';
  }
  if (state?.checked !== undefined) {
    name += state.checked ? ', checked' : ', not checked';
  }
  
  return name;
}

/**
 * High contrast color adjustments
 * @param color - Original color
 * @param highContrastMode - Whether high contrast is enabled
 * @returns Adjusted color
 */
export function adjustColorForHighContrast(
  color: string,
  highContrastMode: boolean
): string {
  if (!highContrastMode) return color;
  
  // In high contrast mode, use pure black or white
  const luminance = getLuminance(color);
  return luminance > 0.5 ? '#FFFFFF' : '#000000';
}