/**
 * Color contrast utilities for accessibility
 * Ensures WCAG 2.1 AA compliance
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a ratio between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    console.warn('Invalid color format. Use hex colors like #FFFFFF');
    return 0;
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG standards
 */
export function meetsWCAGStandard(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  fontSize: number = 16,
  isBold: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  // Large text: 18pt (24px) or 14pt (18.66px) bold
  const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);
  
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  } else {
    // AAA level
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
}

/**
 * Get a contrasting text color (black or white) for a given background
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Suggest accessible color alternatives
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const currentRatio = getContrastRatio(foreground, background);
  
  if (currentRatio >= targetRatio) {
    return foreground; // Already accessible
  }

  const rgb = hexToRgb(foreground);
  if (!rgb) return foreground;

  // Determine if we need to make the color lighter or darker
  const bgRgb = hexToRgb(background);
  if (!bgRgb) return foreground;

  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const needsLightening = bgLuminance < 0.5;

  let { r, g, b } = rgb;
  let attempts = 0;
  const maxAttempts = 100;

  while (getContrastRatio(rgbToHex(r, g, b), background) < targetRatio && attempts < maxAttempts) {
    if (needsLightening) {
      r = Math.min(255, r + 5);
      g = Math.min(255, g + 5);
      b = Math.min(255, b + 5);
    } else {
      r = Math.max(0, r - 5);
      g = Math.max(0, g - 5);
      b = Math.max(0, b - 5);
    }
    attempts++;
  }

  return rgbToHex(r, g, b);
}

/**
 * Convert RGB values to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * React hook for color contrast checking
 */
import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ContrastCheckResult {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  suggestion?: string;
}

export function useColorContrast(
  foreground: string,
  background?: string,
  fontSize: number = 16,
  isBold: boolean = false
): ContrastCheckResult {
  const { theme } = useTheme();
  const bg = background || theme.colors.background;

  return useMemo(() => {
    const ratio = getContrastRatio(foreground, bg);
    const meetsAA = meetsWCAGStandard(foreground, bg, 'AA', fontSize, isBold);
    const meetsAAA = meetsWCAGStandard(foreground, bg, 'AAA', fontSize, isBold);
    
    const result: ContrastCheckResult = {
      ratio,
      meetsAA,
      meetsAAA,
    };

    if (!meetsAA) {
      result.suggestion = suggestAccessibleColor(foreground, bg);
    }

    return result;
  }, [foreground, bg, fontSize, isBold]);
}

/**
 * Development tool: Log contrast ratios for all color combinations
 */
export function auditColorContrast(colors: Record<string, string>) {
  const results: Array<{
    foreground: string;
    background: string;
    ratio: number;
    passes: boolean;
  }> = [];

  const colorKeys = Object.keys(colors);
  
  // Check text colors against backgrounds
  const textColors = colorKeys.filter(key => 
    key.includes('text') || key.includes('Text')
  );
  const backgroundColors = colorKeys.filter(key => 
    key.includes('background') || key.includes('surface') || key === 'white'
  );

  textColors.forEach(textKey => {
    backgroundColors.forEach(bgKey => {
      const ratio = getContrastRatio(colors[textKey], colors[bgKey]);
      const passes = ratio >= 4.5; // AA standard for normal text
      
      results.push({
        foreground: `${textKey} (${colors[textKey]})`,
        background: `${bgKey} (${colors[bgKey]})`,
        ratio: Math.round(ratio * 10) / 10,
        passes,
      });
    });
  });

  // Log results
  console.table(results);
  
  const failures = results.filter(r => !r.passes);
  if (failures.length > 0) {
    console.warn(`⚠️ ${failures.length} color combinations fail WCAG AA standards`);
  } else {
    console.log('✅ All color combinations pass WCAG AA standards');
  }

  return results;
}