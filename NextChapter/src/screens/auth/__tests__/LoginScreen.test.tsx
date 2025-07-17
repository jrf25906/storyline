import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../LoginScreen';
import { AuthProvider } from '../../../context/AuthContext';
import { ThemeProvider } from '../../../context/ThemeContext';
import * as authHook from '../../../hooks/useAuth';

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock the auth hook
jest.mock('../../../hooks/useAuth');

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <ThemeProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
};

describe('LoginScreen', () => {
  const mockSignIn = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (authHook.useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      isLoading: false,
      error: null,
      loading: false,
    });
  });

  it('renders correctly', () => {
    const { getByText, getByLabelText } = renderWithProviders(<LoginScreen />);
    
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('We\'re here to help you get back on track')).toBeTruthy();
    expect(getByLabelText('Email address')).toBeTruthy();
    expect(getByLabelText('Password')).toBeTruthy();
  });

  it('shows validation error for invalid email', async () => {
    const { getByLabelText, getByText, queryByText } = renderWithProviders(<LoginScreen />);
    
    const emailInput = getByLabelText('Email address');
    const signInButton = getByText('Sign In');
    
    // Try to submit with invalid email
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(queryByText('Please check your email address format')).toBeTruthy();
    });
    
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows validation error for empty password', async () => {
    const { getByLabelText, getByText, queryByText } = renderWithProviders(<LoginScreen />);
    
    const emailInput = getByLabelText('Email address');
    const signInButton = getByText('Sign In');
    
    // Enter valid email but no password
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(queryByText('Please enter a password')).toBeTruthy();
    });
    
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('clears validation errors when user types', async () => {
    const { getByLabelText, getByText, queryByText } = renderWithProviders(<LoginScreen />);
    
    const emailInput = getByLabelText('Email address');
    const signInButton = getByText('Sign In');
    
    // Trigger validation error
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(queryByText('Please enter your email address')).toBeTruthy();
    });
    
    // Start typing - error should clear
    fireEvent.changeText(emailInput, 't');
    
    await waitFor(() => {
      expect(queryByText('Please enter your email address')).toBeNull();
    });
  });

  it('calls signIn with valid credentials', async () => {
    const { getByLabelText, getByText } = renderWithProviders(<LoginScreen />);
    
    const emailInput = getByLabelText('Email address');
    const passwordInput = getByLabelText('Password');
    const signInButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state during sign in', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const { getByLabelText, getByText, queryByText } = renderWithProviders(<LoginScreen />);
    
    const emailInput = getByLabelText('Email address');
    const passwordInput = getByLabelText('Password');
    const signInButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);
    
    // Should show loading state
    expect(queryByText('Signing In...')).toBeTruthy();
    expect(queryByText('Signing you in...')).toBeTruthy(); // Loading overlay
    
    await waitFor(() => {
      expect(queryByText('Signing In...')).toBeNull();
    });
  });

  it('displays auth errors from context', () => {
    (authHook.useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      isLoading: false,
      error: 'Invalid login credentials',
      loading: false,
    });
    
    const { queryByText } = renderWithProviders(<LoginScreen />);
    
    expect(queryByText('Email or password doesn\'t match our records. Please try again.')).toBeTruthy();
  });

  it('navigates to signup screen', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    
    fireEvent.press(getByText('Don\'t have an account? Sign up'));
    
    expect(mockNavigate).toHaveBeenCalledWith('SignupScreen');
  });

  it('navigates to forgot password screen', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    
    fireEvent.press(getByText('Forgot password?'));
    
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPasswordScreen');
  });

  it('has proper accessibility attributes', () => {
    const { getByRole, getAllByRole } = renderWithProviders(<LoginScreen />);
    
    expect(getByRole('button')).toBeTruthy();
    expect(getAllByRole('link')).toHaveLength(2); // Forgot password and Sign up links
  });

  it('handles keyboard navigation correctly', () => {
    const { getByLabelText } = renderWithProviders(<LoginScreen />);
    
    const emailInput = getByLabelText('Email address');
    const passwordInput = getByLabelText('Password');
    
    // Mock focus methods
    const focusMock = jest.fn();
    passwordInput.focus = focusMock;
    
    // Simulate pressing next on email input
    fireEvent(emailInput, 'onSubmitEditing');
    
    // Password input should receive focus
    expect(focusMock).toHaveBeenCalled();
  });
});