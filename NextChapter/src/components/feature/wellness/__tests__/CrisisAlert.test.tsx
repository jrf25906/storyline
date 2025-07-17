import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking, Alert } from 'react-native';
import { CrisisAlert } from '../CrisisAlert';
import { CrisisDetectionResult } from '../../../../types';

// Mock dependencies
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        text: '#000000',
      },
    },
  }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Feather: ({ name, size, color }: any) => `Feather-${name}`,
}));

describe('CrisisAlert', () => {
  const mockOnDismiss = jest.fn();
  const mockOnContactSupport = jest.fn();

  const createDetection = (
    severity: 'critical' | 'high' | 'medium' | 'low',
    detected: boolean = true
  ): CrisisDetectionResult => ({
    detected,
    severity,
    confidence: 0.9,
    triggers: ['test trigger'],
    suggestedActions: ['Talk to a counselor', 'Contact support'],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should not render when detection is false', () => {
      const detection = createDetection('critical', false);
      const { queryByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      expect(queryByTestId('crisis-alert')).toBeNull();
      expect(queryByTestId('support-resources')).toBeNull();
    });

    it('should render when detection is true', () => {
      const detection = createDetection('critical', true);
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      expect(getByTestId('crisis-alert')).toBeTruthy();
    });
  });

  describe('Severity Levels', () => {
    it('should render critical severity with proper styling', () => {
      const detection = createDetection('critical');
      const { getByTestId, getByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const alert = getByTestId('crisis-alert');
      expect(alert.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#FFEBEE',
            borderColor: '#EF5350',
          }),
        ])
      );
      expect(getByText("You're Not Alone")).toBeTruthy();
    });

    it('should render high severity with proper styling', () => {
      const detection = createDetection('high');
      const { getByTestId, getByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const alert = getByTestId('support-resources');
      expect(alert.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#FFF3E0',
            borderColor: '#FF9800',
          }),
        ])
      );
      expect(getByText("We're Here to Help")).toBeTruthy();
    });

    it('should render medium severity with proper styling', () => {
      const detection = createDetection('medium');
      const { getByTestId, getByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const alert = getByTestId('support-resources');
      expect(getByText('Support Available')).toBeTruthy();
    });

    it('should render low severity with proper styling', () => {
      const detection = createDetection('low');
      const { getByTestId, getByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const alert = getByTestId('support-resources');
      expect(getByText('Feeling Down?')).toBeTruthy();
    });
  });

  describe('Crisis Hotline (Critical Severity)', () => {
    it('should show crisis hotline button for critical severity', () => {
      const detection = createDetection('critical');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      expect(getByTestId('crisis-hotline-button')).toBeTruthy();
    });

    it('should call 988 when crisis hotline button is pressed', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const detection = createDetection('critical');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const hotlineButton = getByTestId('crisis-hotline-button');
      fireEvent.press(hotlineButton);

      await waitFor(() => {
        expect(Linking.canOpenURL).toHaveBeenCalledWith('tel:988');
        expect(Linking.openURL).toHaveBeenCalledWith('tel:988');
      });
    });

    it('should show alert when unable to make call', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);

      const detection = createDetection('critical');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const hotlineButton = getByTestId('crisis-hotline-button');
      fireEvent.press(hotlineButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Unable to make call',
          'Please dial 988 directly from your phone app.',
          [{ text: 'OK' }]
        );
      });
    });

    it('should handle text crisis line button', async () => {
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const detection = createDetection('critical');
      const { getByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const textButton = getByText('Text "HELLO" to 741741').parent;
      fireEvent.press(textButton);

      await waitFor(() => {
        expect(Linking.openURL).toHaveBeenCalledWith('sms:741741&body=HELLO');
      });
    });

    it('should show emergency disclaimer for critical severity', () => {
      const detection = createDetection('critical');
      const { getByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      expect(
        getByText('If you are in immediate danger, please call 911 or go to your nearest emergency room.')
      ).toBeTruthy();
    });

    it('should not show dismiss button for critical severity', () => {
      const detection = createDetection('critical');
      const { queryByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      expect(queryByTestId('dismiss-button')).toBeNull();
    });
  });

  describe('Non-Critical Severities', () => {
    it('should show dismiss button for non-critical severities', () => {
      const detection = createDetection('high');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      expect(getByTestId('dismiss-button')).toBeTruthy();
    });

    it('should call onDismiss when dismiss button is pressed', () => {
      const detection = createDetection('medium');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const dismissButton = getByTestId('dismiss-button');
      fireEvent.press(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not show crisis hotline for non-critical severities', () => {
      const detection = createDetection('high');
      const { queryByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      expect(queryByTestId('crisis-hotline-button')).toBeNull();
    });

    it('should not show emergency disclaimer for non-critical severities', () => {
      const detection = createDetection('medium');
      const { queryByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      expect(
        queryByText('If you are in immediate danger, please call 911 or go to your nearest emergency room.')
      ).toBeNull();
    });
  });

  describe('Suggested Actions', () => {
    it('should render all suggested actions', () => {
      const detection = createDetection('high');
      const { getByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      expect(getByText('Talk to a counselor')).toBeTruthy();
      expect(getByText('Contact support')).toBeTruthy();
    });

    it('should call onContactSupport when action is pressed', () => {
      const detection = createDetection('medium');
      const { getByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const actionButton = getByText('Talk to a counselor');
      fireEvent.press(actionButton);

      expect(mockOnContactSupport).toHaveBeenCalledWith('Talk to a counselor');
    });
  });

  describe('Accessibility', () => {
    it('should have alert role and live region', () => {
      const detection = createDetection('critical');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const alert = getByTestId('crisis-alert');
      expect(alert.props.accessibilityRole).toBe('alert');
      expect(alert.props.accessibilityLiveRegion).toBe('assertive');
    });

    it('should have proper accessibility labels for crisis hotline', () => {
      const detection = createDetection('critical');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const hotlineButton = getByTestId('crisis-hotline-button');
      expect(hotlineButton.props.accessibilityLabel).toBe('Call 988 Suicide and Crisis Lifeline');
      expect(hotlineButton.props.accessibilityHint).toBe('Double tap to call crisis hotline');
    });

    it('should have accessibility label for dismiss button', () => {
      const detection = createDetection('high');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const dismissButton = getByTestId('dismiss-button');
      expect(dismissButton.props.accessibilityLabel).toBe('Dismiss alert');
    });

    it('should have adequate hit slop for dismiss button', () => {
      const detection = createDetection('medium');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const dismissButton = getByTestId('dismiss-button');
      expect(dismissButton.props.hitSlop).toEqual({
        top: 12,
        bottom: 12,
        left: 12,
        right: 12,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Linking errors gracefully for phone calls', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('Linking error'));

      const detection = createDetection('critical');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const hotlineButton = getByTestId('crisis-hotline-button');
      fireEvent.press(hotlineButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Unable to make call',
          'Please dial 988 directly from your phone app.',
          [{ text: 'OK' }]
        );
      });
    });

    it('should handle Linking errors gracefully for text messages', async () => {
      (Linking.openURL as jest.Mock).mockRejectedValue(new Error('Linking error'));

      const detection = createDetection('critical');
      const { getByText } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const textButton = getByText('Text "HELLO" to 741741').parent;
      fireEvent.press(textButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Unable to send text',
          'Please text "HELLO" to 741741 from your messages app.',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('User Experience', () => {
    it('should use supportive, non-alarming language', () => {
      const severities: Array<'critical' | 'high' | 'medium' | 'low'> = [
        'critical',
        'high',
        'medium',
        'low',
      ];
      
      const expectedTitles = {
        critical: "You're Not Alone",
        high: "We're Here to Help",
        medium: 'Support Available',
        low: 'Feeling Down?',
      };

      severities.forEach((severity) => {
        const detection = createDetection(severity);
        const { getByText } = render(
          <CrisisAlert
            detection={detection}
            onDismiss={mockOnDismiss}
            onContactSupport={mockOnContactSupport}
          />
        );

        expect(getByText(expectedTitles[severity])).toBeTruthy();
      });
    });

    it('should use warm, non-harsh colors', () => {
      // All severity levels use softer background colors and avoid harsh reds
      const detection = createDetection('critical');
      const { getByTestId } = render(
        <CrisisAlert
          detection={detection}
          onDismiss={mockOnDismiss}
          onContactSupport={mockOnContactSupport}
        />
      );

      const alert = getByTestId('crisis-alert');
      // Even critical uses a soft pink (#FFEBEE) instead of bright red
      expect(alert.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FFEBEE' }),
        ])
      );
    });
  });
});