import { CoachTone } from '../types/coach';

/**
 * Get accessible label for tone indicator
 */
export const getToneAccessibilityLabel = (tone: CoachTone): string => {
  switch (tone) {
    case 'hype':
      return 'Encouraging and energetic response';
    case 'tough-love':
      return 'Direct and challenging response';
    case 'pragmatist':
      return 'Practical and straightforward response';
    default:
      return 'Coach response';
  }
};

/**
 * Format message for screen readers
 */
export const formatMessageForScreenReader = (
  role: 'user' | 'assistant',
  content: string,
  tone?: CoachTone
): string => {
  const speaker = role === 'user' ? 'You said' : 'Coach replied';
  const toneInfo = tone ? ` in ${tone === 'tough-love' ? 'tough love' : tone} tone` : '';
  return `${speaker}${toneInfo}: ${content}`;
};

/**
 * Get color for tone indicator (accessible contrast)
 */
export const getToneColor = (tone: CoachTone, isDark: boolean): string => {
  // These colors meet WCAG AA standards for contrast
  const colors = {
    light: {
      hype: '#059669', // Green 600
      'tough-love': '#DC2626', // Red 600
      pragmatist: '#2563EB', // Blue 600
    },
    dark: {
      hype: '#34D399', // Green 400
      'tough-love': '#F87171', // Red 400
      pragmatist: '#60A5FA', // Blue 400
    },
  };
  
  return isDark ? colors.dark[tone] : colors.light[tone];
};

/**
 * Check if message contains sensitive content that should be masked
 */
export const containsSensitiveInfo = (message: string): boolean => {
  // SSN pattern
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;
  // Credit card pattern (basic)
  const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
  // Phone number pattern
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
  
  return ssnPattern.test(message) || ccPattern.test(message) || phonePattern.test(message);
};

/**
 * Mask sensitive information in messages
 */
export const maskSensitiveInfo = (message: string): string => {
  return message
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REMOVED]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD NUMBER REMOVED]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE REMOVED]');
};

/**
 * Get remaining messages for the day
 */
export const getRemainingMessages = (messagesUsed: number, limit: number): string => {
  const remaining = limit - messagesUsed;
  
  if (remaining <= 0) {
    return 'Daily limit reached';
  } else if (remaining === 1) {
    return '1 message remaining today';
  } else if (remaining <= 3) {
    return `Only ${remaining} messages remaining today`;
  } else {
    return `${remaining} messages remaining today`;
  }
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const messageDate = new Date(date);
  
  // If today, show time
  if (now.toDateString() === messageDate.toDateString()) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === messageDate.toDateString()) {
    return 'Yesterday';
  }
  
  // Otherwise show date
  return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};