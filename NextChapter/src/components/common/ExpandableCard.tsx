import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useCardPressAnimation } from '../../hooks/useAnimations';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ExpandableCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'info';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onToggle?: (expanded: boolean) => void;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  subtitle,
  children,
  initiallyExpanded = false,
  disabled = false,
  variant = 'default',
  accessibilityLabel,
  accessibilityHint,
  onToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const rotateAnim = useRef(new Animated.Value(initiallyExpanded ? 1 : 0)).current;
  
  const { pressIn, pressOut, animatedStyle: pressStyle } = useCardPressAnimation();

  const handleToggle = () => {
    if (disabled) return;

    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);

    // Animate chevron rotation
    Animated.timing(rotateAnim, {
      toValue: newExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Animate layout change
    LayoutAnimation.configureNext({
      duration: 200,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  };

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          borderColor: Colors.success.light,
          backgroundColor: Colors.success.light + '10',
        };
      case 'warning':
        return {
          borderColor: Colors.warning.light,
          backgroundColor: Colors.warning.light + '10',
        };
      case 'info':
        return {
          borderColor: Colors.primary.light,
          backgroundColor: Colors.primary.light + '10',
        };
      default:
        return {
          borderColor: Colors.border.light,
          backgroundColor: Colors.background.secondary,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.card,
        pressStyle,
        {
          borderColor: variantStyles.borderColor,
          backgroundColor: variantStyles.backgroundColor,
        },
        disabled && styles.cardDisabled,
      ]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded, disabled }}
        accessibilityLabel={accessibilityLabel || `${title}. ${isExpanded ? 'Expanded' : 'Collapsed'}`}
        accessibilityHint={accessibilityHint || `Double tap to ${isExpanded ? 'collapse' : 'expand'}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                disabled && styles.titleDisabled,
              ]}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  disabled && styles.subtitleDisabled,
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>
          
          <Animated.View
            style={[
              styles.chevronContainer,
              { transform: [{ rotate: chevronRotation }] },
            ]}
          >
            <Text style={[styles.chevron, disabled && styles.chevronDisabled]}>
              ▼
            </Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: Spacing.xs,
    shadowColor: Colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  header: {
    padding: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  titleDisabled: {
    color: Colors.text.disabled,
  },
  subtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  subtitleDisabled: {
    color: Colors.text.disabled,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  chevronDisabled: {
    color: Colors.text.disabled,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
});