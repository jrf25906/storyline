import { StyleSheet } from 'react-native';
import { Colors, Spacing, Borders, Shadows } from '../../theme';

export const createStyles = (isDark: boolean) => {
  const colors = isDark ? Colors.dark : Colors;
  
  return StyleSheet.create({
    card: {
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    
    // Base styles for each variant
    task: {
      backgroundColor: colors.surface,
      borderRadius: Borders.radius.lg, // 16px
      padding: Spacing.lg, // 24px
      borderWidth: Borders.width.thin,
      borderColor: colors.border,
      ...Shadows.card,
    },
    
    progress: {
      borderRadius: Borders.radius.lg,
      padding: Spacing.lg,
      overflow: 'hidden',
      // Gradient will be handled by LinearGradient component
    },
    
    elevated: {
      backgroundColor: colors.surface,
      borderRadius: Borders.radius.lg,
      padding: Spacing.cardPadding,
      ...Shadows.card,
    },
    
    outlined: {
      backgroundColor: colors.surface,
      borderRadius: Borders.radius.lg,
      padding: Spacing.cardPadding,
      borderWidth: Borders.width.thin,
      borderColor: colors.border,
    },
    
    filled: {
      backgroundColor: isDark ? colors.surfaceVariant : Colors.neutral[50],
      borderRadius: Borders.radius.lg,
      padding: Spacing.cardPadding,
    },
    
    // Hover state styles
    taskHover: {
      ...Shadows.cardHover,
      transform: [{ translateY: -2 }],
    },
    
    elevatedHover: {
      ...Shadows.cardHover,
      transform: [{ translateY: -2 }],
    },
    
    // Press states
    pressed: {
      opacity: 0.95,
      transform: [{ scale: 0.98 }],
    },
    
    // Header styles
    header: {
      marginBottom: Spacing.md,
    },
    
    // Content wrapper for progress variant gradient
    progressGradient: {
      flex: 1,
    },
    
    // Transition styles for smooth animations
    transition: {
      // React Native doesn't support CSS transitions directly
      // Animation will be handled via Animated API
    },
  });
};

// Export default light theme styles for backward compatibility
export default createStyles(false);