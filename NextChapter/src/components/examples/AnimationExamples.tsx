import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import {
  useSlideInAnimation,
  useFadeInAnimation,
  useTaskCompleteAnimation,
  useCardPressAnimation,
  useProgressAnimation,
  useCelebrationAnimation,
  useSequenceAnimation,
} from '@hooks/useAnimations';
import { Colors } from '@theme/colors';
import { Typography } from '@theme/typography';
import { Spacing } from '@theme/spacing';
import { Motion } from '@theme/animations';

/**
 * Bounce Plan Task Card with animations
 * Demonstrates press feedback and completion animation
 */
export const AnimatedTaskCard: React.FC<{
  task: { id: string; title: string; description: string };
  onComplete: (taskId: string) => void;
}> = ({ task, onComplete }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const pressAnimation = useCardPressAnimation();
  const completeAnimation = useTaskCompleteAnimation({
    originalColor: Colors.light.background.card,
    completedColor: Colors.light.success.mint,
  });
  const checkmarkFade = useFadeInAnimation({ duration: Motion.duration.fast });

  const handlePress = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      completeAnimation.animate(() => {
        checkmarkFade.animate();
        onComplete(task.id);
      });
    }
  };

  return (
    <TouchableOpacity
      onPressIn={pressAnimation.pressIn}
      onPressOut={pressAnimation.pressOut}
      onPress={handlePress}
      activeOpacity={1}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
      accessibilityState={{ checked: isCompleted }}
    >
      <Animated.View
        style={[
          styles.taskCard,
          pressAnimation.animatedStyle,
          completeAnimation.animatedStyle,
          completeAnimation.animatedColorStyle,
        ]}
      >
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, isCompleted && styles.completedText]}>
            {task.title}
          </Text>
          <Text style={[styles.taskDescription, isCompleted && styles.completedText]}>
            {task.description}
          </Text>
        </View>
        {isCompleted && (
          <Animated.View style={[styles.checkmark, checkmarkFade.animatedStyle]}>
            <Text style={styles.checkmarkText}>✓</Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Daily Progress Ring
 * Shows animated progress for daily tasks
 */
export const AnimatedProgressRing: React.FC<{
  progress: number; // 0-1
  size?: number;
}> = ({ progress, size = 120 }) => {
  const animatedProgress = useProgressAnimation(progress, {
    duration: Motion.duration.slow,
  });
  
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={{
          transform: [{
            rotate: animatedProgress.progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          }],
        }}
      >
        {/* SVG implementation would go here */}
        {/* For demo, using a simple view */}
        <View
          style={[
            styles.progressRing,
            { width: size, height: size, borderWidth: strokeWidth },
          ]}
        />
      </Animated.View>
      <View style={styles.progressTextContainer}>
        <Animated.Text style={styles.progressText}>
          {animatedProgress.progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          })}
        </Animated.Text>
      </View>
    </View>
  );
};

/**
 * Mood Check-in Card
 * Slides in gently when appearing
 */
export const AnimatedMoodCard: React.FC<{
  onMoodSelect: (mood: string) => void;
}> = ({ onMoodSelect }) => {
  const slideIn = useSlideInAnimation({
    duration: Motion.duration.slow,
    delay: 100,
  });
  const buttonAnimations = [
    useSlideInAnimation({ delay: 200 }),
    useSlideInAnimation({ delay: 250 }),
    useSlideInAnimation({ delay: 300 }),
    useSlideInAnimation({ delay: 350 }),
  ];

  useEffect(() => {
    slideIn.animate();
    buttonAnimations.forEach(anim => anim.animate());
  }, []);

  const moods = [
    { emoji: '😊', label: 'Great' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😔', label: 'Struggling' },
    { emoji: '😰', label: 'Anxious' },
  ];

  return (
    <Animated.View style={[styles.moodCard, slideIn.animatedStyle]}>
      <Text style={styles.moodTitle}>How are you feeling today?</Text>
      <View style={styles.moodButtons}>
        {moods.map((mood, index) => (
          <Animated.View
            key={mood.label}
            style={buttonAnimations[index].animatedStyle}
          >
            <TouchableOpacity
              style={styles.moodButton}
              onPress={() => onMoodSelect(mood.label)}
              accessible
              accessibilityLabel={`Feeling ${mood.label}`}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

/**
 * Achievement Celebration
 * Shows when user completes a milestone
 */
export const AnimatedAchievement: React.FC<{
  title: string;
  description: string;
  onDismiss: () => void;
}> = ({ title, description, onDismiss }) => {
  const celebration = useCelebrationAnimation();
  const fadeIn = useFadeInAnimation({ delay: 200 });
  const slideIn = useSlideInAnimation({ delay: 400 });

  useEffect(() => {
    celebration.animate();
    fadeIn.animate();
    slideIn.animate();
  }, []);

  return (
    <View style={styles.achievementContainer}>
      <Animated.View style={celebration.animatedStyle}>
        <Text style={styles.achievementEmoji}>🎉</Text>
      </Animated.View>
      <Animated.Text style={[styles.achievementTitle, fadeIn.animatedStyle]}>
        {title}
      </Animated.Text>
      <Animated.Text style={[styles.achievementDescription, slideIn.animatedStyle]}>
        {description}
      </Animated.Text>
      <Animated.View style={slideIn.animatedStyle}>
        <TouchableOpacity style={styles.achievementButton} onPress={onDismiss}>
          <Text style={styles.achievementButtonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

/**
 * Job Application Status Card
 * Animates status changes
 */
export const AnimatedStatusCard: React.FC<{
  application: {
    company: string;
    position: string;
    status: 'applied' | 'interviewing' | 'offer' | 'rejected';
  };
}> = ({ application }) => {
  const cardAnimation = useCardPressAnimation();
  const statusAnimation = useFadeInAnimation();
  
  const statusColors = {
    applied: Colors.light.primary.teal,
    interviewing: Colors.light.accent.coral,
    offer: Colors.light.success.mint,
    rejected: Colors.light.neutral.gray[400],
  };

  return (
    <TouchableOpacity
      onPressIn={cardAnimation.pressIn}
      onPressOut={cardAnimation.pressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.statusCard, cardAnimation.animatedStyle]}>
        <View>
          <Text style={styles.companyName}>{application.company}</Text>
          <Text style={styles.positionName}>{application.position}</Text>
        </View>
        <Animated.View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[application.status] },
            statusAnimation.animatedStyle,
          ]}
        >
          <Text style={styles.statusText}>{application.status}</Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Loading skeleton with fade animation
 * Shows while content is loading
 */
export const AnimatedSkeleton: React.FC<{
  width?: number | string;
  height?: number;
}> = ({ width = '100%', height = 20 }) => {
  const fadeAnimation = useFadeInAnimation({ duration: 1000 });
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const animate = () => {
      fadeAnimation.animate(() => {
        fadeAnimation.fadeOut();
        setTimeout(() => {
          if (isAnimating) {
            fadeAnimation.reset();
            animate();
          }
        }, 200);
      });
    };
    animate();
  }, [isAnimating]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height },
        fadeAnimation.animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  // Task Card Styles
  taskCard: {
    backgroundColor: Colors.light.background.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    ...Typography.body.large,
    color: Colors.light.text.primary,
    marginBottom: 4,
  },
  taskDescription: {
    ...Typography.body.medium,
    color: Colors.light.text.secondary,
  },
  completedText: {
    color: Colors.light.text.tertiary,
    textDecorationLine: 'line-through',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.success.mint,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  checkmarkText: {
    color: Colors.light.background.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Progress Ring Styles
  progressRing: {
    borderRadius: 60,
    borderColor: Colors.light.primary.teal,
    position: 'absolute',
  },
  progressTextContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    ...Typography.heading.h3,
    color: Colors.light.primary.teal,
  },

  // Mood Card Styles
  moodCard: {
    backgroundColor: Colors.light.background.card,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  moodTitle: {
    ...Typography.heading.h3,
    color: Colors.light.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodButton: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  moodLabel: {
    ...Typography.body.small,
    color: Colors.light.text.secondary,
  },

  // Achievement Styles
  achievementContainer: {
    backgroundColor: Colors.light.background.card,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    margin: Spacing.lg,
  },
  achievementEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  achievementTitle: {
    ...Typography.heading.h2,
    color: Colors.light.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  achievementDescription: {
    ...Typography.body.large,
    color: Colors.light.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  achievementButton: {
    backgroundColor: Colors.light.primary.teal,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 24,
  },
  achievementButtonText: {
    ...Typography.body.large,
    color: Colors.light.background.primary,
    fontWeight: '600',
  },

  // Status Card Styles
  statusCard: {
    backgroundColor: Colors.light.background.card,
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  companyName: {
    ...Typography.body.large,
    color: Colors.light.text.primary,
    fontWeight: '600',
  },
  positionName: {
    ...Typography.body.medium,
    color: Colors.light.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.body.small,
    color: Colors.light.background.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Skeleton Styles
  skeleton: {
    backgroundColor: Colors.light.neutral.gray[200],
    borderRadius: 4,
  },
});