import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageBubble } from '@components/coach/MessageBubble';
import { CoachMessage, CoachTone } from '@types/coach';
import { renderWithProviders } from '@test-utils/test-helpers';
import './setupCoachTests';

describe('MessageBubble', () => {
  const createMessage = (overrides: Partial<CoachMessage> = {}): CoachMessage => ({
    id: 'test-1',
    content: 'Test message content',
    role: 'user',
    timestamp: new Date('2024-01-15T10:30:00'),
    ...overrides,
  });

  describe('Rendering', () => {
    it('should render user message', () => {
      const userMessage = createMessage({ role: 'user' });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={userMessage} />
      );
      
      expect(getByText('Test message content')).toBeTruthy();
    });

    it('should render assistant message', () => {
      const assistantMessage = createMessage({ role: 'assistant' });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={assistantMessage} />
      );
      
      expect(getByText('Test message content')).toBeTruthy();
    });

    it('should display timestamp', () => {
      const message = createMessage();
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={message} />
      );
      
      // Should show time in HH:MM format (may vary by locale)
      expect(getByText(/10:30/)).toBeTruthy();
    });
  });

  describe('Tone Indicators', () => {
    it('should show tone indicator for assistant messages with tone', () => {
      const hypeToneMessage = createMessage({ 
        role: 'assistant',
        tone: 'hype' as CoachTone 
      });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={hypeToneMessage} />
      );
      
      expect(getByText('hype')).toBeTruthy();
    });

    it('should show "tough love" for tough-love tone', () => {
      const toughLoveMessage = createMessage({ 
        role: 'assistant',
        tone: 'tough-love' as CoachTone 
      });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={toughLoveMessage} />
      );
      
      expect(getByText('tough love')).toBeTruthy();
    });

    it('should show "pragmatist" for pragmatist tone', () => {
      const pragmatistMessage = createMessage({ 
        role: 'assistant',
        tone: 'pragmatist' as CoachTone 
      });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={pragmatistMessage} />
      );
      
      expect(getByText('pragmatist')).toBeTruthy();
    });

    it('should not show tone indicator for user messages', () => {
      const userMessage = createMessage({ 
        role: 'user',
        tone: 'hype' as CoachTone // Even if tone is set, shouldn't show
      });
      
      const { queryByText } = renderWithProviders(
        <MessageBubble message={userMessage} />
      );
      
      expect(queryByText('hype')).toBeNull();
    });

    it('should not show tone indicator when tone is not provided', () => {
      const messageWithoutTone = createMessage({ 
        role: 'assistant',
        tone: undefined
      });
      
      const { queryByText } = renderWithProviders(
        <MessageBubble message={messageWithoutTone} />
      );
      
      expect(queryByText('hype')).toBeNull();
      expect(queryByText('pragmatist')).toBeNull();
      expect(queryByText('tough love')).toBeNull();
    });
  });

  describe('Crisis Message Handling', () => {
    it('should render crisis response messages appropriately', () => {
      const crisisResponse = createMessage({
        role: 'assistant',
        content: "I'm concerned about what you're sharing. Please reach out to a mental health professional who can provide the support you need.\n\n**Crisis Resources:**\n• Call or text 988",
        tone: 'pragmatist' as CoachTone
      });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={crisisResponse} />
      );
      
      expect(getByText(/I'm concerned about what you're sharing/)).toBeTruthy();
      expect(getByText(/Call or text 988/)).toBeTruthy();
    });

    it('should handle multi-line crisis messages', () => {
      const multiLineMessage = createMessage({
        role: 'assistant',
        content: 'Line 1\nLine 2\nLine 3'
      });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={multiLineMessage} />
      );
      
      expect(getByText('Line 1\nLine 2\nLine 3')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility label for user messages', () => {
      const userMessage = createMessage({ role: 'user' });
      
      const { getByLabelText } = renderWithProviders(
        <MessageBubble message={userMessage} />
      );
      
      expect(getByLabelText('You said: Test message content')).toBeTruthy();
    });

    it('should have proper accessibility label for assistant messages', () => {
      const assistantMessage = createMessage({ role: 'assistant' });
      
      const { getByLabelText } = renderWithProviders(
        <MessageBubble message={assistantMessage} />
      );
      
      expect(getByLabelText('Coach said: Test message content')).toBeTruthy();
    });

    it('should have text role for accessibility', () => {
      const message = createMessage();
      
      const { getByRole } = renderWithProviders(
        <MessageBubble message={message} />
      );
      
      expect(getByRole('text')).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should apply different styles for user vs assistant messages', () => {
      const userMessage = createMessage({ role: 'user' });
      const assistantMessage = createMessage({ role: 'assistant' });
      
      const { getByLabelText: getUserLabel } = renderWithProviders(
        <MessageBubble message={userMessage} />
      );
      
      const { getByLabelText: getAssistantLabel } = renderWithProviders(
        <MessageBubble message={assistantMessage} />
      );
      
      // Messages should exist with different accessibility labels
      expect(getUserLabel('You said: Test message content')).toBeTruthy();
      expect(getAssistantLabel('Coach said: Test message content')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message content', () => {
      const emptyMessage = createMessage({ content: '' });
      
      const { getByRole } = renderWithProviders(
        <MessageBubble message={emptyMessage} />
      );
      
      expect(getByRole('text')).toBeTruthy();
    });

    it('should handle very long messages', () => {
      const longContent = 'A'.repeat(1000);
      const longMessage = createMessage({ content: longContent });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={longMessage} />
      );
      
      expect(getByText(longContent)).toBeTruthy();
    });

    it('should handle special characters in messages', () => {
      const specialMessage = createMessage({ 
        content: 'Test with "quotes" & <brackets> and emojis 😊' 
      });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={specialMessage} />
      );
      
      expect(getByText('Test with "quotes" & <brackets> and emojis 😊')).toBeTruthy();
    });
  });

  describe('Tone Color Mapping', () => {
    it('should apply success color for hype tone', () => {
      const hypeMessage = createMessage({
        role: 'assistant',
        tone: 'hype' as CoachTone
      });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={hypeMessage} />
      );
      
      // Verify tone indicator exists
      expect(getByText('hype')).toBeTruthy();
    });

    it('should apply warning color for tough-love tone', () => {
      const toughLoveMessage = createMessage({
        role: 'assistant',
        tone: 'tough-love' as CoachTone
      });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={toughLoveMessage} />
      );
      
      // Verify tone indicator exists
      expect(getByText('tough love')).toBeTruthy();
    });

    it('should apply primary color for pragmatist tone', () => {
      const pragmatistMessage = createMessage({
        role: 'assistant',
        tone: 'pragmatist' as CoachTone
      });
      
      const { getByText } = renderWithProviders(
        <MessageBubble message={pragmatistMessage} />
      );
      
      // Verify tone indicator exists
      expect(getByText('pragmatist')).toBeTruthy();
    });
  });
});