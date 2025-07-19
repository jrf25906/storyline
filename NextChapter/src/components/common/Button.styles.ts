import { StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Borders, Shadows } from '@theme';

export const createButtonStyles = (isDark: boolean) => {
  return StyleSheet.create({
    // Base styles
    base: {
      borderRadius: Borders.radius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    },
    
    // Variant styles
    primary: {
      backgroundColor: Colors.primary,
      ...Shadows.button,
    },
    
    primaryDisabled: {
      backgroundColor: Colors.muted,
      ...Shadows.button,
    },
    
    secondary: {
      backgroundColor: Colors.transparent,
      borderWidth: Borders.width.medium,
      borderColor: Colors.primary,
    },
    
    secondaryDisabled: {
      backgroundColor: Colors.transparent,
      borderWidth: Borders.width.medium,
      borderColor: Colors.muted,
    },
    
    support: {
      backgroundColor: Colors.calmBlue,
      borderRadius: Borders.radius.xl, // 24px for pill shape
      ...Shadows.button,
    },
    
    supportDisabled: {
      backgroundColor: Colors.muted,
      borderRadius: Borders.radius.xl,
      ...Shadows.button,
    },
    
    ghost: {
      backgroundColor: Colors.transparent,
    },
    
    // Size styles
    smallButton: {
      minHeight: 56,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    
    mediumButton: {
      minHeight: 56,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    
    largeButton: {
      minHeight: 56,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
    },
    
    // Text styles
    text: {
      fontWeight: Typography.fontWeights.semiBold as any,
      textAlign: 'center' as const,
    },
    
    smallText: {
      fontSize: Typography.fontSizes.bodySM,
    },
    
    mediumText: {
      fontSize: Typography.fontSizes.body,
    },
    
    largeText: {
      fontSize: Typography.fontSizes.bodyLG,
    },
    
    primaryText: {
      color: Colors.white,
    },
    
    secondaryText: {
      color: isDark ? Colors.dark.textPrimary : Colors.primary,
    },
    
    supportText: {
      color: Colors.white,
    },
    
    ghostText: {
      color: isDark ? Colors.dark.textPrimary : Colors.primary,
    },
    
    disabledText: {
      color: Colors.white,
    },
    
    disabledSecondaryText: {
      color: Colors.muted,
    },
    
    // State styles
    fullWidth: {
      width: '100%',
    },
    
    disabled: {
      opacity: 0.5,
    },
    
    // Loading indicator
    loadingIndicator: {
      marginHorizontal: 0,
    },
  });
};

// Export default styles for light mode
export const buttonStyles = createButtonStyles(false);