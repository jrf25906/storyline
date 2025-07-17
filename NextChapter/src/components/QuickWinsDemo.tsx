import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useCelebrationAnimation, useCardPressAnimation } from '../hooks/useAnimations';
import { useToast } from '../contexts/ToastContext';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';

export const QuickWinsDemo: React.FC = () => {
  const { showSuccess, showInfo, showWarning } = useToast();
  
  // Celebration animation for task completion
  const { animate: celebrate, animatedStyle: celebrationStyle } = useCelebrationAnimation({
    onComplete: () => {
      showSuccess('Task completed! Great progress! 🎉');
    },
  });

  // Card press animation for interactive elements
  const { pressIn, pressOut, animatedStyle: cardPressStyle } = useCardPressAnimation();

  const handleTaskComplete = () => {
    celebrate();
  };

  const handleCardPress = () => {
    showInfo('Card pressed with smooth animation!');
  };

  const handleShowToasts = () => {
    // Show different toast variants
    setTimeout(() => showSuccess('Success! You\'re doing great!'), 0);
    setTimeout(() => showInfo('Here\'s some helpful information'), 1000);
    setTimeout(() => showWarning('Just a gentle reminder'), 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Wins Demo</Text>
      
      {/* Task Completion with Celebration */}
      <Animated.View style={[styles.section, celebrationStyle]}>
        <TouchableOpacity
          style={styles.celebrationButton}
          onPress={handleTaskComplete}
        >
          <Text style={styles.buttonText}>Complete Task (Celebrate!)</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Card Press Animation */}
      <Animated.View style={[styles.section, cardPressStyle]}>
        <TouchableOpacity
          style={styles.card}
          onPressIn={pressIn}
          onPressOut={pressOut}
          onPress={handleCardPress}
        >
          <Text style={styles.cardTitle}>Interactive Card</Text>
          <Text style={styles.cardSubtitle}>Press me for smooth feedback</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Toast Notifications */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.toastButton}
          onPress={handleShowToasts}
        >
          <Text style={styles.buttonText}>Show Toast Notifications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  celebrationButton: {
    backgroundColor: Colors.success.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.lg,
    borderRadius: 16,
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
  },
  cardTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  toastButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.body.semiBold,
    color: Colors.text.inverse,
  },
});