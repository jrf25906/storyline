import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { EmailVerificationScreen } from '@screens/auth/EmailVerificationScreen';
import { useAuth } from '@hooks/useAuth';
import { supabase } from '@services/api/supabase';
import { logAnalyticsEvent } from '@utils/analytics';
import { SafeThemeProvider } from '@components/common/SafeThemeProvider';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../services/api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      resend: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));
jest.mock('../../../utils/analytics');

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('EmailVerificationScreen', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    email_confirmed_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });
    
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderScreen = () => {
    return render(
      <SafeThemeProvider>
        <NavigationContainer>
          <EmailVerificationScreen />
        </NavigationContainer>
      </SafeThemeProvider>
    );
  };

  it('should render email verification screen', () => {
    const { getByText } = renderScreen();

    expect(getByText('Verify Your Email')).toBeTruthy();
    expect(getByText('We\'ve sent a verification link to:')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('should check email verification status on mount', async () => {
    renderScreen();

    await waitFor(() => {
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });
  });

  it('should poll for verification status', async () => {
    renderScreen();

    // Fast-forward 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(2);
    });

    // Fast-forward another 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(3);
    });
  });

  it('should show success and navigate when email is verified', async () => {
    const verifiedUser = {
      ...mockUser,
      email_confirmed_at: '2024-01-01T00:00:00Z',
    };
    
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: verifiedUser },
    });

    renderScreen();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Verified!',
        'Your email has been successfully verified. You can now access all features.',
        expect.any(Array)
      );
      expect(logAnalyticsEvent).toHaveBeenCalledWith('email_verified', { email: 'test@example.com' });
    });

    // Simulate pressing Continue button
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const continueButton = alertCall[2][0];
    continueButton.onPress();

    expect(mockNavigate).toHaveBeenCalledWith('Onboarding');
  });

  it('should handle resend email', async () => {
    (supabase.auth.resend as jest.Mock).mockResolvedValue({ error: null });

    const { getByText } = renderScreen();

    fireEvent.press(getByText('Resend Verification Email'));

    await waitFor(() => {
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email Sent',
        'A new verification email has been sent. Please check your inbox and spam folder.',
        expect.any(Array)
      );
      expect(logAnalyticsEvent).toHaveBeenCalledWith('verification_email_resent', {
        email: 'test@example.com',
      });
    });
  });

  it('should show resend cooldown', async () => {
    (supabase.auth.resend as jest.Mock).mockResolvedValue({ error: null });

    const { getByText } = renderScreen();

    fireEvent.press(getByText('Resend Verification Email'));

    await waitFor(() => {
      expect(getByText('Resend in 60s')).toBeTruthy();
    });

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(getByText('Resend in 30s')).toBeTruthy();
    });

    // Fast-forward remaining 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(getByText('Resend Verification Email')).toBeTruthy();
    });
  });

  it('should handle resend email error', async () => {
    (supabase.auth.resend as jest.Mock).mockResolvedValue({
      error: new Error('Network error'),
    });

    const { getByText } = renderScreen();

    fireEvent.press(getByText('Resend Verification Email'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to resend verification email. Please try again later.',
        expect.any(Array)
      );
    });
  });

  it('should handle change email', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    const { getByText } = renderScreen();

    fireEvent.press(getByText('Wrong email? Change it'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Change Email',
        'Are you sure you want to change your email address? You will need to sign up again.',
        expect.any(Array)
      );
    });

    // Simulate pressing Change Email button
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const changeEmailButton = alertCall[2][1];
    await changeEmailButton.onPress();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('SignupScreen');
  });

  it('should display tips section', () => {
    const { getByText } = renderScreen();

    expect(getByText('Can\'t find the email?')).toBeTruthy();
    expect(getByText(/Check your spam or junk folder/)).toBeTruthy();
    expect(getByText(/Add noreply@nextchapter.app to your contacts/)).toBeTruthy();
    expect(getByText(/Wait a few minutes and try resending/)).toBeTruthy();
  });

  it('should show loading state during initial verification check', () => {
    const { getByText } = renderScreen();

    expect(getByText('Checking verification status...')).toBeTruthy();
  });

  it('should show verified UI when already verified', async () => {
    const verifiedUser = {
      ...mockUser,
      email_confirmed_at: '2024-01-01T00:00:00Z',
    };
    
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: verifiedUser },
    });

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Email Verified!')).toBeTruthy();
      expect(getByText('Your email has been successfully verified.')).toBeTruthy();
    });
  });

  it('should disable resend button during resend process', async () => {
    (supabase.auth.resend as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 1000))
    );

    const { getByText } = renderScreen();
    const resendButton = getByText('Resend Verification Email');

    fireEvent.press(resendButton);

    // Button should be disabled while resending
    expect(resendButton.parent?.props.disabled).toBe(true);
  });
});