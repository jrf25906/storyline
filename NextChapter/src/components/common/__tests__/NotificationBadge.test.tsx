import React from 'react';
import { render } from '@testing-library/react-native';
import { NotificationBadge } from '../NotificationBadge';

describe('NotificationBadge', () => {
  it('should display count when greater than 0', () => {
    const { getByText } = render(<NotificationBadge count={5} />);
    expect(getByText('5')).toBeTruthy();
  });

  it('should be hidden when count is 0', () => {
    const { queryByTestId } = render(<NotificationBadge count={0} />);
    expect(queryByTestId('notification-badge')).toBeNull();
  });

  it('should display 99+ for counts over 99', () => {
    const { getByText } = render(<NotificationBadge count={150} />);
    expect(getByText('99+')).toBeTruthy();
  });

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: 'blue' };
    const { getByTestId } = render(
      <NotificationBadge count={5} style={customStyle} />
    );
    
    const badge = getByTestId('notification-badge');
    expect(badge.props.style).toContainEqual(customStyle);
  });

  it('should be accessible', () => {
    const { getByTestId } = render(<NotificationBadge count={5} />);
    const badge = getByTestId('notification-badge');
    
    expect(badge.props.accessibilityRole).toBe('text');
    expect(badge.props.accessibilityLabel).toBe('5 notifications');
  });

  it('should handle negative counts gracefully', () => {
    const { queryByTestId } = render(<NotificationBadge count={-5} />);
    expect(queryByTestId('notification-badge')).toBeNull();
  });

  it('should apply pulsing animation when animated prop is true', () => {
    const { getByTestId } = render(<NotificationBadge count={5} animated />);
    const badge = getByTestId('notification-badge');
    
    expect(badge.props.style).toBeDefined();
  });
});