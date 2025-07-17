import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { SuccessCelebration } from '../SuccessCelebration';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useAnimations } from '../../../hooks/useAnimations';

// Mock dependencies
jest.mock('../../../hooks/useAccessibility');
jest.mock('../../../hooks/useAnimations');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Animated: {
    ...jest.requireActual('react-native').Animated,
    parallel: jest.fn((animations) => ({
      start: jest.fn((callback) => callback && callback()),
    })),
    timing: jest.fn(() => ({ start: jest.fn() })),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
}));

const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;
const mockUseAnimations = useAnimations as jest.MockedFunction<typeof useAnimations>;

describe('SuccessCelebration', () => {
  const mockOnClose = jest.fn();
  const mockAnnounceForAccessibility = jest.fn();
  const mockTriggerHapticFeedback = jest.fn();
  const mockCreateSpringAnimation = jest.fn();
  const mockCreateSequenceAnimation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAccessibility.mockReturnValue({
      announceForAccessibility: mockAnnounceForAccessibility,
      triggerHapticFeedback: mockTriggerHapticFeedback,
      setAccessibilityFocus: jest.fn(),
      checkScreenReaderEnabled: jest.fn(),
      checkReduceMotionEnabled: jest.fn(),
    });

    mockUseAnimations.mockReturnValue({
      createSpringAnimation: mockCreateSpringAnimation,
      createSequenceAnimation: mockCreateSequenceAnimation,
      createTimingAnimation: jest.fn(),
      createParallelAnimation: jest.fn(),
    });

    mockCreateSpringAnimation.mockReturnValue({
      start: jest.fn(),
    } as any);

    mockCreateSequenceAnimation.mockReturnValue({
      start: jest.fn(),
    } as any);
  });

  it('renders celebration when visible', () => {
    const { getByText } = render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Completed first task!"
      />
    );

    expect(getByText('Congratulations!')).toBeTruthy();
    expect(getByText('Completed first task!')).toBeTruthy();
    expect(getByText('Continue Your Journey')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <SuccessCelebration
        visible={false}
        onClose={mockOnClose}
        achievement="Test achievement"
      />
    );

    expect(queryByText('Congratulations!')).toBeNull();
  });

  it('announces achievement and triggers haptic feedback', async () => {
    render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Got an interview!"
      />
    );

    await waitFor(() => {
      expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
        'Congratulations! Got an interview!'
      );
      expect(mockTriggerHapticFeedback).toHaveBeenCalledWith('success');
    });
  });

  it('displays custom message when provided', () => {
    const { getByText } = render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Applied to 5 jobs"
        message="You're making great progress on your job search!"
      />
    );

    expect(getByText("You're making great progress on your job search!")).toBeTruthy();
  });

  it('closes celebration and announces when continue button is pressed', () => {
    const { getByText } = render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Test achievement"
      />
    );

    fireEvent.press(getByText('Continue Your Journey'));

    expect(mockAnnounceForAccessibility).toHaveBeenCalledWith('Celebration closed');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('starts celebration animation when visible', async () => {
    render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Test achievement"
      />
    );

    await waitFor(() => {
      expect(mockCreateSpringAnimation).toHaveBeenCalled();
      expect(mockCreateSequenceAnimation).toHaveBeenCalled();
    });
  });

  it('renders confetti when showConfetti is true', () => {
    const { UNSAFE_getAllByType } = render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Test achievement"
        showConfetti={true}
      />
    );

    // Should have confetti elements (12 confetti pieces)
    const animatedViews = UNSAFE_getAllByType(Animated.View);
    expect(animatedViews.length).toBeGreaterThan(1); // Main content + confetti
  });

  it('does not render confetti when showConfetti is false', () => {
    const { UNSAFE_getAllByType } = render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Test achievement"
        showConfetti={false}
      />
    );

    const animatedViews = UNSAFE_getAllByType(Animated.View);
    expect(animatedViews.length).toBe(1); // Only main content
  });

  it('has proper accessibility labels', () => {
    const { getByLabelText } = render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Test achievement"
      />
    );

    expect(getByLabelText('Success celebration')).toBeTruthy();
    expect(getByLabelText('Success celebration icon')).toBeTruthy();
    expect(getByLabelText('Close celebration and continue')).toBeTruthy();
  });

  it('provides accessibility hint for continue button', () => {
    const { getByLabelText } = render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Test achievement"
      />
    );

    const continueButton = getByLabelText('Close celebration and continue');
    expect(continueButton.props.accessibilityHint).toBe('Double tap to return to your progress');
  });

  it('displays encouragement message', () => {
    const { getByText } = render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Test achievement"
      />
    );

    expect(getByText(/You're making amazing progress on your journey!/)).toBeTruthy();
    expect(getByText(/Every step forward is worth celebrating/)).toBeTruthy();
  });

  it('has live region for achievement announcement', () => {
    const { getByText } = render(
      <SuccessCelebration
        visible={true}
        onClose={mockOnClose}
        achievement="Test achievement"
      />
    );

    const achievementText = getByText('Test achievement');
    expect(achievementText.props.accessibilityLiveRegion).toBe('polite');
  });
});