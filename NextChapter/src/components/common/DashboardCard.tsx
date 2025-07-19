import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  AccessibilityProps,
  Animated,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Colors, Spacing, Borders, Shadows } from '@theme';
import { Theme } from '@/styles/theme';

interface DashboardCardProps extends AccessibilityProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  children: React.ReactNode;
  testID?: string;
  style?: ViewStyle;
  loading?: boolean;
  variant?: 'default' | 'success' | 'gentle' | 'support';
  elevated?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  onPress,
  children,
  testID,
  style,
  loading = false,
  variant = 'default',
  elevated = false,
  ...accessibilityProps
}) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: Colors.successMint + '10',
          borderColor: Colors.successMint + '30',
          borderWidth: 1,
        };
      case 'gentle':
        return {
          backgroundColor: Colors.gentleCoral + '08',
          borderColor: Colors.gentleCoral + '20',
          borderWidth: 1,
        };
      case 'support':
        return {
          backgroundColor: Colors.calmBlue + '10',
          borderColor: Colors.calmBlue + '30',
          borderWidth: 1,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
        };
    }
  };

  const styles = createStyles(theme, variant, elevated);
  const variantStyles = getVariantStyles();

  const CardContent = () => (
    <View style={[styles.container, variantStyles, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.content}>
        {loading ? (
          <View testID={`${testID}-skeleton-loader`} style={styles.skeleton} />
        ) : (
          children
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          testID={testID}
          activeOpacity={0.95}
          style={styles.touchable}
          {...accessibilityProps}
        >
          <CardContent />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View testID={testID} {...accessibilityProps}>
      <CardContent />
    </View>
  );
};

const createStyles = (theme: Theme, variant: string = 'default', elevated: boolean = false) =>
  StyleSheet.create({
    touchable: {
      minHeight: 56, // Comfortable touch target for stressed users
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: Borders.radius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      ...(elevated ? Shadows.shadow3 : Shadows.shadow1),
    },
    header: {
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: theme.typography.sizes.h4 || 18,
      fontWeight: theme.typography.weights.semibold || '600',
      color: theme.colors.text,
      marginBottom: Spacing.xs,
      lineHeight: 24, // Better readability for stressed users
    },
    subtitle: {
      fontSize: theme.typography.sizes.bodySmall || 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    content: {
      minHeight: 60,
    },
    skeleton: {
      height: 60,
      backgroundColor: theme.colors.border,
      borderRadius: Borders.radius.md,
      opacity: 0.3,
    },
  });