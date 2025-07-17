import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Animated,
  Easing,
  AccessibilityInfo,
  ViewStyle,
  ColorValue,
} from 'react-native';
import { Motion } from '../theme/animations';

/**
 * Configuration options for animations
 */
interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: Animated.TimingAnimationConfig['easing'];
  useNativeDriver?: boolean;
  onComplete?: () => void;
}

/**
 * Hook to check if reduce motion is enabled
 */
const useReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    
    return () => subscription?.remove();
  }, []);

  return reduceMotion;
};

/**
 * Custom easing functions based on design system
 */
const CustomEasing = {
  standard: Easing.bezier(0.2, 0, 0.2, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0, 1, 1),
  bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),
};

/**
 * Gentle slide in animation from bottom with fade
 * Perfect for new content appearing on screen
 */
export const useSlideInAnimation = (config: AnimationConfig = {}) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  const animate = useCallback(() => {
    if (reduceMotion) {
      // If reduce motion is enabled, just fade in without movement
      Animated.timing(opacity, {
        toValue: 1,
        duration: Motion.duration.fast,
        useNativeDriver: true,
      }).start(config.onComplete);
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: config.duration || Motion.duration.slow,
        delay: config.delay || 0,
        easing: config.easing || CustomEasing.decelerate,
        useNativeDriver: config.useNativeDriver !== false,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: config.duration || Motion.duration.slow,
        delay: config.delay || 0,
        easing: config.easing || CustomEasing.decelerate,
        useNativeDriver: config.useNativeDriver !== false,
      }),
    ]).start(config.onComplete);
  }, [translateY, opacity, reduceMotion, config]);

  const reset = useCallback(() => {
    translateY.setValue(20);
    opacity.setValue(0);
  }, [translateY, opacity]);

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    opacity,
    transform: [{ translateY }],
  };

  return {
    animate,
    reset,
    animatedStyle,
    translateY,
    opacity,
  };
};

/**
 * Simple opacity fade animation
 * Use for subtle content transitions
 */
export const useFadeInAnimation = (config: AnimationConfig = {}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  const animate = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: reduceMotion 
        ? Motion.duration.fast 
        : (config.duration || Motion.duration.standard),
      delay: config.delay || 0,
      easing: config.easing || CustomEasing.standard,
      useNativeDriver: config.useNativeDriver !== false,
    }).start(config.onComplete);
  }, [opacity, reduceMotion, config]);

  const reset = useCallback(() => {
    opacity.setValue(0);
  }, [opacity]);

  const fadeOut = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: reduceMotion 
        ? Motion.duration.fast 
        : (config.duration || Motion.duration.fast),
      easing: CustomEasing.accelerate,
      useNativeDriver: true,
    }).start();
  }, [opacity, reduceMotion, config.duration]);

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    opacity,
  };

  return {
    animate,
    reset,
    fadeOut,
    animatedStyle,
    opacity,
  };
};

/**
 * Task completion animation with scale and color change
 * Provides positive feedback for user accomplishments
 */
export const useTaskCompleteAnimation = (
  config: AnimationConfig & { 
    completedColor?: ColorValue;
    originalColor?: ColorValue;
  } = {}
) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const colorAnimation = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  const animate = useCallback(() => {
    if (reduceMotion) {
      // Simple color change without scaling for reduced motion
      Animated.timing(colorAnimation, {
        toValue: 1,
        duration: Motion.duration.fast,
        useNativeDriver: false,
      }).start(config.onComplete);
      return;
    }

    // Full animation sequence
    Animated.sequence([
      // Scale up slightly
      Animated.timing(scale, {
        toValue: 1.05,
        duration: Motion.duration.fast,
        easing: CustomEasing.standard,
        useNativeDriver: true,
      }),
      // Scale back down with color change
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: Motion.duration.fast,
          easing: CustomEasing.standard,
          useNativeDriver: true,
        }),
        Animated.timing(colorAnimation, {
          toValue: 1,
          duration: Motion.duration.standard,
          easing: CustomEasing.standard,
          useNativeDriver: false,
        }),
      ]),
    ]).start(config.onComplete);
  }, [scale, colorAnimation, reduceMotion, config]);

  const reset = useCallback(() => {
    scale.setValue(1);
    colorAnimation.setValue(0);
  }, [scale, colorAnimation]);

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    opacity,
    transform: [{ scale }],
  };

  // Background color interpolation (requires useNativeDriver: false)
  const animatedColorStyle = config.originalColor && config.completedColor ? {
    backgroundColor: colorAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [config.originalColor as string, config.completedColor as string],
    }),
  } : {};

  return {
    animate,
    reset,
    animatedStyle,
    animatedColorStyle,
    scale,
    colorAnimation,
  };
};

/**
 * Subtle scale animation for card press feedback
 * Provides tactile response without being jarring
 */
export const useCardPressAnimation = (config: AnimationConfig = {}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  const pressIn = useCallback(() => {
    if (reduceMotion) return;

    Animated.timing(scale, {
      toValue: 0.96,
      duration: Motion.duration.fast,
      easing: CustomEasing.standard,
      useNativeDriver: true,
    }).start();
  }, [scale, reduceMotion]);

  const pressOut = useCallback(() => {
    if (reduceMotion) return;

    Animated.timing(scale, {
      toValue: 1,
      duration: Motion.duration.fast,
      easing: CustomEasing.standard,
      useNativeDriver: true,
    }).start(config.onComplete);
  }, [scale, reduceMotion, config.onComplete]);

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    transform: [{ scale }],
  };

  return {
    pressIn,
    pressOut,
    animatedStyle,
    scale,
  };
};

/**
 * Progress animation for bars and circular progress indicators
 * Smooth, calming progress visualization
 */
export const useProgressAnimation = (
  targetProgress: number,
  config: AnimationConfig = {}
) => {
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  const animateTo = useCallback((value: number) => {
    Animated.timing(progress, {
      toValue: value,
      duration: reduceMotion 
        ? Motion.duration.fast 
        : (config.duration || Motion.duration.standard),
      easing: config.easing || CustomEasing.standard,
      useNativeDriver: false, // Progress often affects layout
    }).start(config.onComplete);
  }, [progress, reduceMotion, config]);

  useEffect(() => {
    animateTo(targetProgress);
  }, [targetProgress, animateTo]);

  const reset = useCallback(() => {
    progress.setValue(0);
  }, [progress]);

  return {
    progress,
    animateTo,
    reset,
  };
};

/**
 * Combined animation hook for complex sequences
 * Allows chaining multiple animations together
 */
export const useSequenceAnimation = () => {
  const reduceMotion = useReduceMotion();

  const sequence = useCallback((
    animations: Animated.CompositeAnimation[],
    onComplete?: () => void
  ) => {
    if (reduceMotion) {
      // Run only the last animation in reduced motion mode
      const lastAnimation = animations[animations.length - 1];
      if (lastAnimation) {
        lastAnimation.start(onComplete);
      }
      return;
    }

    Animated.sequence(animations).start(onComplete);
  }, [reduceMotion]);

  const parallel = useCallback((
    animations: Animated.CompositeAnimation[],
    onComplete?: () => void
  ) => {
    Animated.parallel(animations).start(onComplete);
  }, []);

  const stagger = useCallback((
    delay: number,
    animations: Animated.CompositeAnimation[],
    onComplete?: () => void
  ) => {
    if (reduceMotion) {
      // Run all at once in reduced motion mode
      Animated.parallel(animations).start(onComplete);
      return;
    }

    Animated.stagger(delay, animations).start(onComplete);
  }, [reduceMotion]);

  return {
    sequence,
    parallel,
    stagger,
  };
};

/**
 * Spring animation for celebratory moments
 * Only used for positive feedback and success states
 */
export const useCelebrationAnimation = (config: AnimationConfig = {}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  const animate = useCallback(() => {
    if (reduceMotion) {
      // Simple scale pulse for reduced motion
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: Motion.duration.fast,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: Motion.duration.fast,
          useNativeDriver: true,
        }),
      ]).start(config.onComplete);
      return;
    }

    // Full celebration animation
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.2,
          ...Motion.spring.bouncy,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          ...Motion.spring.success,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 0.1,
          duration: Motion.duration.fast,
          easing: CustomEasing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: -0.1,
          duration: Motion.duration.fast,
          easing: CustomEasing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 0,
          duration: Motion.duration.fast,
          easing: CustomEasing.bounce,
          useNativeDriver: true,
        }),
      ]),
    ]).start(config.onComplete);
  }, [scale, rotation, reduceMotion, config]);

  const reset = useCallback(() => {
    scale.setValue(1);
    rotation.setValue(0);
  }, [scale, rotation]);

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    transform: [
      { scale },
      {
        rotate: rotation.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-15deg', '15deg'],
        }),
      },
    ],
  };

  return {
    animate,
    reset,
    animatedStyle,
    scale,
    rotation,
  };
};
/**

 * Breathing animation for loading states
 * Gentle, calming animation that doesn't distract
 */
export const useBreathingAnimation = (config: AnimationConfig = {}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const breathe = () => {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: config.duration || 2000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: config.duration || 2000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ]).start(() => breathe());
    };

    breathe();
  }, [scale, reduceMotion, config.duration]);

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    transform: [{ scale }],
  };

  return {
    animatedStyle,
    scale,
  };
};

/**
 * Gentle shake animation for form validation errors
 * Subtle feedback that doesn't cause stress
 */
export const useShakeAnimation = (config: AnimationConfig = {}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  const shake = useCallback(() => {
    if (reduceMotion) {
      // Just a subtle opacity change for reduced motion
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 0.5,
          duration: Motion.duration.fast,
          useNativeDriver: false,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: Motion.duration.fast,
          useNativeDriver: false,
        }),
      ]).start(config.onComplete);
      return;
    }

    Animated.sequence([
      Animated.timing(translateX, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start(config.onComplete);
  }, [translateX, reduceMotion, config.onComplete]);

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    transform: [{ translateX }],
  };

  return {
    shake,
    animatedStyle,
    translateX,
  };
};

/**
 * Pulse animation for notifications and attention-getting elements
 * Gentle pulse that respects user's attention
 */
export const usePulseAnimation = (config: AnimationConfig = {}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  const pulse = useCallback(() => {
    if (reduceMotion) {
      // Simple opacity change for reduced motion
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: Motion.duration.fast,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: Motion.duration.fast,
          useNativeDriver: true,
        }),
      ]).start(config.onComplete);
      return;
    }

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: Motion.duration.standard,
          easing: CustomEasing.standard,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: Motion.duration.standard,
          easing: CustomEasing.standard,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: Motion.duration.standard,
          easing: CustomEasing.standard,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: Motion.duration.standard,
          easing: CustomEasing.standard,
          useNativeDriver: true,
        }),
      ]),
    ]).start(config.onComplete);
  }, [scale, opacity, reduceMotion, config.onComplete]);

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    opacity,
    transform: [{ scale }],
  };

  return {
    pulse,
    animatedStyle,
    scale,
    opacity,
  };
};

/**
 * Page transition animation for screen changes
 * Smooth, gentle transitions between screens
 */
export const usePageTransitionAnimation = (config: AnimationConfig = {}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  const slideIn = useCallback((direction: 'left' | 'right' = 'right') => {
    const startValue = direction === 'right' ? 300 : -300;
    translateX.setValue(startValue);
    opacity.setValue(0);

    if (reduceMotion) {
      // Just fade in for reduced motion
      Animated.timing(opacity, {
        toValue: 1,
        duration: Motion.duration.fast,
        useNativeDriver: true,
      }).start(config.onComplete);
      return;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: config.duration || Motion.duration.slow,
        easing: CustomEasing.decelerate,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: config.duration || Motion.duration.slow,
        easing: CustomEasing.standard,
        useNativeDriver: true,
      }),
    ]).start(config.onComplete);
  }, [translateX, opacity, reduceMotion, config]);

  const slideOut = useCallback((direction: 'left' | 'right' = 'left') => {
    const endValue = direction === 'left' ? -300 : 300;

    if (reduceMotion) {
      // Just fade out for reduced motion
      Animated.timing(opacity, {
        toValue: 0,
        duration: Motion.duration.fast,
        useNativeDriver: true,
      }).start(config.onComplete);
      return;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: endValue,
        duration: config.duration || Motion.duration.standard,
        easing: CustomEasing.accelerate,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: config.duration || Motion.duration.standard,
        easing: CustomEasing.standard,
        useNativeDriver: true,
      }),
    ]).start(config.onComplete);
  }, [translateX, opacity, reduceMotion, config]);

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    opacity,
    transform: [{ translateX }],
  };

  return {
    slideIn,
    slideOut,
    animatedStyle,
    translateX,
    opacity,
  };
};