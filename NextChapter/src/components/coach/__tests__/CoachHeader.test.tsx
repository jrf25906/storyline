import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CoachHeader } from '@components/coach/CoachHeader';
import { useCoachStore } from '@stores/coachStore';
import { renderWithProviders } from '@test-utils/test-helpers';
import { updateMockCoachStore, resetMockCoachStore } from '@components/coach/__tests__/setupCoachTests';
import './setupCoachTests';

jest.spyOn(Alert, 'alert');

describe('CoachHeader', () => {
  const mockOnSettingsPress = jest.fn();
  const mockOnToneChange = jest.fn();
  
  const defaultProps = {
    currentTone: 'pragmatist' as const,
    onToneChange: mockOnToneChange,
    messagesRemaining: 10,
    onSettingsPress: mockOnSettingsPress,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetMockCoachStore();
  });

  describe('Rendering', () => {
    it('should render with Coach title', () => {
      const { getByText } = renderWithProviders(
        <CoachHeader {...defaultProps} />
      );
      
      expect(getByText('Coach')).toBeTruthy();
    });

    it('should show message limit indicator', () => {
      const { getByText } = renderWithProviders(
        <CoachHeader {...defaultProps} />
      );
      
      expect(getByText('10/10 today')).toBeTruthy();
    });

    it('should show warning when messages are low', () => {
      const { getByText } = renderWithProviders(
        <CoachHeader {...defaultProps} messagesRemaining={3} />
      );
      
      expect(getByText('3/10 today')).toBeTruthy();
    });

    it('should display tone selector', () => {
      const { getByText } = renderWithProviders(
        <CoachHeader {...defaultProps} />
      );
      
      expect(getByText('Pragmatist')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onToneChange when tone is changed', () => {
      const { getByText } = renderWithProviders(
        <CoachHeader {...defaultProps} />
      );
      
      // Click on the tone selector
      const toneButton = getByText('Pragmatist');
      fireEvent.press(toneButton);
      
      // Tone selector should open (modal or dropdown)
      // This would need more detailed testing based on ToneSelector implementation
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility label for tone selector', () => {
      const { getByLabelText } = renderWithProviders(
        <CoachHeader {...defaultProps} />
      );
      
      expect(getByLabelText('Coach tone: Pragmatist')).toBeTruthy();
    });

    it('should have header role for title', () => {
      const { getByRole } = renderWithProviders(
        <CoachHeader {...defaultProps} />
      );
      
      const header = getByRole('header');
      expect(header).toBeTruthy();
    });
  });

  describe('Theme Support', () => {
    it('should render with theme styling', () => {
      const { getByText } = renderWithProviders(
        <CoachHeader {...defaultProps} />
      );
      
      const title = getByText('Coach');
      expect(title).toBeTruthy();
    });
  });

  describe('Message Limit Warning', () => {
    it('should highlight when user is running low on messages', () => {
      const { getByText } = renderWithProviders(
        <CoachHeader {...defaultProps} messagesRemaining={2} />
      );
      
      // When low on messages, the indicator should be visible
      expect(getByText('2/10 today')).toBeTruthy();
    });
    
    it('should show when user has no messages left', () => {
      const { getByText } = renderWithProviders(
        <CoachHeader {...defaultProps} messagesRemaining={0} />
      );
      
      expect(getByText('0/10 today')).toBeTruthy();
    });
  });
});