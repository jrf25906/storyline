import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Button } from 'react-native';
import { render, act, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import {
  useSlideInAnimation,
  useFadeInAnimation,
  useTaskCompleteAnimation,
  useCardPressAnimation,
  useProgressAnimation,
  useSequenceAnimation,
  useCelebrationAnimation,
} from '../useAnimations';
import { Colors } from '../../theme/colors';

// Mock AccessibilityInfo
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

describe('Animation Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSlideInAnimation', () => {
    const TestComponent = () => {
      const { animate, animatedStyle } = useSlideInAnimation({
        duration: 300,
        onComplete: jest.fn(),
      });

      useEffect(() => {
        animate();
      }, [animate]);

      return (
        <Animated.View style={animatedStyle} testID="animated-view">
          <Text>Slide In Content</Text>
        </Animated.View>
      );
    };

    it('should initialize with correct starting values', () => {
      const { getByTestId } = render(<TestComponent />);
      const view = getByTestId('animated-view');
      
      expect(view.props.style).toMatchObject({
        opacity: expect.any(Object),
        transform: [{ translateY: expect.any(Object) }],
      });
    });

    it('should animate on mount', async () => {
      const { getByTestId } = render(<TestComponent />);
      
      await act(async () => {
        await waitFor(() => {
          const view = getByTestId('animated-view');
          expect(view).toBeTruthy();
        });
      });
    });
  });

  describe('useFadeInAnimation', () => {
    const TestComponent = () => {
      const { animate, fadeOut, animatedStyle } = useFadeInAnimation({
        duration: 200,
      });

      return (
        <View>
          <Animated.View style={animatedStyle} testID="fade-view">
            <Text>Fade Content</Text>
          </Animated.View>
          <Button title="Fade In" onPress={animate} testID="fade-in-btn" />
          <Button title="Fade Out" onPress={fadeOut} testID="fade-out-btn" />
        </View>
      );
    };

    it('should provide fade in and fade out functions', () => {
      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('fade-in-btn')).toBeTruthy();
      expect(getByTestId('fade-out-btn')).toBeTruthy();
    });
  });

  describe('useTaskCompleteAnimation', () => {
    const TestComponent = () => {
      const { animate, animatedStyle, animatedColorStyle } = useTaskCompleteAnimation({
        originalColor: Colors.light.background.card,
        completedColor: Colors.light.success.mint,
      });

      useEffect(() => {
        animate();
      }, [animate]);

      return (
        <Animated.View 
          style={[animatedStyle, animatedColorStyle]} 
          testID="task-card"
        >
          <Text>Task Item</Text>
        </Animated.View>
      );
    };

    it('should animate scale and color', () => {
      const { getByTestId } = render(<TestComponent />);
      const card = getByTestId('task-card');
      
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            opacity: expect.any(Object),
            transform: [{ scale: expect.any(Object) }],
          }),
          expect.objectContaining({
            backgroundColor: expect.any(Object),
          }),
        ])
      );
    });
  });

  describe('useCardPressAnimation', () => {
    const TestComponent = () => {
      const { pressIn, pressOut, animatedStyle } = useCardPressAnimation();

      return (
        <TouchableOpacity 
          onPressIn={pressIn} 
          onPressOut={pressOut}
          testID="pressable-card"
        >
          <Animated.View style={animatedStyle}>
            <Text>Press Me</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    };

    it('should provide press handlers', () => {
      const { getByTestId } = render(<TestComponent />);
      const card = getByTestId('pressable-card');
      
      expect(card.props.onPressIn).toBeDefined();
      expect(card.props.onPressOut).toBeDefined();
    });
  });

  describe('useProgressAnimation', () => {
    const TestComponent = ({ progress }: { progress: number }) => {
      const { progress: animatedProgress } = useProgressAnimation(progress, {
        duration: 500,
      });

      return (
        <Animated.View
          testID="progress-bar"
          style={{
            width: animatedProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      );
    };

    it('should animate to target progress', () => {
      const { getByTestId, rerender } = render(<TestComponent progress={0} />);
      const progressBar = getByTestId('progress-bar');
      
      expect(progressBar.props.style.width).toBeDefined();
      
      rerender(<TestComponent progress={0.5} />);
      
      // Progress animation should update
      expect(progressBar.props.style.width).toBeDefined();
    });
  });

  describe('useCelebrationAnimation', () => {
    const TestComponent = () => {
      const { animate, animatedStyle } = useCelebrationAnimation();

      return (
        <View>
          <Animated.View style={animatedStyle} testID="celebration-view">
            <Text>🎉 Success!</Text>
          </Animated.View>
          <Button title="Celebrate" onPress={animate} />
        </View>
      );
    };

    it('should provide scale and rotation transforms', () => {
      const { getByTestId } = render(<TestComponent />);
      const view = getByTestId('celebration-view');
      
      expect(view.props.style.transform).toEqual([
        { scale: expect.any(Object) },
        { rotate: expect.any(Object) },
      ]);
    });
  });
});

/**
 * Example usage components demonstrating all animation hooks
 */

// Example 1: Onboarding screen with slide-in elements
export const OnboardingExample = () => {
  const titleAnimation = useSlideInAnimation({ delay: 0 });
  const descriptionAnimation = useSlideInAnimation({ delay: 100 });
  const buttonAnimation = useSlideInAnimation({ delay: 200 });

  useEffect(() => {
    titleAnimation.animate();
    descriptionAnimation.animate();
    buttonAnimation.animate();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Animated.Text style={[titleAnimation.animatedStyle, { fontSize: 24 }]}>
        Welcome to Next Chapter
      </Animated.Text>
      <Animated.Text style={[descriptionAnimation.animatedStyle, { marginTop: 10 }]}>
        Let's get you back on track
      </Animated.Text>
      <Animated.View style={buttonAnimation.animatedStyle}>
        <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: Colors.light.primary.teal }}>
          <Text>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Example 2: Task card with completion animation
export const TaskCardExample = () => {
  const [isCompleted, setIsCompleted] = React.useState(false);
  const pressAnimation = useCardPressAnimation();
  const completeAnimation = useTaskCompleteAnimation({
    originalColor: Colors.light.background.card,
    completedColor: Colors.light.success.mint,
  });

  const handlePress = () => {
    setIsCompleted(true);
    completeAnimation.animate();
  };

  return (
    <TouchableOpacity
      onPressIn={pressAnimation.pressIn}
      onPressOut={pressAnimation.pressOut}
      onPress={handlePress}
    >
      <Animated.View 
        style={[
          pressAnimation.animatedStyle,
          completeAnimation.animatedStyle,
          completeAnimation.animatedColorStyle,
          {
            padding: 16,
            borderRadius: 12,
            backgroundColor: Colors.light.background.card,
          }
        ]}
      >
        <Text>Daily Task: Update your resume</Text>
        {isCompleted && <Text>✓ Completed!</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Example 3: Progress indicator with smooth animation
export const ProgressExample = () => {
  const [progress, setProgress] = React.useState(0);
  const { progress: animatedProgress } = useProgressAnimation(progress);

  return (
    <View style={{ padding: 20 }}>
      <Text>Your Progress: {Math.round(progress * 100)}%</Text>
      <View style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginTop: 10 }}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 4,
            backgroundColor: Colors.light.primary.teal,
            width: animatedProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
      <Button 
        title="Increase Progress" 
        onPress={() => setProgress(Math.min(1, progress + 0.25))} 
      />
    </View>
  );
};

// Example 4: Success celebration
export const CelebrationExample = () => {
  const celebration = useCelebrationAnimation();
  const fadeIn = useFadeInAnimation({ delay: 300 });

  const handleSuccess = () => {
    celebration.animate();
    fadeIn.animate();
  };

  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Animated.View style={celebration.animatedStyle}>
        <Text style={{ fontSize: 48 }}>🎉</Text>
      </Animated.View>
      <Animated.Text style={[fadeIn.animatedStyle, { marginTop: 10 }]}>
        Congratulations! You completed Day 1!
      </Animated.Text>
      <Button title="Trigger Celebration" onPress={handleSuccess} />
    </View>
  );
};

// Example 5: Loading state with fade transition
export const LoadingExample = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const loadingFade = useFadeInAnimation();
  const contentFade = useFadeInAnimation();

  useEffect(() => {
    if (isLoading) {
      loadingFade.animate();
    } else {
      loadingFade.fadeOut();
      setTimeout(() => contentFade.animate(), 200);
    }
  }, [isLoading]);

  return (
    <View style={{ padding: 20 }}>
      {isLoading ? (
        <Animated.View style={loadingFade.animatedStyle}>
          <Text>Loading your data...</Text>
        </Animated.View>
      ) : (
        <Animated.View style={contentFade.animatedStyle}>
          <Text>Your content is ready!</Text>
        </Animated.View>
      )}
      <Button 
        title="Toggle Loading" 
        onPress={() => setIsLoading(!isLoading)} 
      />
    </View>
  );
};

// Example 6: Accessibility-aware animations
export const AccessibleAnimationExample = () => {
  const slideIn = useSlideInAnimation();
  
  // The animation hooks automatically respect reduce motion preference
  // When reduce motion is enabled:
  // - Slide animations become simple fades
  // - Durations are shortened
  // - Spring animations are disabled
  
  return (
    <View style={{ padding: 20 }}>
      <Text>This animation respects user preferences</Text>
      <Animated.View style={slideIn.animatedStyle}>
        <Text>
          If reduce motion is enabled in device settings,
          this will fade in instead of sliding.
        </Text>
      </Animated.View>
      <Button title="Animate" onPress={slideIn.animate} />
    </View>
  );
};