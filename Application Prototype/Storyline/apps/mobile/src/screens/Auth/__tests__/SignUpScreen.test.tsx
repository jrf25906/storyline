/**
 * SignUpScreen Integration Tests
 * Tests user registration flow and validation
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SignUpScreen } from '../SignUpScreen';
import { authService } from '../../../services/auth/authService';

// Mock the authService
jest.mock('../../../services/auth/authService', () => ({
  authService: {
    register: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // If there are buttons, simulate pressing the first one (for success flow)
  if (buttons && buttons[0] && buttons[0].onPress) {
    buttons[0].onPress();
  }
});

describe('SignUpScreen', () => {
  const mockOnSignUp = jest.fn();
  const mockOnNavigateToSignIn = jest.fn();
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSignUpScreen = () => {
    return render(
      <SignUpScreen
        onSignUp={mockOnSignUp}
        onNavigateToSignIn={mockOnNavigateToSignIn}
      />
    );
  };

  describe('UI Elements', () => {
    it('should render all required elements', () => {
      renderSignUpScreen();

      // Header elements
      expect(screen.getByText('Create Account')).toBeTruthy();
      expect(screen.getByText('Start sharing your story')).toBeTruthy();

      // Form elements
      expect(screen.getByText('Display Name')).toBeTruthy();
      expect(screen.getByPlaceholderText('How should we call you?')).toBeTruthy();
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('At least 6 characters')).toBeTruthy();
      expect(screen.getByText('Confirm Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('Re-enter your password')).toBeTruthy();

      // Checkbox and terms
      expect(screen.getByText('I agree to the Terms of Service and Privacy Policy')).toBeTruthy();

      // Buttons
      expect(screen.getByText('Create Account')).toBeTruthy();
      expect(screen.getByText('Already have an account? Sign In')).toBeTruthy();

      // Privacy section
      expect(screen.getByText('Your Privacy Matters')).toBeTruthy();
      expect(screen.getByText(/Your stories are encrypted and private/)).toBeTruthy();
    });

    it('should have correct input properties', () => {
      renderSignUpScreen();

      const displayNameInput = screen.getByPlaceholderText('How should we call you?');
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('At least 6 characters');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-enter your password');

      // Display name properties
      expect(displayNameInput.props.autoCapitalize).toBe('words');
      expect(displayNameInput.props.autoCorrect).toBe(false);

      // Email input properties
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.autoCorrect).toBe(false);

      // Password input properties
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(passwordInput.props.autoCapitalize).toBe('none');
      expect(passwordInput.props.autoCorrect).toBe(false);

      // Confirm password properties
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.autoCapitalize).toBe('none');
      expect(confirmPasswordInput.props.autoCorrect).toBe(false);
    });
  });

  describe('Form Interactions', () => {
    it('should update all input values', () => {
      renderSignUpScreen();

      const displayNameInput = screen.getByPlaceholderText('How should we call you?');
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('At least 6 characters');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-enter your password');

      fireEvent.changeText(displayNameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      expect(displayNameInput.props.value).toBe('Test User');
      expect(emailInput.props.value).toBe('test@example.com');
      expect(passwordInput.props.value).toBe('password123');
      expect(confirmPasswordInput.props.value).toBe('password123');
    });

    it('should toggle password visibility for both password fields', () => {
      renderSignUpScreen();

      const passwordInput = screen.getByPlaceholderText('At least 6 characters');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-enter your password');
      const eyeButton = screen.getByText('👁‍🗨');

      // Initially passwords should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);

      // Tap eye button to show passwords
      fireEvent.press(eyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(false);
      expect(screen.getByText('👁')).toBeTruthy();

      // Tap again to hide passwords
      fireEvent.press(screen.getByText('👁'));
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    });

    it('should toggle terms agreement checkbox', () => {
      renderSignUpScreen();

      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      const checkbox = termsContainer!.children[0];

      // Initially unchecked
      expect(screen.queryByText('✓')).toBeNull();

      // Tap to check
      fireEvent.press(termsContainer!);
      expect(screen.getByText('✓')).toBeTruthy();

      // Tap to uncheck
      fireEvent.press(termsContainer!);
      expect(screen.queryByText('✓')).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty fields', () => {
      renderSignUpScreen();

      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Please fill in all fields'
      );
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should show error for invalid email', () => {
      renderSignUpScreen();

      // Fill in all fields but with invalid email
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'invalid-email');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');
      
      // Check terms
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);

      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Please enter a valid email address'
      );
    });

    it('should show error for short password', () => {
      renderSignUpScreen();

      // Fill in all fields but with short password
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), '12345');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), '12345');
      
      // Check terms
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);

      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Password must be at least 6 characters'
      );
    });

    it('should show error for mismatched passwords', () => {
      renderSignUpScreen();

      // Fill in all fields but with mismatched passwords
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password456');
      
      // Check terms
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);

      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Passwords do not match'
      );
    });

    it('should show error when terms are not agreed', () => {
      renderSignUpScreen();

      // Fill in all fields but don't check terms
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');

      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Please agree to the terms and privacy policy'
      );
    });
  });

  describe('Sign Up Flow', () => {
    const fillValidForm = () => {
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');
      
      // Check terms
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);
    };

    it('should successfully create account with valid data', async () => {
      mockAuthService.register.mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });

      renderSignUpScreen();
      fillValidForm();

      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'Test User'
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          'Welcome to Storyline!',
          "Your account has been created. Let's start writing your story.",
          [{ text: 'Get Started', onPress: mockOnSignUp }]
        );
        expect(mockOnSignUp).toHaveBeenCalled();
      });
    });

    it('should show loading state during registration', async () => {
      // Mock a delayed response
      mockAuthService.register.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderSignUpScreen();
      fillValidForm();

      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      // Should show loading spinner
      expect(screen.getByTestId('activity-indicator')).toBeTruthy();
      
      // Should disable inputs
      expect(screen.getByPlaceholderText('How should we call you?').props.editable).toBe(false);
      expect(screen.getByPlaceholderText('your@email.com').props.editable).toBe(false);
      expect(screen.getByPlaceholderText('At least 6 characters').props.editable).toBe(false);
      expect(screen.getByPlaceholderText('Re-enter your password').props.editable).toBe(false);

      await waitFor(() => {
        expect(screen.queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('should handle registration error', async () => {
      const errorMessage = 'Email already in use';
      mockAuthService.register.mockRejectedValue(new Error(errorMessage));

      renderSignUpScreen();
      fillValidForm();

      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Sign Up Failed', errorMessage);
        expect(mockOnSignUp).not.toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to sign in screen', () => {
      renderSignUpScreen();

      const signInButton = screen.getByText('Already have an account? Sign In');
      fireEvent.press(signInButton);

      expect(mockOnNavigateToSignIn).toHaveBeenCalled();
    });

    it('should disable navigation during loading', async () => {
      mockAuthService.register.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderSignUpScreen();

      // Fill form and start registration
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'Test User');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');
      
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);

      const createAccountButton = screen.getByText('Create Account');
      fireEvent.press(createAccountButton);

      // Navigation should be disabled
      const signInButton = screen.getByText('Already have an account? Sign In');
      const termsCheckbox = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      
      expect(signInButton.props.disabled).toBe(true);
      expect(termsCheckbox!.props.disabled).toBe(true);

      await waitFor(() => {
        expect(signInButton.props.disabled).toBe(false);
        expect(termsCheckbox!.props.disabled).toBe(false);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure and accessibility', () => {
      renderSignUpScreen();

      // Check that all form elements are accessible
      expect(screen.getByPlaceholderText('How should we call you?')).toBeTruthy();
      expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
      expect(screen.getByPlaceholderText('At least 6 characters')).toBeTruthy();
      expect(screen.getByPlaceholderText('Re-enter your password')).toBeTruthy();
      
      // Check buttons are accessible
      expect(screen.getByText('Create Account')).toBeTruthy();
      expect(screen.getByText('Already have an account? Sign In')).toBeTruthy();
      
      // Check terms checkbox is accessible
      expect(screen.getByText('I agree to the Terms of Service and Privacy Policy')).toBeTruthy();
    });

    it('should show proper privacy information', () => {
      renderSignUpScreen();

      expect(screen.getByText('Your Privacy Matters')).toBeTruthy();
      expect(screen.getByText(/Your stories are encrypted and private/)).toBeTruthy();
      expect(screen.getByText(/You control who sees your content/)).toBeTruthy();
      expect(screen.getByText(/We never share your personal data/)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle edge case with spaces in inputs', () => {
      renderSignUpScreen();

      // Try with spaces around inputs
      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), '  Test User  ');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), '  test@example.com  ');
      fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');
      
      const termsContainer = screen.getByText('I agree to the Terms of Service and Privacy Policy').parent;
      fireEvent.press(termsContainer!);

      // Should still have the values (trimming is typically handled by backend)
      expect(screen.getByPlaceholderText('How should we call you?').props.value).toBe('  Test User  ');
      expect(screen.getByPlaceholderText('your@email.com').props.value).toBe('  test@example.com  ');
    });

    it('should handle special characters in display name', () => {
      renderSignUpScreen();

      fireEvent.changeText(screen.getByPlaceholderText('How should we call you?'), 'José María');
      
      expect(screen.getByPlaceholderText('How should we call you?').props.value).toBe('José María');
    });
  });
});