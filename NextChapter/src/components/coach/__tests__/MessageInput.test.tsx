import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MessageInput } from '../MessageInput';
import { renderWithProviders } from '../../../test-utils/test-helpers';
import { APP_CONFIG } from '../../../utils/constants';
import { EMOTIONAL_TRIGGERS } from '../../../types/coach';
import './setupCoachTests';

describe('MessageInput', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render input field with placeholder', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      expect(getByPlaceholderText('Type your message...')).toBeTruthy();
    });

    it('should update text as user types', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'Hello coach');
      
      expect(input.props.value).toBe('Hello coach');
    });

    it('should call onSend with trimmed message when send button is pressed', () => {
      const { getByPlaceholderText, getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, '  Hello coach  ');
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).toHaveBeenCalledWith('Hello coach');
    });

    it('should clear input after sending', () => {
      const { getByPlaceholderText, getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'Test message');
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(input.props.value).toBe('');
    });

    it('should not send empty messages', () => {
      const { getByPlaceholderText, getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, '   '); // Only whitespace
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should show warning when approaching daily limit', () => {
      const { getByText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} messagesRemaining={3} />
      );
      
      expect(getByText('3 messages remaining today')).toBeTruthy();
    });

    it('should show singular form for 1 message remaining', () => {
      const { getByText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} messagesRemaining={1} />
      );
      
      expect(getByText('1 message remaining today')).toBeTruthy();
    });

    it('should not show warning when more than 3 messages remaining', () => {
      const { queryByText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} messagesRemaining={4} />
      );
      
      expect(queryByText(/messages? remaining today/)).toBeNull();
    });

    it('should disable input when daily limit reached', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} disabled={true} />
      );
      
      const input = getByPlaceholderText('Daily message limit reached');
      expect(input.props.editable).toBe(false);
    });

    it('should show appropriate placeholder when disabled', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} disabled={true} />
      );
      
      expect(getByPlaceholderText('Daily message limit reached')).toBeTruthy();
    });

    it('should disable send button when at limit', () => {
      const { getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} disabled={true} />
      );
      
      const sendButton = getByLabelText('Send message');
      expect(sendButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <MessageInput onSend={mockOnSend} isLoading={true} />
      );
      
      const ActivityIndicator = require('react-native').ActivityIndicator;
      const indicator = UNSAFE_getByType(ActivityIndicator);
      
      expect(indicator).toBeTruthy();
    });

    it('should disable input during loading', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} isLoading={true} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      expect(input.props.editable).toBe(false);
    });

    it('should disable send button during loading', () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} isLoading={true} />
      );
      
      // First, add text to enable button
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'Test message');
      
      const sendButton = getByLabelText('Send message');
      expect(sendButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Crisis Keyword Detection', () => {
    // Test each crisis keyword
    EMOTIONAL_TRIGGERS.crisis.forEach(keyword => {
      it(`should allow sending message with crisis keyword "${keyword}"`, () => {
        const { getByPlaceholderText, getByLabelText } = renderWithProviders(
          <MessageInput onSend={mockOnSend} />
        );
        
        const input = getByPlaceholderText('Type your message...');
        fireEvent.changeText(input, `I feel like ${keyword}`);
        
        const sendButton = getByLabelText('Send message');
        fireEvent.press(sendButton);
        
        // Should still send - crisis detection happens in the service layer
        expect(mockOnSend).toHaveBeenCalledWith(`I feel like ${keyword}`);
      });
    });

    it('should handle multiple crisis keywords in one message', () => {
      const { getByPlaceholderText, getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'I want to harm myself and end it all');
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).toHaveBeenCalledWith('I want to harm myself and end it all');
    });
  });

  describe('Character Limit', () => {
    it('should enforce 500 character limit', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      expect(input.props.maxLength).toBe(500);
    });

    it('should handle messages at character limit', () => {
      const longMessage = 'A'.repeat(500);
      const { getByPlaceholderText, getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, longMessage);
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).toHaveBeenCalledWith(longMessage);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      expect(getByLabelText('Message input')).toBeTruthy();
      expect(getByLabelText('Send message')).toBeTruthy();
    });

    it('should have proper accessibility hint', () => {
      const { getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByLabelText('Message input');
      expect(input.props.accessibilityHint).toBe('Type your message to the coach');
    });

    it('should indicate disabled state in accessibility', () => {
      const { getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} disabled={true} />
      );
      
      const sendButton = getByLabelText('Send message');
      expect(sendButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Multiline Support', () => {
    it('should support multiline input', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      expect(input.props.multiline).toBe(true);
    });

    it('should handle newlines in messages', () => {
      const { getByPlaceholderText, getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'Line 1\nLine 2\nLine 3');
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).toHaveBeenCalledWith('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid send attempts', () => {
      const { getByPlaceholderText, getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'Test message');
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      fireEvent.press(sendButton);
      fireEvent.press(sendButton);
      
      // Should only send once since input is cleared after first send
      expect(mockOnSend).toHaveBeenCalledTimes(1);
    });

    it('should handle submit via keyboard', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'Test message');
      fireEvent(input, 'onSubmitEditing');
      
      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('should not blur on submit', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      expect(input.props.blurOnSubmit).toBe(false);
    });
  });

  describe('Button State Management', () => {
    it('should disable send button when input is empty', () => {
      const { getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const sendButton = getByLabelText('Send message');
      expect(sendButton.props.accessibilityState.disabled).toBe(true);
    });

    it('should enable send button when input has text', () => {
      const { getByPlaceholderText, getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'Hello');
      
      const sendButton = getByLabelText('Send message');
      expect(sendButton.props.accessibilityState.disabled).toBe(false);
    });

    it('should update button color based on state', () => {
      const { getByPlaceholderText, getByLabelText } = renderWithProviders(
        <MessageInput onSend={mockOnSend} />
      );
      
      const sendButton = getByLabelText('Send message');
      
      // Button should be disabled initially
      expect(sendButton.props.accessibilityState.disabled).toBe(true);
      
      // Enable by adding text
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'Test');
      
      expect(sendButton.props.accessibilityState.disabled).toBe(false);
    });
  });
});