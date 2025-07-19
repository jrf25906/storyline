import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { EmotionalStateDetector } from '@components/emotional/EmotionalStateDetector';
import { useEmotionalState } from '@context/EmotionalStateContext';
import { useAccessibility } from '@hooks/useAccessibility';

// Mock dependencies
jest.mock('../../../context/EmotionalStateContext');
jest.mock('../../../hooks/useAccessibility');

const mockUseEmotionalState = useEmotionalState as jest.MockedFunction<typeof useEmotionalState>;
const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;

describe('EmotionalStateDetector', () => {
  const mockAnnounceForAccessibility = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAccessibility.mockReturnValue({
      announceForAccessibility: mockAnnounceForAccessibility,
      triggerHapticFeedback: jest.fn(),
      setAccessibilityFocus: jest.fn(),
      checkScreenReaderEnabled: jest.fn(),
      checkReduceMotionEnabled: jest.fn(),
    });

    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'normal',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'normal',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 5,
      recentAchievements: [],
    });
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <EmotionalStateDetector>
        <div>Test Content</div>
      </EmotionalStateDetector>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('shows state indicator when showIndicator is true', () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'crisis',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'crisis',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 9,
      recentAchievements: [],
    });

    const { getByText } = render(
      <EmotionalStateDetector showIndicator>
        <div>Test Content</div>
      </EmotionalStateDetector>
    );

    expect(getByText('CRISIS MODE')).toBeTruthy();
  });

  it('hides indicator when auto-detection is disabled', () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'crisis',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'crisis',
      isAutoDetectionEnabled: false,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 9,
      recentAchievements: [],
    });

    const { queryByText } = render(
      <EmotionalStateDetector showIndicator>
        <div>Test Content</div>
      </EmotionalStateDetector>
    );

    expect(queryByText('CRISIS MODE')).toBeNull();
  });

  it('announces state changes for accessibility', async () => {
    const { rerender } = render(
      <EmotionalStateDetector>
        <div>Test Content</div>
      </EmotionalStateDetector>
    );

    // Change to crisis mode
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'crisis',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'crisis',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 9,
      recentAchievements: [],
    });

    rerender(
      <EmotionalStateDetector>
        <div>Test Content</div>
      </EmotionalStateDetector>
    );

    await waitFor(() => {
      expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
        'Crisis support mode activated. Simplified interface enabled.'
      );
    });
  });

  it('announces achievements', async () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'success',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'success',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 2,
      recentAchievements: ['Received job offer! 🎉'],
    });

    render(
      <EmotionalStateDetector>
        <div>Test Content</div>
      </EmotionalStateDetector>
    );

    await waitFor(() => {
      expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
        'Achievement unlocked: Received job offer! 🎉'
      );
    });
  });

  it('provides correct accessibility labels for different states', () => {
    const states = [
      { state: 'crisis', expectedLabel: 'Crisis Support Active - Simplified interface with larger touch targets' },
      { state: 'success', expectedLabel: 'Success Mode - Celebrating your progress!' },
      { state: 'struggling', expectedLabel: 'Support Mode - Extra guidance and encouragement' },
      { state: 'normal', expectedLabel: 'Normal Mode - Standard interface' },
    ];

    states.forEach(({ state, expectedLabel }) => {
      mockUseEmotionalState.mockReturnValue({
        emotionalState: state as any,
        setEmotionalState: jest.fn(),
        autoDetectedState: state as any,
        isAutoDetectionEnabled: true,
        setAutoDetectionEnabled: jest.fn(),
        stressLevel: 5,
        recentAchievements: [],
      });

      const { getByLabelText } = render(
        <EmotionalStateDetector showIndicator>
          <div>Test Content</div>
        </EmotionalStateDetector>
      );

      expect(getByLabelText(expectedLabel)).toBeTruthy();
    });
  });

  it('handles multiple achievements correctly', async () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'success',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'success',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 2,
      recentAchievements: ['First achievement', 'Second achievement'],
    });

    render(
      <EmotionalStateDetector>
        <div>Test Content</div>
      </EmotionalStateDetector>
    );

    await waitFor(() => {
      expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
        'Achievement unlocked: First achievement'
      );
    });
  });
});