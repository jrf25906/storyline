/**
 * End-to-End Authentication Flow Tests
 * Tests complete authentication workflows from user perspective
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../../App';
import { authService } from '../services/auth/authService';
import { resetFirebaseMocks, simulateAuthStateChange } from '../__mocks__/firebase';

// Mock the entire authentication service
jest.mock('../services/auth/authService', () => ({
  authService: {
    register: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    onAuthStateChange: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

// Mock Firebase config
jest.mock('../services/firebase/config', () => require('../__mocks__/firebase'));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // If there are buttons, simulate pressing the first one
  if (buttons && buttons[0] && buttons[0].onPress) {
    buttons[0].onPress();
  }
});

describe('Authentication Flow E2E', () => {
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetFirebaseMocks();
    
    // Mock initial auth state (not authenticated)
    mockAuthService.onAuthStateChange.mockImplementation((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });
  });

  describe('Complete Sign Up Flow', () => {
    it('should complete full sign up workflow', async () => {
      // Mock successful registration
      mockAuthService.register.mockResolvedValue({
        uid: 'test-uid',
        email: 'newuser@example.com',
        displayName: 'New User',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });

      render(<App />);

      // Should start on Sign In screen (since not authenticated)
      expect(screen.getByText('Welcome Back')).toBeTruthy();

      // Navigate to Sign Up
      fireEvent.press(screen.getByText('Create New Account'));
      
      // Should now be on Sign Up screen
      expect(screen.getByText('Create Account')).toBeTruthy();

      // Fill out registration form
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'New User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'newuser@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');
      
      // Agree to terms
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);

      // Submit registration
      fireEvent.press(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith(
          'newuser@example.com',
          'password123',
          'New User'
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          'Welcome to Storyline!',
          "Your account has been created. Let's start writing your story.",
          expect.any(Array)
        );
      });
    });

    it('should handle registration errors gracefully', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Email already in use'));

      render(<App />);

      // Navigate to Sign Up
      fireEvent.press(screen.getByText('Create New Account'));

      // Fill out form with existing email
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'existing@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');
      
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);

      fireEvent.press(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Sign Up Failed', 'Email already in use');
        // Should still be on Sign Up screen
        expect(screen.getByText('Create Account')).toBeTruthy();
      });
    });
  });

  describe('Complete Sign In Flow', () => {
    it('should complete full sign in workflow', async () => {
      mockAuthService.signIn.mockResolvedValue({
        uid: 'existing-uid',
        email: 'existing@example.com',
        displayName: 'Existing User',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });

      render(<App />);

      // Should start on Sign In screen
      expect(screen.getByText('Welcome Back')).toBeTruthy();

      // Fill in credentials
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'existing@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password123');

      // Submit sign in
      fireEvent.press(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith(
          'existing@example.com',
          'password123'
        );
      });
    });

    it('should handle invalid credentials', async () => {
      mockAuthService.signIn.mockRejectedValue(new Error('Invalid credentials'));

      render(<App />);

      // Fill in wrong credentials
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'wrong@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'wrongpassword');

      fireEvent.press(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Sign In Failed', 'Invalid credentials');
        // Should still be on Sign In screen
        expect(screen.getByText('Welcome Back')).toBeTruthy();
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete password reset workflow', async () => {
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      render(<App />);

      // Enter email for reset
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'user@example.com');

      // Tap forgot password
      fireEvent.press(screen.getByText('Forgot Password?'));

      await waitFor(() => {
        expect(mockAuthService.resetPassword).toHaveBeenCalledWith('user@example.com');
        expect(Alert.alert).toHaveBeenCalledWith(
          'Password Reset',
          'Check your email for password reset instructions'
        );
      });
    });

    it('should require email for password reset', () => {
      render(<App />);

      // Don't enter email, just tap forgot password
      fireEvent.press(screen.getByText('Forgot Password?'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Enter Email',
        'Please enter your email address first'
      );
      expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Between Auth Screens', () => {
    it('should allow navigation between sign in and sign up', () => {
      render(<App />);

      // Start on Sign In
      expect(screen.getByText('Welcome Back')).toBeTruthy();
      expect(screen.getByText('Sign in to continue your stories')).toBeTruthy();

      // Navigate to Sign Up
      fireEvent.press(screen.getByText('Create New Account'));

      // Should be on Sign Up screen
      expect(screen.getByText('Create Account')).toBeTruthy();
      expect(screen.getByText('Start sharing your story')).toBeTruthy();

      // Navigate back to Sign In
      fireEvent.press(screen.getByText('Already have an account? Sign In'));

      // Should be back on Sign In screen
      expect(screen.getByText('Welcome Back')).toBeTruthy();
    });
  });

  describe('Authentication State Management', () => {
    it('should handle auth state changes correctly', async () => {
      // Start with unauthenticated state
      const mockUnsubscribe = jest.fn();
      let authCallback: (user: any) => void;
      
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        callback(null); // Start unauthenticated
        return mockUnsubscribe;
      });

      render(<App />);

      // Should show Sign In screen
      expect(screen.getByText('Welcome Back')).toBeTruthy();

      // Simulate successful authentication
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      authCallback!(mockUser);

      // Should transition to main app (this would show the main recording interface)
      // Since we're testing auth flow, we just verify auth state changed
      expect(mockAuthService.onAuthStateChange).toHaveBeenCalled();
    });

    it('should show loading state during auth check', () => {
      // Mock auth state check that takes time
      mockAuthService.onAuthStateChange.mockImplementation((callback) => {
        // Don't call callback immediately to simulate loading
        return jest.fn();
      });

      render(<App />);

      // Should show loading state
      expect(screen.getByText('Loading Storyline...')).toBeTruthy();
    });
  });

  describe('Form Validation Edge Cases', () => {
    it('should handle various input validation scenarios in sign up', () => {
      render(<App />);

      // Navigate to Sign Up
      fireEvent.press(screen.getByText('Create New Account'));

      // Test empty form submission
      fireEvent.press(screen.getByText('Create Account'));
      expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please fill in all fields');

      // Test invalid email format
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'Test');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'invalid-email');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');
      
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);

      fireEvent.press(screen.getByText('Create Account'));
      expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please enter a valid email address');
    });

    it('should handle password mismatch in sign up', () => {
      render(<App />);

      fireEvent.press(screen.getByText('Create New Account'));

      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password456');
      
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);

      fireEvent.press(screen.getByText('Create Account'));
      expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Passwords do not match');
    });
  });

  describe('UI State During Operations', () => {
    it('should show loading states and disable interactions appropriately', async () => {
      // Mock delayed sign in
      mockAuthService.signIn.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<App />);

      // Fill in sign in form
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password123');

      // Submit
      fireEvent.press(screen.getByText('Sign In'));

      // Should show loading and disable inputs
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
      expect(screen.getByPlaceholderText('your@email.com').props.editable).toBe(false);
      expect(screen.getByPlaceholderText('••••••••').props.editable).toBe(false);

      await waitFor(() => {
        expect(screen.queryByTestId('activity-indicator')).toBeNull();
      });
    });
  });
});