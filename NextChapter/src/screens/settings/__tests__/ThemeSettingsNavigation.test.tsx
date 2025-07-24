import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '@screens/main/SettingsScreen';
import { ThemeSettingsScreen } from '@screens/settings/ThemeSettingsScreen';

// Mock navigation dependencies
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock the theme context
jest.mock('@context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: { primary: '#FDFCF8', secondary: '#F9F8F5' },
        text: { primary: '#2D5A27', secondary: '#5A7A54', tertiary: '#8A9B8D' },
        surface: '#F9F8F5',
        border: '#E5E7EB',
        primary: '#2D5A27',
        textSecondary: '#5A7A54',
      },
    },
    themeType: 'light',
    setThemeType: jest.fn(),
    isHighContrast: false,
    setIsHighContrast: jest.fn(),
  }),
}));

// Mock error boundary HOC
jest.mock('@components/common', () => ({
  withErrorBoundary: (Component: React.ComponentType) => Component,
  Container: ({ children }: { children: React.ReactNode }) => children,
  DashboardCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="dashboard-card">{title}{children}</div>
  ),
}));

// Mock typography components
jest.mock('@components/common/Typography', () => ({
  H1: ({ children, style }: any) => <div style={style}>{children}</div>,
  H2: ({ children, style }: any) => <div style={style}>{children}</div>,
  Body: ({ children, style }: any) => <div style={style}>{children}</div>,
  BodySM: ({ children, style }: any) => <div style={style}>{children}</div>,
  Caption: ({ children, style }: any) => <div style={style}>{children}</div>,
}));

// Create a test stack navigator
type TestStackParamList = {
  Settings: undefined;
  ThemeSettings: undefined;
};

const TestStack = createNativeStackNavigator<TestStackParamList>();

const TestNavigator = () => (
  <NavigationContainer>
    <TestStack.Navigator>
      <TestStack.Screen name="Settings" component={SettingsScreen} />
      <TestStack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
    </TestStack.Navigator>
  </NavigationContainer>
);

describe('Theme Settings Navigation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Navigation from Settings to Theme Settings', () => {
    it('should render Settings screen with Theme option', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Theme')).toBeTruthy();
      expect(getByText('Choose your preferred app appearance')).toBeTruthy();
    });

    it('should navigate to ThemeSettings when Theme option is pressed', () => {
      const { getByText } = render(<SettingsScreen />);

      const themeOption = getByText('Theme');
      
      act(() => {
        fireEvent.press(themeOption);
      });

      expect(mockNavigate).toHaveBeenCalledWith('ThemeSettings');
    });

    it('should have proper accessibility attributes for Theme option', () => {
      const { getByLabelText } = render(<SettingsScreen />);

      const themeButton = getByLabelText('Theme. Choose your preferred app appearance');
      expect(themeButton.props.accessibilityRole).toBe('button');
    });
  });

  describe('Theme Settings Screen Functionality', () => {
    it('should render all theme options', () => {
      const { getByText } = render(<ThemeSettingsScreen />);

      expect(getByText('Appearance')).toBeTruthy();
      expect(getByText('Dark Mode')).toBeTruthy();
      expect(getByText('Follow System')).toBeTruthy();
      expect(getByText('High Contrast')).toBeTruthy();
    });

    it('should have proper screen structure', () => {
      const { getByText } = render(<ThemeSettingsScreen />);

      // Check section title and description
      expect(getByText('Appearance')).toBeTruthy();
      expect(getByText('Customize how the app looks to support your comfort and accessibility needs.')).toBeTruthy();

      // Check help text
      expect(getByText('Theme changes take effect immediately. Your preference is automatically saved.')).toBeTruthy();
    });
  });

  describe('Settings Screen Structure', () => {
    it('should render all main settings options', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Notifications')).toBeTruthy();
      expect(getByText('Privacy & Security')).toBeTruthy();
      expect(getByText('Theme')).toBeTruthy();
      expect(getByText('Data & Storage')).toBeTruthy();
      expect(getByText('Help & Support')).toBeTruthy();
    });

    it('should render app information section', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Next Chapter')).toBeTruthy();
      expect(getByText('Version 1.0.0')).toBeTruthy();
      expect(getByText('Your career transition companion')).toBeTruthy();
    });

    it('should have proper screen title and description', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Customize your app experience')).toBeTruthy();
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide proper navigation context for screen readers', () => {
      const { getByLabelText } = render(<SettingsScreen />);

      // Check that theme option has proper accessibility labeling
      const themeOption = getByLabelText('Theme. Choose your preferred app appearance');
      expect(themeOption).toBeTruthy();
    });

    it('should maintain focus management in theme settings', () => {
      const { getByLabelText } = render(<ThemeSettingsScreen />);

      const darkModeToggle = getByLabelText('Toggle dark mode');
      const systemToggle = getByLabelText('Follow system theme');
      const highContrastToggle = getByLabelText('Toggle high contrast');

      expect(darkModeToggle.props.accessibilityRole).toBe('switch');
      expect(systemToggle.props.accessibilityRole).toBe('switch');
      expect(highContrastToggle.props.accessibilityRole).toBe('switch');
    });
  });

  describe('User Experience Flow', () => {
    it('should provide clear navigation path for theme customization', () => {
      // Test the complete user flow
      const settingsScreen = render(<SettingsScreen />);
      
      // User sees theme option in settings
      expect(settingsScreen.getByText('Theme')).toBeTruthy();
      expect(settingsScreen.getByText('Choose your preferred app appearance')).toBeTruthy();

      // User can access theme settings
      const themeOption = settingsScreen.getByText('Theme');
      act(() => {
        fireEvent.press(themeOption);
      });

      expect(mockNavigate).toHaveBeenCalledWith('ThemeSettings');

      // Theme settings provides full customization
      const themeScreen = render(<ThemeSettingsScreen />);
      expect(themeScreen.getByText('Dark Mode')).toBeTruthy();
      expect(themeScreen.getByText('Follow System')).toBeTruthy();
      expect(themeScreen.getByText('High Contrast')).toBeTruthy();
    });

    it('should provide supportive messaging throughout the flow', () => {
      const settingsScreen = render(<SettingsScreen />);
      expect(settingsScreen.getByText('Customize your app experience')).toBeTruthy();

      const themeScreen = render(<ThemeSettingsScreen />);
      expect(themeScreen.getByText('Customize how the app looks to support your comfort and accessibility needs.')).toBeTruthy();
      expect(themeScreen.getByText('Theme changes take effect immediately. Your preference is automatically saved.')).toBeTruthy();
    });
  });
});