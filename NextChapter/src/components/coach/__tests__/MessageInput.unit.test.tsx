import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MessageInput } from '@components/coach/MessageInput';
import { EMOTIONAL_TRIGGERS } from '@types/coach';
import { APP_CONFIG } from '@utils/constants';

// Mock the theme context
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        warning: '#FF9500',
        text: '#000000',
        textMuted: '#666666',
        white: '#FFFFFF',
        surface: '#F2F2F7',
        border: '#C6C6C8',
        background: '#FFFFFF',
      },
    },
  }),
}));

describe('MessageInput Crisis Detection Tests', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Crisis Keyword Handling', () => {
    // Test each crisis keyword to ensure they can be sent
    // The component should NOT block crisis messages - detection happens in the service
    EMOTIONAL_TRIGGERS.crisis.forEach(keyword => {
      it(`should allow sending message containing crisis keyword: "${keyword}"`, () => {
        const { getByPlaceholderText, getByLabelText } = render(
          <MessageInput onSend={mockOnSend} />
        );
        
        const input = getByPlaceholderText('Type your message...');
        const message = `I'm thinking about ${keyword}`;
        fireEvent.changeText(input, message);
        
        const sendButton = getByLabelText('Send message');
        fireEvent.press(sendButton);
        
        // Verify the message was sent to the handler
        expect(mockOnSend).toHaveBeenCalledWith(message);
        expect(mockOnSend).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle multiple crisis keywords in one message', () => {
      const { getByPlaceholderText, getByLabelText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      const message = `I want to ${EMOTIONAL_TRIGGERS.crisis[0]} and ${EMOTIONAL_TRIGGERS.crisis[1]}`;
      fireEvent.changeText(input, message);
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).toHaveBeenCalledWith(message);
    });

    it('should handle crisis keywords in different cases', () => {
      const { getByPlaceholderText, getByLabelText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      const message = 'I want to KILL MYSELF'; // Uppercase
      fireEvent.changeText(input, message);
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).toHaveBeenCalledWith(message);
    });
  });

  describe('Rate Limiting for Crisis Situations', () => {
    it('should show warning when approaching daily limit during crisis', () => {
      const { getByText } = render(
        <MessageInput onSend={mockOnSend} messagesRemaining={2} />
      );
      
      expect(getByText('2 messages remaining today')).toBeTruthy();
    });

    it('should block messages when daily limit reached even in crisis', () => {
      const { getByPlaceholderText, getByLabelText } = render(
        <MessageInput onSend={mockOnSend} disabled={true} />
      );
      
      const input = getByPlaceholderText('Daily message limit reached');
      const crisisMessage = 'I need help, feeling suicidal';
      fireEvent.changeText(input, crisisMessage);
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      // Should NOT send when disabled
      expect(mockOnSend).not.toHaveBeenCalled();
      expect(input.props.editable).toBe(false);
    });

    it('should show appropriate message when at limit', () => {
      const { getByPlaceholderText } = render(
        <MessageInput onSend={mockOnSend} disabled={true} />
      );
      
      expect(getByPlaceholderText('Daily message limit reached')).toBeTruthy();
    });
  });

  describe('Loading State During Crisis Response', () => {
    it('should prevent multiple crisis messages while loading', () => {
      const { getByPlaceholderText, getByLabelText } = render(
        <MessageInput onSend={mockOnSend} isLoading={true} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'I want to harm myself');
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      // Should not send while loading
      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should show loading indicator during processing', () => {
      const { UNSAFE_getByType } = render(
        <MessageInput onSend={mockOnSend} isLoading={true} />
      );
      
      const ActivityIndicator = require('react-native').ActivityIndicator;
      const indicator = UNSAFE_getByType(ActivityIndicator);
      
      expect(indicator).toBeTruthy();
    });
  });

  describe('Character Limits for Crisis Messages', () => {
    it('should enforce 500 character limit even for crisis messages', () => {
      const { getByPlaceholderText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      expect(input.props.maxLength).toBe(500);
    });

    it('should send long crisis messages up to limit', () => {
      const { getByPlaceholderText, getByLabelText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      const longCrisisMessage = 'I feel suicidal and ' + 'need help '.repeat(45); // Under 500 chars
      fireEvent.changeText(input, longCrisisMessage);
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).toHaveBeenCalledTimes(1);
      const calledWith = mockOnSend.mock.calls[0][0];
      expect(calledWith).toContain('I feel suicidal');
      expect(calledWith.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Accessibility for Crisis Users', () => {
    it('should have clear labels for stressed users', () => {
      const { getByLabelText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByLabelText('Message input');
      expect(input.props.accessibilityHint).toBe('Type your message to the coach');
      
      const sendButton = getByLabelText('Send message');
      expect(sendButton).toBeTruthy();
    });

    it('should indicate disabled state clearly', () => {
      const { getByLabelText } = render(
        <MessageInput onSend={mockOnSend} disabled={true} />
      );
      
      const sendButton = getByLabelText('Send message');
      expect(sendButton.props.accessibilityState.disabled).toBe(true);
    });

    it('should support multiline for detailed crisis messages', () => {
      const { getByPlaceholderText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      expect(input.props.multiline).toBe(true);
    });
  });

  describe('Edge Cases in Crisis Situations', () => {
    it('should trim whitespace from crisis messages', () => {
      const { getByPlaceholderText, getByLabelText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, '  I want to end it all  ');
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).toHaveBeenCalledWith('I want to end it all');
    });

    it('should clear input after sending crisis message', () => {
      const { getByPlaceholderText, getByLabelText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'I need help with suicidal thoughts');
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(input.props.value).toBe('');
    });

    it('should handle rapid crisis message attempts', () => {
      const { getByPlaceholderText, getByLabelText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, 'Help me');
      
      const sendButton = getByLabelText('Send message');
      
      // Rapid presses
      fireEvent.press(sendButton);
      fireEvent.press(sendButton);
      fireEvent.press(sendButton);
      
      // Should only send once (input cleared after first send)
      expect(mockOnSend).toHaveBeenCalledTimes(1);
    });

    it('should not send empty crisis messages', () => {
      const { getByPlaceholderText, getByLabelText } = render(
        <MessageInput onSend={mockOnSend} />
      );
      
      const input = getByPlaceholderText('Type your message...');
      fireEvent.changeText(input, '   '); // Only spaces
      
      const sendButton = getByLabelText('Send message');
      fireEvent.press(sendButton);
      
      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Warning Display for Limited Messages', () => {
    it('should warn at 3 messages remaining', () => {
      const { getByText } = render(
        <MessageInput onSend={mockOnSend} messagesRemaining={3} />
      );
      
      expect(getByText('3 messages remaining today')).toBeTruthy();
    });

    it('should warn at 1 message remaining with singular form', () => {
      const { getByText } = render(
        <MessageInput onSend={mockOnSend} messagesRemaining={1} />
      );
      
      expect(getByText('1 message remaining today')).toBeTruthy();
    });

    it('should not warn when 4+ messages remaining', () => {
      const { queryByText } = render(
        <MessageInput onSend={mockOnSend} messagesRemaining={4} />
      );
      
      expect(queryByText(/message[s]? remaining today/)).toBeNull();
    });
  });
});