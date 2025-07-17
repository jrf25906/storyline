import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Typography } from '../common/Typography';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAnimations } from '../../hooks/useAnimations';
import { Colors, Spacing } from '../../theme';

interface SuccessCelebrationProps {
  visible: boolean;
  onClose: () => void;
  achievement: string;
  message?: string;
  showConfetti?: boolean;
}

/**
 * Success Celebration Component
 * Provides positive reinforcement and celebration for achievements
 * Part of Phase 3: Advanced Emotional Intelligence
 */
export function SuccessCelebration({ 
  visible, 
  onClose, 
  achievement, 
  message,
  showConfetti = true 
}: SuccessCelebrationProps) {
  const { announceForAccessibility, triggerHapticFeedback } = useAccessibility();
  const { createSpringAnimation, createSequenceAnimation } = useAnimations();
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(-50),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Announce achievement
      announceForAccessibility(`Congratulations! ${achievement}`);
      
      // Trigger celebration haptics
      triggerHapticFeedback('success');
      
      // Start celebration animation
      startCelebrationAnimation();
    }
  }, [visible, achievement]);

  const startCelebrationAnimation = () => {
    // Main content animation
    const mainAnimation = createSequenceAnimation([
      createSpringAnimation(scaleAnim, 1, { damping: 8, stiffness: 100 }),
      createSpringAnimation(fadeAnim, 1, { damping: 12, stiffness: 80 }),
    ]);

    // Confetti animation
    const confettiAnimations = confettiAnims.map((anim, index) => {
      const delay = index * 100;
      return Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: Dimensions.get('window').height,
          duration: 3000 + Math.random() * 1000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 360 * (2 + Math.random()),
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 3000,
          delay: delay + 1000,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel([
      mainAnimation,
      ...(showConfetti ? confettiAnimations : []),
    ]).start();
  };

  const handleClose = () => {
    announceForAccessibility('Celebration closed');
    onClose();
  };

  const getConfettiColors = () => [
    Colors.success,
    Colors.accent,
    Colors.primary,
    Colors.successMint,
  ];

  const renderConfetti = () => {
    if (!showConfetti) return null;

    const colors = getConfettiColors();
    const { width } = Dimensions.get('window');

    return confettiAnims.map((anim, index) => (
      <Animated.View
        key={index}
        style={[
          styles.confetti,
          {
            backgroundColor: colors[index % colors.length],
            left: Math.random() * width,
            transform: [
              { translateY: anim.translateY },
              { 
                rotate: anim.rotate.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })
              },
            ],
            opacity: anim.opacity,
          },
        ]}
      />
    ));
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      size="medium"
      accessibilityLabel="Success celebration"
    >
      <View style={styles.container}>
        {renderConfetti()}
        
        <Animated.View 
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Typography 
              variant="display" 
              style={styles.successIcon}
              accessibilityLabel="Success celebration icon"
            >
              🎉
            </Typography>
          </View>

          {/* Achievement Text */}
          <Typography 
            variant="h1" 
            style={styles.title}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            Congratulations!
          </Typography>

          <Typography 
            variant="h2" 
            style={styles.achievement}
            accessibilityLiveRegion="polite"
          >
            {achievement}
          </Typography>

          {message && (
            <Typography 
              variant="body" 
              style={styles.message}
            >
              {message}
            </Typography>
          )}

          {/* Encouragement */}
          <View style={styles.encouragement}>
            <Typography variant="body" style={styles.encouragementText}>
              You're making amazing progress on your journey! 
              Every step forward is worth celebrating.
            </Typography>
          </View>

          {/* Action Button */}
          <Button
            title="Continue Your Journey"
            onPress={handleClose}
            variant="primary"
            size="large"
            style={styles.continueButton}
            accessibilityLabel="Close celebration and continue"
            accessibilityHint="Double tap to return to your progress"
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  successIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  title: {
    color: Colors.success,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  achievement: {
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  message: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  encouragement: {
    backgroundColor: Colors.successMint + '20',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.xl,
  },
  encouragementText: {
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  continueButton: {
    minWidth: 200,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});