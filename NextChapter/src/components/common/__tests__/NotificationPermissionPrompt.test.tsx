import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationPermissionPrompt } from '../NotificationPermissionPrompt';
import { notificationService } from '../../../services/notifications/notificationService';

jest.mock('../../../services/notifications/notificationService');

describe('NotificationPermissionPrompt', () => {
  const mockOnAllow = jest.fn();
  const mockOnDeny = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display empathetic messaging', () => {
    const { getByText } = render(
      <NotificationPermissionPrompt
        onAllow={mockOnAllow}
        onDeny={mockOnDeny}
      />
    );

    expect(getByText('Stay on Track with Gentle Reminders')).toBeTruthy();
    expect(getByText(/We\'ll send helpful reminders/)).toBeTruthy();
  });

  it('should list benefits of notifications', () => {
    const { getByText } = render(
      <NotificationPermissionPrompt
        onAllow={mockOnAllow}
        onDeny={mockOnDeny}
      />
    );

    expect(getByText('Daily task reminders at 9 AM')).toBeTruthy();
    expect(getByText('Job application follow-ups')).toBeTruthy();
    expect(getByText('Budget alerts when needed')).toBeTruthy();
    expect(getByText('Optional mood check-ins')).toBeTruthy();
  });

  it('should request permissions when Allow pressed', async () => {
    (notificationService.requestPermissions as jest.Mock).mockResolvedValue(true);

    const { getByText } = render(
      <NotificationPermissionPrompt
        onAllow={mockOnAllow}
        onDeny={mockOnDeny}
      />
    );

    const allowButton = getByText('Allow Notifications');
    fireEvent.press(allowButton);

    await waitFor(() => {
      expect(notificationService.requestPermissions).toHaveBeenCalled();
      expect(mockOnAllow).toHaveBeenCalled();
    });
  });

  it('should handle permission denial', async () => {
    (notificationService.requestPermissions as jest.Mock).mockResolvedValue(false);

    const { getByText } = render(
      <NotificationPermissionPrompt
        onAllow={mockOnAllow}
        onDeny={mockOnDeny}
      />
    );

    const allowButton = getByText('Allow Notifications');
    fireEvent.press(allowButton);

    await waitFor(() => {
      expect(notificationService.requestPermissions).toHaveBeenCalled();
      expect(mockOnDeny).toHaveBeenCalled();
    });
  });

  it('should call onDeny when Maybe Later is pressed', () => {
    const { getByText } = render(
      <NotificationPermissionPrompt
        onAllow={mockOnAllow}
        onDeny={mockOnDeny}
      />
    );

    const denyButton = getByText('Maybe Later');
    fireEvent.press(denyButton);

    expect(mockOnDeny).toHaveBeenCalled();
  });

  it('should show loading state while requesting permissions', async () => {
    (notificationService.requestPermissions as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(true), 100))
    );

    const { getByText, getByTestId } = render(
      <NotificationPermissionPrompt
        onAllow={mockOnAllow}
        onDeny={mockOnDeny}
      />
    );

    const allowButton = getByText('Allow Notifications');
    fireEvent.press(allowButton);

    await waitFor(() => {
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  it('should be accessible', () => {
    const { getByText } = render(
      <NotificationPermissionPrompt
        onAllow={mockOnAllow}
        onDeny={mockOnDeny}
      />
    );

    const allowButton = getByText('Allow Notifications');
    expect(allowButton.props.accessibilityRole).toBe('button');
    expect(allowButton.props.accessibilityLabel).toBe('Allow notification permissions');

    const denyButton = getByText('Maybe Later');
    expect(denyButton.props.accessibilityRole).toBe('button');
    expect(denyButton.props.accessibilityLabel).toBe('Deny notification permissions for now');
  });

  it('should display privacy assurance', () => {
    const { getByText } = render(
      <NotificationPermissionPrompt
        onAllow={mockOnAllow}
        onDeny={mockOnDeny}
      />
    );

    expect(getByText(/You can change this anytime/)).toBeTruthy();
  });
});