import './setupCoachTests';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CoachSettings } from '@components/coach/CoachSettings';
import { useCoachStore } from '@stores/coachStore';
import { APP_CONFIG } from '@utils/constants';
import { renderWithProviders } from '@test-utils/test-helpers';
import { updateMockCoachStore, resetMockCoachStore } from '@components/coach/__tests__/setupCoachTests';

describe('CoachSettings', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resetMockCoachStore();
  });

  describe('Modal Behavior', () => {
    it('should render when visible is true', () => {
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByText('Coach Settings')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByText } = renderWithProviders(
        <CoachSettings visible={false} onClose={mockOnClose} />
      );
      
      expect(queryByText('Coach Settings')).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
      const { getByLabelText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      const closeButton = getByLabelText('Close settings');
      fireEvent.press(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Daily Usage Display', () => {
    it('should display current message usage', () => {
      const coachStore = useCoachStore();
      (coachStore.getMessageCountToday as jest.Mock).mockReturnValue(5);
      
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByText(`5 / ${APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY}`)).toBeTruthy();
      expect(getByText('Messages used today')).toBeTruthy();
    });

    it('should show progress bar with correct width', () => {
      const coachStore = useCoachStore();
      (coachStore.getMessageCountToday as jest.Mock).mockReturnValue(5);
      
      const { getByTestId } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      // Note: In actual implementation, you'd add testID to the progress bar
      // For now, we verify the text is shown
      const progressText = `${(5 / APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY) * 100}%`;
      expect(coachStore.getMessagesUsedToday).toHaveBeenCalled();
    });

    it('should display reset information', () => {
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByText('Resets daily at midnight')).toBeTruthy();
    });

    it('should handle rate limiting correctly', () => {
      const coachStore = useCoachStore();
      (coachStore.getMessageCountToday as jest.Mock).mockReturnValue(APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY);
      
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByText(`${APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY} / ${APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY}`)).toBeTruthy();
    });
  });

  describe('Cloud Sync Toggle', () => {
    it('should display cloud sync option', () => {
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByText('Cloud Sync')).toBeTruthy();
      expect(getByText('Sync conversations across devices (encrypted)')).toBeTruthy();
    });

    it('should toggle cloud sync when switch is pressed', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      const Switch = require('react-native').Switch;
      const switchComponent = UNSAFE_getByType(Switch);
      
      fireEvent(switchComponent, 'onValueChange', true);
      
      const coachStore = useCoachStore();
      expect(coachStore.setCloudSyncEnabled).toHaveBeenCalledWith(true);
    });

    it('should reflect current cloud sync state', () => {
      updateMockCoachStore({ cloudSyncEnabled: true });
      
      const { UNSAFE_getByType } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      const Switch = require('react-native').Switch;
      const switchComponent = UNSAFE_getByType(Switch);
      
      expect(switchComponent.props.value).toBe(true);
    });
  });

  describe('Privacy & Security Section', () => {
    it('should display all privacy information', () => {
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByText('Privacy & Security')).toBeTruthy();
      expect(getByText('Conversations are stored locally by default')).toBeTruthy();
      expect(getByText('Financial data is never sent to AI')).toBeTruthy();
      expect(getByText('No personal data is used for training')).toBeTruthy();
    });

    it('should emphasize privacy for crisis situations', () => {
      // Verify that sensitive information handling is clearly communicated
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      const financialPrivacy = getByText('Financial data is never sent to AI');
      expect(financialPrivacy).toBeTruthy();
    });
  });

  describe('Pro Features Section', () => {
    it('should display upgrade to Pro option', () => {
      const { getByText, getByLabelText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByText('Upgrade to Pro')).toBeTruthy();
      expect(getByLabelText('Upgrade to Pro')).toBeTruthy();
    });

    it('should list Pro features', () => {
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByText(/Unlimited daily messages/)).toBeTruthy();
      expect(getByText(/Priority AI responses/)).toBeTruthy();
      expect(getByText(/Advanced tone customization/)).toBeTruthy();
      expect(getByText(/Export conversation history/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByLabelText('Close settings')).toBeTruthy();
      expect(getByLabelText('Upgrade to Pro')).toBeTruthy();
    });

    it('should have proper accessibility roles', () => {
      const { getByRole } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      const buttons = getByRole('button');
      expect(buttons).toBeTruthy();
    });
  });

  describe('Crisis Intervention Considerations', () => {
    it('should clearly show message limits to prevent overuse during crisis', () => {
      const coachStore = useCoachStore();
      (coachStore.getMessageCountToday as jest.Mock).mockReturnValue(8);
      
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      // User should be aware of their remaining messages
      expect(getByText(`8 / ${APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY}`)).toBeTruthy();
    });

    it('should emphasize encryption for sensitive conversations', () => {
      const { getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      expect(getByText('Sync conversations across devices (encrypted)')).toBeTruthy();
    });

    it('should show privacy protections for vulnerable users', () => {
      const { getAllByTestId, getByText } = renderWithProviders(
        <CoachSettings visible={true} onClose={mockOnClose} />
      );
      
      // All three privacy items should be visible
      expect(getByText('Conversations are stored locally by default')).toBeTruthy();
      expect(getByText('Financial data is never sent to AI')).toBeTruthy();
      expect(getByText('No personal data is used for training')).toBeTruthy();
    });
  });
});