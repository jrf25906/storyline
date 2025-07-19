import React, { useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  Pressable, 
  Animated,
  Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@context/ThemeContext';
import { Colors, Spacing, Borders, Shadows } from '@theme';
import { createStyles } from '@components/common/Card.styles';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing | number;
  shadow?: boolean;
  variant?: 'task' | 'progress' | 'elevated' | 'outlined' | 'filled';
  onPress?: () => void;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  header?: React.ReactNode;
  hoverable?: boolean;
  animatePress?: boolean;
}

export default function Card({
  children,
  style,
  padding,
  shadow = true,
  variant = 'elevated',
  onPress,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  header,
  hoverable = false,
  animatePress = true,
}: CardProps) {
  const { theme } = useTheme();
  const isDark = theme.colors.background === Colors.dark.background;
  const styles = createStyles(isDark);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  // Get variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    const baseStyles = styles[variant as keyof typeof styles] as ViewStyle;
    
    // Handle padding override
    let finalPadding = baseStyles.padding;
    if (padding !== undefined) {
      finalPadding = typeof padding === 'string' 
        ? Spacing[padding as keyof typeof Spacing] 
        : padding;
    }
    
    // Remove shadow if shadow prop is false
    if (!shadow && variant !== 'outlined') {
      const { shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation, ...rest } = baseStyles;
      return { ...rest, padding: finalPadding };
    }
    
    return { ...baseStyles, padding: finalPadding };
  };

  // Handle press animations
  const handlePressIn = () => {
    if (animatePress && onPress) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.98,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnim, {
          toValue: -0.5,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (animatePress && onPress) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  // Handle hover animations (for web)
  const handleMouseEnter = () => {
    if (hoverable && Platform.OS === 'web') {
      Animated.parallel([
        Animated.timing(translateYAnim, {
          toValue: -2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handleMouseLeave = () => {
    if (hoverable && Platform.OS === 'web') {
      Animated.parallel([
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(shadowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  // Get animated shadow styles
  const getAnimatedShadowStyles = () => {
    if (!shadow || variant === 'outlined' || variant === 'filled') {
      return {};
    }

    const baseShadow = variant === 'task' || variant === 'elevated' 
      ? Shadows.card 
      : {};

    return {
      shadowOpacity: shadowAnim.interpolate({
        inputRange: [-0.5, 0, 1],
        outputRange: [
          baseShadow.shadowOpacity * 0.5,
          baseShadow.shadowOpacity,
          Shadows.cardHover.shadowOpacity,
        ],
      }),
      shadowRadius: shadowAnim.interpolate({
        inputRange: [-0.5, 0, 1],
        outputRange: [
          baseShadow.shadowRadius * 0.5,
          baseShadow.shadowRadius,
          Shadows.cardHover.shadowRadius,
        ],
      }),
      elevation: shadowAnim.interpolate({
        inputRange: [-0.5, 0, 1],
        outputRange: [
          baseShadow.elevation * 0.5,
          baseShadow.elevation,
          Shadows.cardHover.elevation,
        ],
      }),
    };
  };

  const cardContent = (
    <>
      {header && <View style={styles.header}>{header}</View>}
      {children}
    </>
  );

  const animatedCardStyle = [
    styles.card,
    getVariantStyles(),
    getAnimatedShadowStyles(),
    {
      transform: [
        { scale: scaleAnim },
        { translateY: translateYAnim },
      ],
    },
    style,
  ];

  // Render progress variant with gradient
  if (variant === 'progress') {
    const gradientCard = (
      <LinearGradient
        colors={[Colors.successMint, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.progress, { padding: getVariantStyles().padding }, style]}
        testID={testID}
      >
        {cardContent}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessible={accessible}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={({ pressed }) => [
            animatePress && pressed && styles.pressed,
          ]}
        >
          {gradientCard}
        </Pressable>
      );
    }

    return gradientCard;
  }

  // Regular card with optional press handler
  const regularCard = (
    <Animated.View
      testID={testID}
      style={animatedCardStyle}
      accessible={!onPress && accessible}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {cardContent}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={accessible}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {regularCard}
      </Pressable>
    );
  }

  return regularCard;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.95,
  },
});