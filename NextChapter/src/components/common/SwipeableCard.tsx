import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { useCardPressAnimation } from '@hooks/useAnimations';
import { Colors } from '@theme/colors';
import { Typography } from '@theme/typography';
import { Spacing } from '@theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export interface SwipeAction {
  id: string;
  label: string;
  icon?: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

export interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  
  const { pressIn, pressOut, animatedStyle: pressStyle } = useCardPressAnimation();

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && !disabled && (leftActions.length > 0 || rightActions.length > 0);
    },
    onPanResponderGrant: () => {
      setIsSwipeActive(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      translateX.setValue(gestureState.dx);
    },
    onPanResponderRelease: (evt, gestureState) => {
      setIsSwipeActive(false);
      
      const shouldTriggerAction = Math.abs(gestureState.dx) > SWIPE_THRESHOLD || Math.abs(gestureState.vx) > 0.5;
      
      if (shouldTriggerAction) {
        if (gestureState.dx > 0 && leftActions.length > 0) {
          // Swipe right - trigger first left action
          leftActions[0].onPress();
        } else if (gestureState.dx < 0 && rightActions.length > 0) {
          // Swipe left - trigger first right action
          rightActions[0].onPress();
        }
      }

      // Reset position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    },
  });

  const handlePress = () => {
    if (disabled || isSwipeActive) return;
    onPress?.();
  };

  return (
    <View style={styles.container}>
      {/* Left Actions Background */}
      {leftActions.length > 0 && (
        <View style={[styles.actionsContainer, styles.leftActions]}>
          {leftActions.map((action) => (
            <View
              key={action.id}
              style={[
                styles.actionButton,
                { backgroundColor: action.backgroundColor },
              ]}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionLabel, { color: action.color }]}>
                {action.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Right Actions Background */}
      {rightActions.length > 0 && (
        <View style={[styles.actionsContainer, styles.rightActions]}>
          {rightActions.map((action) => (
            <View
              key={action.id}
              style={[
                styles.actionButton,
                { backgroundColor: action.backgroundColor },
              ]}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionLabel, { color: action.color }]}>
                {action.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Main Card */}
      <Animated.View
        style={[
          styles.card,
          pressStyle,
          {
            transform: [{ translateX }],
          },
          disabled && styles.cardDisabled,
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={handlePress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={disabled}
          accessible
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityActions={[
            ...(leftActions.map(action => ({
              name: action.id,
              label: action.label,
            }))),
            ...(rightActions.map(action => ({
              name: action.id,
              label: action.label,
            }))),
          ]}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  leftActions: {
    left: 0,
    paddingLeft: Spacing.md,
  },
  rightActions: {
    right: 0,
    paddingRight: Spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginHorizontal: Spacing.xs,
    minWidth: 60,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    ...Typography.body.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 2,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardContent: {
    padding: Spacing.lg,
  },
});