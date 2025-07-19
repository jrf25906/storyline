import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '@screens/auth/LoginScreen';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@context/ThemeContext';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../context/ThemeContext');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('LoginScreen - Biometric Authentication', () => {
  const mockTheme = {
    colors: {
      background: '#fff',
      text: '#000',
      textSecondary: '#666',
      primary: '#007AFF',
      surface: '#F5F5F5',
      placeholder: '#999',
      border: '#E0E0E0',
    },
  };

  const mockAuthWithBiometric = {
    signIn: jest.fn(),
    isLoading: false,
    error: null,
    isBiometricSupported: true,
    isBiometricEnabled: true,
    biometricType: 'Face ID',
    authenticateWithBiometric: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({ theme: mockTheme });
    (useAuth as jest.Mock).mockReturnValue(mockAuthWithBiometric);
  });

  const renderScreen = () => {
    return render(
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  };

  it('should show biometric authentication option when enabled', () => {
    const { getByText } = renderScreen();

    expect(getByText('OR')).toBeTruthy();
    expect(getByText('Sign in with Face ID')).toBeTruthy();
  });

  it('should not show biometric option when not enabled', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthWithBiometric,
      isBiometricEnabled: false,
    });

    const { queryByText } = renderScreen();

    expect(queryByText('OR')).toBeNull();
    expect(queryByText('Sign in with Face ID')).toBeNull();
  });

  it('should attempt biometric authentication on mount', async () => {
    renderScreen();

    await waitFor(() => {
      expect(mockAuthWithBiometric.authenticateWithBiometric).toHaveBeenCalled();
    });
  });

  it('should handle successful biometric authentication', async () => {
    mockAuthWithBiometric.authenticateWithBiometric.mockResolvedValue(true);

    const { getByText } = renderScreen();
    
    fireEvent.press(getByText('Sign in with Face ID'));

    await waitFor(() => {
      expect(mockAuthWithBiometric.authenticateWithBiometric).toHaveBeenCalled();
    });
  });

  it('should show error on failed biometric authentication', async () => {
    mockAuthWithBiometric.authenticateWithBiometric.mockResolvedValue(false);

    const { getByText } = renderScreen();
    
    fireEvent.press(getByText('Sign in with Face ID'));

    await waitFor(() => {
      expect(getByText('Face ID authentication failed. Please use your password.')).toBeTruthy();
    });
  });

  it('should show authenticating state during biometric auth', async () => {
    let resolveAuth: (value: boolean) => void;
    const authPromise = new Promise<boolean>((resolve) => {
      resolveAuth = resolve;
    });
    
    mockAuthWithBiometric.authenticateWithBiometric.mockReturnValue(authPromise);

    const { getByText } = renderScreen();
    
    fireEvent.press(getByText('Sign in with Face ID'));

    expect(getByText('Authenticating...')).toBeTruthy();

    await waitFor(() => {
      resolveAuth!(true);
    });
  });

  it('should use correct icon for Touch ID', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthWithBiometric,
      biometricType: 'Touch ID',
    });

    const { getByText, UNSAFE_getByProps } = renderScreen();

    expect(getByText('Sign in with Touch ID')).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'finger-print' })).toBeTruthy();
  });

  it('should use correct icon for Face ID', () => {
    const { getByText, UNSAFE_getByProps } = renderScreen();

    expect(getByText('Sign in with Face ID')).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'scan' })).toBeTruthy();
  });

  it('should disable biometric button when signing in with password', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));

    const biometricButton = getByText('Sign in with Face ID').parent;
    expect(biometricButton?.props.disabled).toBe(true);
  });

  it('should disable password sign in when authenticating with biometric', async () => {
    let resolveAuth: (value: boolean) => void;
    const authPromise = new Promise<boolean>((resolve) => {
      resolveAuth = resolve;
    });
    
    mockAuthWithBiometric.authenticateWithBiometric.mockReturnValue(authPromise);

    const { getByText } = renderScreen();
    
    fireEvent.press(getByText('Sign in with Face ID'));

    const signInButton = getByText('Sign In').parent;
    expect(signInButton?.props.disabled).toBe(true);

    await waitFor(() => {
      resolveAuth!(true);
    });
  });

  it('should support different biometric types', () => {
    const biometricTypes = [
      { type: 'Face ID', icon: 'scan' },
      { type: 'Touch ID', icon: 'finger-print' },
      { type: 'Fingerprint', icon: 'finger-print' },
      { type: 'Face Recognition', icon: 'scan' },
    ];

    biometricTypes.forEach(({ type, icon }) => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthWithBiometric,
        biometricType: type,
      });

      const { getByText, UNSAFE_getByProps } = renderScreen();

      expect(getByText(`Sign in with ${type}`)).toBeTruthy();
      expect(UNSAFE_getByProps({ name: icon })).toBeTruthy();
    });
  });
});