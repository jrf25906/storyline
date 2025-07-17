import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography, Motion } from '../../theme';

interface CalmingLoadingIndicatorProps {
  message?: string;
  messages?: string[]; // For multi-step processes
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  showTip?: boolean;
  tipDelay?: number;
  style?: ViewStyle;
  testID?: string;
}

const LOADING_TIPS = [
  "Did you know? Taking breaks can boost productivity by 40%",
  "Remember: Progress isn't always linear, and that's okay",
  "You're doing great. Every step forward counts",
  "Fun fact: The average job search takes 3-6 months. You've got this!",
  "Tip: Celebrate small wins - they add up to big changes",
];

export const CalmingLoadingIndicator: React.FC<CalmingLoadingIndicatorProps> = ({
  message = "Taking a moment...",
  messages,
  size = 'medium',
  fullScreen = false,
  showTip = false,
  tipDelay = 3000,
  style,
  testID = 'calming-loading-indicator',
}) => {
  const { theme } = useTheme();
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tipFadeAnim = useRef(new Animated.Value(0)).current;
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showLoadingTip, setShowLoadingTip] = useState(false);
  const [currentTip] = useState(
    LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]
  );

  // Get current message
  const currentMessage = messages ? messages[currentMessageIndex] : message;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: Motion.duration.normal,
      useNativeDriver: true,
    }).start();

    // Breathing animation for the loading indicator
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    breathingAnimation.start();

    // Show tip after delay
    let tipTimer: NodeJS.Timeout;
    if (showTip) {
      tipTimer = setTimeout(() => {
        setShowLoadingTip(true);
        Animated.timing(tipFadeAnim, {
          toValue: 1,
          duration: Motion.duration.normal,
          useNativeDriver: true,
        }).start();
      }, tipDelay);
    }

    return () => {
      breathingAnimation.stop();
      if (tipTimer) clearTimeout(tipTimer);
    };
  }, [breathingAnim, fadeAnim, tipFadeAnim, showTip, tipDelay]);

  useEffect(() => {
    // Cycle through messages if provided
    if (messages && messages.length > 1) {
      const messageTimer = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      }, 4000);

      return () => clearInterval(messageTimer);
    }
  }, [messages]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { indicatorSize: 'small' as const, spacing: Spacing.sm };
      case 'large':
        return { indicatorSize: 'large' as const, spacing: Spacing.lg };
      default:
        return { indicatorSize: 'large' as const, spacing: Spacing.md };
    }
  };

  const { indicatorSize, spacing } = getSizeConfig();

  const containerStyle: ViewStyle[] = [
    styles.container,
    fullScreen && styles.fullScreen,
    { padding: spacing },
    style,
  ];

  return (
    <Animated.View
      style={[containerStyle, { opacity: fadeAnim }]}
      testID={testID}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={currentMessage}
      accessibilityState={{ busy: true }}
    >
      <Animated.View
        testID="breathing-animation"
        style={{
          transform: [{ scale: breathingAnim }],
        }}
      >
        <View style={[styles.indicatorContainer, { padding: spacing }]}>
          <ActivityIndicator
            size={indicatorSize}
            color={theme.colors.primary}
            style={styles.indicator}
          />
          {/* Calming circle background */}
          <View
            style={[
              styles.calmingCircle,
              {
                backgroundColor: theme.colors.calmBlue + '20',
                borderColor: theme.colors.calmBlue + '40',
              },
            ]}
          />
        </View>
      </Animated.View>

      <Text
        style={[
          styles.message,
          {
            color: theme.colors.textPrimary,
            marginTop: spacing,
          },
        ]}
        accessible={true}
        accessibilityRole="text"
      >
        {currentMessage}
      </Text>

      {showLoadingTip && showTip && (
        <Animated.View
          style={[styles.tipContainer, { opacity: tipFadeAnim }]}
        >
          <Text
            style={[
              styles.tipText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {currentTip}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background + 'F0',
    borderRadius: 16,
    minHeight: 120,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  indicatorContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    zIndex: 2,
  },
  calmingCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    zIndex: 1,
  },
  message: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  tipContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    maxWidth: 300,
  },
  tipText: {
    fontSize: Typography.fontSizes.bodySM,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: Typography.lineHeights.relaxed,
  },
});