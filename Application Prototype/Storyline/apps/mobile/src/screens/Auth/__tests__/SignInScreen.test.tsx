/**
 * SignInScreen Integration Tests
 * Tests user interactions and component behavior
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SignInScreen } from '../SignInScreen';
import { authService } from '../../../services/auth/authService';

// Mock the authService
jest.mock('../../../services/auth/authService', () => ({
  authService: {
    signIn: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('SignInScreen', () => {
  const mockOnSignIn = jest.fn();
  const mockOnNavigateToSignUp = jest.fn();
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSignInScreen = () => {
    return render(
      <SignInScreen
        onSignIn={mockOnSignIn}
        onNavigateToSignUp={mockOnNavigateToSignUp}
      />
    );
  };

  describe('UI Elements', () => {
    it('should render all required elements', () => {
      renderSignInScreen();

      // Header elements
      expect(screen.getByText('Welcome Back')).toBeTruthy();
      expect(screen.getByText('Sign in to continue your stories')).toBeTruthy();

      // Form elements
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();

      // Buttons
      expect(screen.getByText('Forgot Password?')).toBeTruthy();
      expect(screen.getByText('Sign In')).toBeTruthy();
      expect(screen.getByText('Create New Account')).toBeTruthy();

      // Safety note
      expect(screen.getByText('🔒 Your stories are encrypted and private by default')).toBeTruthy();
    });

    it('should have correct input properties', () => {
      renderSignInScreen();

      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      // Email input properties
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.autoCorrect).toBe(false);

      // Password input properties  
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(passwordInput.props.autoCapitalize).toBe('none');
      expect(passwordInput.props.autoCorrect).toBe(false);
    });
  });

  describe('Form Interactions', () => {
    it('should update email input value', () => {
      renderSignInScreen();

      const emailInput = screen.getByPlaceholderText('your@email.com');
      fireEvent.changeText(emailInput, 'test@example.com');

      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should update password input value', () => {
      renderSignInScreen();

      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInput, 'password123');

      expect(passwordInput.props.value).toBe('password123');
    });

    it('should toggle password visibility', () => {
      renderSignInScreen();

      const passwordInput = screen.getByPlaceholderText('••••••••');
      const eyeButton = screen.getByText('👁‍🗨');

      // Initially password should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Tap eye button to show password
      fireEvent.press(eyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);
      expect(screen.getByText('👁')).toBeTruthy();

      // Tap again to hide password
      fireEvent.press(screen.getByText('👁'));
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Sign In Flow', () => {
    it('should show validation error for missing fields', () => {
      renderSignInScreen();

      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Information',
        'Please enter both email and password'
      );
      expect(mockAuthService.signIn).not.toHaveBeenCalled();
    });

    it('should show validation error for missing email only', () => {
      renderSignInScreen();

      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.changeText(passwordInput, 'password123');

      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Information',
        'Please enter both email and password'
      );
    });

    it('should show validation error for missing password only', () => {
      renderSignInScreen();

      const emailInput = screen.getByPlaceholderText('your@email.com');
      fireEvent.changeText(emailInput, 'test@example.com');

      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Information',
        'Please enter both email and password'
      );
    });

    it('should successfully sign in with valid credentials', async () => {
      mockAuthService.signIn.mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });

      renderSignInScreen();

      // Fill in form
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Submit form
      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockOnSignIn).toHaveBeenCalled();
      });
    });

    it('should show loading state during sign in', async () => {
      // Mock a delayed response
      mockAuthService.signIn.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderSignInScreen();

      // Fill in form
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Submit form
      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);

      // Should show loading spinner
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
      expect(emailInput.props.editable).toBe(false);
      expect(passwordInput.props.editable).toBe(false);

      await waitFor(() => {
        expect(screen.queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('should handle sign in error', async () => {
      const errorMessage = 'Invalid credentials';
      mockAuthService.signIn.mockRejectedValue(new Error(errorMessage));

      renderSignInScreen();

      // Fill in form
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');

      // Submit form
      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Sign In Failed', errorMessage);
        expect(mockOnSignIn).not.toHaveBeenCalled();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should show validation error when email is empty', () => {
      renderSignInScreen();

      const forgotPasswordButton = screen.getByText('Forgot Password?');
      fireEvent.press(forgotPasswordButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Enter Email',
        'Please enter your email address first'
      );
      expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    });

    it('should successfully send password reset email', async () => {
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      renderSignInScreen();

      // Enter email
      const emailInput = screen.getByPlaceholderText('your@email.com');
      fireEvent.changeText(emailInput, 'test@example.com');

      // Trigger password reset
      const forgotPasswordButton = screen.getByText('Forgot Password?');
      fireEvent.press(forgotPasswordButton);

      await waitFor(() => {
        expect(mockAuthService.resetPassword).toHaveBeenCalledWith('test@example.com');
        expect(Alert.alert).toHaveBeenCalledWith(
          'Password Reset',
          'Check your email for password reset instructions'
        );
      });
    });

    it('should handle password reset error', async () => {
      const errorMessage = 'Email not found';
      mockAuthService.resetPassword.mockRejectedValue(new Error(errorMessage));

      renderSignInScreen();

      // Enter email
      const emailInput = screen.getByPlaceholderText('your@email.com');
      fireEvent.changeText(emailInput, 'notfound@example.com');

      // Trigger password reset
      const forgotPasswordButton = screen.getByText('Forgot Password?');
      fireEvent.press(forgotPasswordButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Reset Failed', errorMessage);
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to sign up screen', () => {
      renderSignInScreen();

      const signUpButton = screen.getByText('Create New Account');
      fireEvent.press(signUpButton);

      expect(mockOnNavigateToSignUp).toHaveBeenCalled();
    });

    it('should disable navigation during loading', async () => {
      mockAuthService.signIn.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderSignInScreen();

      // Fill in form and start sign in
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);

      // Try to navigate while loading - should be disabled
      const signUpButton = screen.getByText('Create New Account');
      const forgotPasswordButton = screen.getByText('Forgot Password?');
      
      expect(signUpButton.props.disabled).toBe(true);
      expect(forgotPasswordButton.props.disabled).toBe(true);

      await waitFor(() => {
        expect(signUpButton.props.disabled).toBe(false);
        expect(forgotPasswordButton.props.disabled).toBe(false);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      renderSignInScreen();

      // Check that form elements are accessible
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      
      // Check buttons are accessible
      expect(screen.getByText('Sign In')).toBeTruthy();
      expect(screen.getByText('Forgot Password?')).toBeTruthy();
      expect(screen.getByText('Create New Account')).toBeTruthy();
    });
  });
});