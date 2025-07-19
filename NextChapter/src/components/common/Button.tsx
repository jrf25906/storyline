import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { Colors, Spacing, Typography, Borders, Shadows, Motion } from '@theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'support';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string; // Ionicons name
  iconPosition?: 'left' | 'right';
  loadingText?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loadingText,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID
}: ButtonProps) {
  const { theme } = useTheme();
  const isDark = theme.colors.background === Colors.dark.background;

  const getVariantStyles = (): ViewStyle => {
    const baseVariantStyle: ViewStyle = {};
    
    // Map outline to secondary for backward compatibility
    const mappedVariant = variant === 'outline' ? 'secondary' : variant;
    
    switch (mappedVariant) {
      case 'primary':
        return {
          backgroundColor: disabled ? Colors.muted : Colors.primary,
          ...Shadows.button,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.transparent,
          borderWidth: Borders.width.medium,
          borderColor: disabled ? Colors.muted : Colors.primary,
        };
      case 'support':
        return {
          backgroundColor: disabled ? Colors.muted : Colors.calmBlue,
          borderRadius: Borders.radius.xl, // 24px for pill shape
          ...Shadows.button,
        };
      case 'ghost':
        return {
          backgroundColor: Colors.transparent,
        };
      default:
        return baseVariantStyle;
    }
  };

  const getTextColor = (): string => {
    if (disabled) {
      return (variant === 'secondary' || variant === 'outline' || variant === 'ghost')
        ? Colors.muted 
        : Colors.white;
    }
    
    // Map outline to secondary for backward compatibility
    const mappedVariant = variant === 'outline' ? 'secondary' : variant;
    
    switch (mappedVariant) {
      case 'primary':
      case 'support':
        return Colors.white;
      case 'secondary':
      case 'ghost':
        return isDark ? Colors.dark.textPrimary : Colors.primary;
      default:
        return Colors.white;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          button: {
            minHeight: 56, // Comfortable touch target
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs,
          },
          text: {
            fontSize: Typography.fontSizes.bodySM,
          },
        };
      case 'large':
        return {
          button: {
            minHeight: 56, // Comfortable touch target
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing.sm,
          },
          text: {
            fontSize: Typography.fontSizes.bodyLG,
          },
        };
      case 'medium':
      default:
        return {
          button: {
            minHeight: 56, // Comfortable touch target
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
          },
          text: {
            fontSize: Typography.fontSizes.body,
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const variantStyles = getVariantStyles();
  const buttonStyles: ViewStyle[] = [
    styles.base,
    variantStyles,
    sizeStyles.button,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    sizeStyles.text,
    { color: getTextColor() },
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContent}>
          <ActivityIndicator 
            size="small"
            color={getTextColor()} 
            accessibilityLabel="Loading" 
          />
          {loadingText && (
            <Text style={[textStyles, { marginLeft: Spacing.xs }]}>
              {loadingText}
            </Text>
          )}
        </View>
      );
    }

    const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
    const iconColor = getTextColor();

    return (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <Ionicons 
            name={icon as any} 
            size={iconSize} 
            color={iconColor} 
            style={{ marginRight: Spacing.xs }} 
          />
        )}
        <Text style={textStyles}>{title}</Text>
        {icon && iconPosition === 'right' && (
          <Ionicons 
            name={icon as any} 
            size={iconSize} 
            color={iconColor} 
            style={{ marginLeft: Spacing.xs }} 
          />
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ 
        disabled: disabled || loading,
        busy: loading
      }}
      testID={testID}
      activeOpacity={variant === 'ghost' ? 0.7 : 0.85}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Borders.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    // Add transition for smooth interactions
    transition: 'all 200ms cubic-bezier(0.2, 0, 0.2, 1)',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: Typography.fontWeights.semiBold,
    textAlign: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});