import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking, Alert } from 'react-native';
import { CrisisMode } from '@components/emotional/CrisisMode';
import { useEmotionalState } from '@context/EmotionalStateContext';
import { useAccessibility } from '@hooks/useAccessibility';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Linking: {
    openURL: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('../../../context/EmotionalStateContext');
jest.mock('../../../hooks/useAccessibility');

const mockUseEmotionalState = useEmotionalState as jest.MockedFunction<typeof useEmotionalState>;
const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;
const mockLinking = Linking as jest.Mocked<typeof Linking>;
const mockAlert = Alert as jest.Mocked<typeof Alert>;

describe('CrisisMode', () => {
  const mockSetEmotionalState = jest.fn();
  const mockOnClose = jest.fn();
  const mockAnnounceForAccessibility = jest.fn();
  const mockTriggerHapticFeedback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'crisis',
      setEmotionalState: mockSetEmotionalState,
      autoDetectedState: 'crisis',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 9,
      recentAchievements: [],
    });

    mockUseAccessibility.mockReturnValue({
      announceForAccessibility: mockAnnounceForAccessibility,
      triggerHapticFeedback: mockTriggerHapticFeedback,
      setAccessibilityFocus: jest.fn(),
      checkScreenReaderEnabled: jest.fn(),
      checkReduceMotionEnabled: jest.fn(),
    });
  });

  it('renders crisis mode interface when visible', () => {
    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    expect(getByText("You're Safe Here")).toBeTruthy();
    expect(getByText('Call Crisis Hotline (988)')).toBeTruthy();
    expect(getByText('Text Crisis Line')).toBeTruthy();
    expect(getByText('Emergency (911)')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <CrisisMode visible={false} onClose={mockOnClose} />
    );

    expect(queryByText("You're Safe Here")).toBeNull();
  });

  it('calls crisis hotline when button is pressed', async () => {
    mockLinking.openURL.mockResolvedValue(true);

    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('Call Crisis Hotline (988)'));

    await waitFor(() => {
      expect(mockTriggerHapticFeedback).toHaveBeenCalledWith('impact');
      expect(mockAnnounceForAccessibility).toHaveBeenCalledWith('Calling 988 Suicide & Crisis Lifeline');
      expect(mockLinking.openURL).toHaveBeenCalledWith('tel:988');
    });
  });

  it('opens text message for crisis text line', async () => {
    mockLinking.openURL.mockResolvedValue(true);

    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('Text Crisis Line'));

    await waitFor(() => {
      expect(mockLinking.openURL).toHaveBeenCalledWith('sms:741741&body=HELLO');
    });
  });

  it('calls emergency services when 911 button is pressed', async () => {
    mockLinking.openURL.mockResolvedValue(true);

    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('Emergency (911)'));

    await waitFor(() => {
      expect(mockLinking.openURL).toHaveBeenCalledWith('tel:911');
    });
  });

  it('shows alert when call fails', async () => {
    mockLinking.openURL.mockRejectedValue(new Error('Failed to open URL'));

    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('Call Crisis Hotline (988)'));

    await waitFor(() => {
      expect(mockAlert.alert).toHaveBeenCalledWith(
        'Unable to make call',
        'Please dial 988 directly',
        [{ text: 'OK', style: 'default' }]
      );
    });
  });

  it('exits crisis mode and announces change', () => {
    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('Exit Crisis Mode'));

    expect(mockSetEmotionalState).toHaveBeenCalledWith('normal');
    expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
      'Exiting crisis mode. Normal interface restored.'
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('stays in crisis mode when requested', () => {
    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('Stay in Crisis Mode'));

    expect(mockSetEmotionalState).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays breathing exercise instructions', () => {
    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    expect(getByText('Breathing Exercise')).toBeTruthy();
    expect(getByText(/Breathe in slowly for 4 counts/)).toBeTruthy();
  });

  it('shows simple action checklist', () => {
    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    expect(getByText('Simple Next Steps')).toBeTruthy();
    expect(getByText(/You've activated crisis support mode/)).toBeTruthy();
    expect(getByText(/Crisis resources are available above/)).toBeTruthy();
  });

  it('has proper accessibility labels for crisis buttons', () => {
    const { getByLabelText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    expect(getByLabelText('Call 988 Suicide and Crisis Lifeline for immediate support')).toBeTruthy();
    expect(getByLabelText('Text HELLO to 741741 for crisis text support')).toBeTruthy();
    expect(getByLabelText('Call 911 for emergency services')).toBeTruthy();
  });

  it('provides accessibility hints for buttons', () => {
    const { getByLabelText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    const crisisButton = getByLabelText('Call 988 Suicide and Crisis Lifeline for immediate support');
    expect(crisisButton.props.accessibilityHint).toBe('Double tap to call crisis support');
  });

  it('has large touch targets for crisis mode', () => {
    const { getByText } = render(
      <CrisisMode visible={true} onClose={mockOnClose} />
    );

    const crisisButton = getByText('Call Crisis Hotline (988)');
    const buttonStyle = crisisButton.parent?.props.style;
    
    // Check that minHeight is set to 64 (large touch target)
    expect(buttonStyle).toEqual(expect.objectContaining({
      minHeight: 64,
    }));
  });
});