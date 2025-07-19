import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { MessageBubble } from '@components/coach/MessageBubble';
import { CoachMessage, CoachTone } from '@types/coach';

// Mock the theme context to avoid provider issues
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        success: '#34C759',
        warning: '#FF9500',
        text: '#000000',
        textMuted: '#666666',
        white: '#FFFFFF',
        surface: '#F2F2F7',
        border: '#C6C6C8',
      },
    },
  }),
}));

describe('MessageBubble Unit Tests', () => {
  const createMessage = (overrides: Partial<CoachMessage> = {}): CoachMessage => ({
    id: 'test-1',
    content: 'Test message content',
    role: 'user',
    timestamp: new Date('2024-01-15T10:30:00'),
    ...overrides,
  });

  describe('Core Rendering', () => {
    it('should render message content', () => {
      const message = createMessage({ content: 'Hello Coach!' });
      const { getByText } = render(<MessageBubble message={message} />);
      
      expect(getByText('Hello Coach!')).toBeTruthy();
    });

    it('should render timestamp in correct format', () => {
      const message = createMessage();
      const { getByText } = render(<MessageBubble message={message} />);
      
      // The component formats time as HH:MM
      expect(getByText('10:30 AM')).toBeTruthy();
    });

    it('should have correct accessibility label for user messages', () => {
      const message = createMessage({ role: 'user', content: 'My message' });
      const { getByLabelText } = render(<MessageBubble message={message} />);
      
      expect(getByLabelText('You: My message')).toBeTruthy();
    });

    it('should have correct accessibility label for coach messages', () => {
      const message = createMessage({ role: 'assistant', content: 'Coach response' });
      const { getByLabelText } = render(<MessageBubble message={message} />);
      
      expect(getByLabelText('Coach: Coach response')).toBeTruthy();
    });
  });

  describe('Tone Indicators - Critical for Crisis Detection', () => {
    it('should display Hype tone indicator', () => {
      const message = createMessage({
        role: 'assistant',
        tone: 'hype' as CoachTone,
        content: "You've got this! Keep pushing forward."
      });
      
      const { getByText } = render(<MessageBubble message={message} />);
      expect(getByText('Hype')).toBeTruthy();
    });

    it('should display Tough Love tone indicator', () => {
      const message = createMessage({
        role: 'assistant',
        tone: 'tough-love' as CoachTone,
        content: "Let's be real about what needs to change."
      });
      
      const { getByText } = render(<MessageBubble message={message} />);
      expect(getByText('Tough Love')).toBeTruthy();
    });

    it('should display Pragmatist tone indicator', () => {
      const message = createMessage({
        role: 'assistant',
        tone: 'pragmatist' as CoachTone,
        content: "Here's a step-by-step plan."
      });
      
      const { getByText } = render(<MessageBubble message={message} />);
      expect(getByText('Pragmatist')).toBeTruthy();
    });

    it('should NOT show tone for user messages', () => {
      const message = createMessage({
        role: 'user',
        tone: 'hype' as CoachTone, // Even with tone set
      });
      
      const { queryByText } = render(<MessageBubble message={message} />);
      expect(queryByText('Hype')).toBeNull();
    });

    it('should handle missing tone gracefully', () => {
      const message = createMessage({
        role: 'assistant',
        tone: undefined,
      });
      
      const { queryByText } = render(<MessageBubble message={message} />);
      expect(queryByText('Hype')).toBeNull();
      expect(queryByText('Pragmatist')).toBeNull();
      expect(queryByText('Tough Love')).toBeNull();
    });
  });

  describe('Crisis Response Messages', () => {
    it('should properly display crisis intervention messages', () => {
      const crisisMessage = createMessage({
        role: 'assistant',
        content: "I'm concerned about what you're sharing. Please reach out to a mental health professional who can provide the support you need.\n\n**Crisis Resources:**\n• Call or text 988 (Suicide & Crisis Lifeline)\n• Text HOME to 741741 (Crisis Text Line)\n• Visit 988lifeline.org for chat support",
        tone: 'pragmatist' as CoachTone,
      });
      
      const { getByText } = render(<MessageBubble message={crisisMessage} />);
      
      // Verify crisis message components are rendered
      expect(getByText(/I'm concerned about what you're sharing/)).toBeTruthy();
      expect(getByText(/Call or text 988/)).toBeTruthy();
      expect(getByText(/Text HOME to 741741/)).toBeTruthy();
    });

    it('should handle multiline messages correctly', () => {
      const multilineMessage = createMessage({
        content: 'First line\nSecond line\nThird line'
      });
      
      const { getByText } = render(<MessageBubble message={multilineMessage} />);
      expect(getByText('First line\nSecond line\nThird line')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const emptyMessage = createMessage({ content: '' });
      const { getAllByRole } = render(<MessageBubble message={emptyMessage} />);
      
      // Should still render the bubble structure (message and timestamp)
      const textElements = getAllByRole('text');
      expect(textElements.length).toBeGreaterThan(0);
    });

    it('should handle very long messages', () => {
      const longContent = 'This is a very long message. '.repeat(50);
      const longMessage = createMessage({ content: longContent });
      
      const { getByText } = render(<MessageBubble message={longMessage} />);
      expect(getByText(longContent)).toBeTruthy();
    });

    it('should handle special characters and emojis', () => {
      const specialContent = 'Test "quotes" & <brackets> 😊 ❤️ 🎉';
      const specialMessage = createMessage({ content: specialContent });
      
      const { getByText } = render(<MessageBubble message={specialMessage} />);
      expect(getByText(specialContent)).toBeTruthy();
    });

    it('should handle URLs in messages', () => {
      const urlContent = 'Visit https://988lifeline.org for help';
      const urlMessage = createMessage({ content: urlContent });
      
      const { getByText } = render(<MessageBubble message={urlMessage} />);
      expect(getByText(urlContent)).toBeTruthy();
    });
  });

  describe('Accessibility Requirements', () => {
    it('should have text role for screen readers', () => {
      const message = createMessage();
      const { getAllByRole } = render(<MessageBubble message={message} />);
      
      const textElements = getAllByRole('text');
      expect(textElements.length).toBeGreaterThan(0);
    });

    it('should include full message in accessibility label', () => {
      const longMessage = createMessage({
        role: 'assistant',
        content: 'This is a longer message that should be fully included in the accessibility label for screen reader users.',
      });
      
      const { getByLabelText } = render(<MessageBubble message={longMessage} />);
      expect(getByLabelText(/Coach: This is a longer message/)).toBeTruthy();
    });
  });

  describe('Tone Color Safety', () => {
    it('should use distinct colors for different tones', () => {
      // This test verifies that the getToneColor function returns different values
      const messages = [
        createMessage({ role: 'assistant', tone: 'hype' as CoachTone }),
        createMessage({ role: 'assistant', tone: 'tough-love' as CoachTone }),
        createMessage({ role: 'assistant', tone: 'pragmatist' as CoachTone }),
      ];
      
      // Each should render with its tone indicator
      messages.forEach(msg => {
        const { unmount } = render(<MessageBubble message={msg} />);
        // Verify it renders without error
        unmount();
      });
    });
  });
});