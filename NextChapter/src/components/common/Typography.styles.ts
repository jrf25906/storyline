import { StyleSheet } from 'react-native';

// Additional utility styles that can be composed with Typography
export const typographyStyles = StyleSheet.create({
  // Utility classes for common patterns
  truncate: {
    overflow: 'hidden',
  },
  
  // Stress-friendly spacing
  comfortable: {
    marginVertical: 8,
  },
  
  // High contrast support
  highContrast: {
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Link style
  link: {
    textDecorationLine: 'underline',
  },
  
  // Strikethrough
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  
  // Uppercase for buttons
  uppercase: {
    textTransform: 'uppercase',
  },
  
  // Capitalize for titles
  capitalize: {
    textTransform: 'capitalize',
  },
});