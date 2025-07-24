import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeSettingsScreen } from '../ThemeSettingsScreen';

// Mock the theme context
const mockSetThemeType = jest.fn();
const mockSetIsHighContrast = jest.fn();

jest.mock('@context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: { primary: '#FDFCF8', secondary: '#F9F8F5' },
        text: { primary: '#2D5A27', secondary: '#5A7A54', tertiary: '#8A9B8D' },
      },
    },
    themeType: 'light',
    setThemeType: mockSetThemeType,
    isHighContrast: false,
    setIsHighContrast: mockSetIsHighContrast,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

// Mock Typography and Spacing
jest.mock('@theme/typography', () => ({
  Typography: {
    heading: {
      h3: {
        fontSize: 18,
        fontWeight: '600',
      },
    },
    body: {
      medium: {
        fontSize: 16,
        fontWeight: '400',
      },
      small: {
        fontSize: 14,
        fontWeight: '400',
      },
    },
  },
}));

jest.mock('@theme/spacing', () => ({
  Spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
}));

describe('ThemeSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all theme toggle options', () => {
      const { getByText, getByLabelText } = render(<ThemeSettingsScreen />);

      expect(getByText('Appearance')).toBeTruthy();
      expect(getByText('Customize how the app looks to support your comfort and accessibility needs.')).toBeTruthy();
      
      expect(getByLabelText('Toggle dark mode')).toBeTruthy();
      expect(getByText('Dark Mode')).toBeTruthy();
      expect(getByText('Use dark appearance throughout the app')).toBeTruthy();
      
      expect(getByLabelText('Follow system theme')).toBeTruthy();
      expect(getByText('Follow System')).toBeTruthy();
      expect(getByText('Automatically switch based on your device settings')).toBeTruthy();
      
      expect(getByLabelText('Toggle high contrast')).toBeTruthy();
      expect(getByText('High Contrast')).toBeTruthy();
      expect(getByText('Increase contrast for better visibility and accessibility')).toBeTruthy();
      
      expect(getByText('Theme changes take effect immediately. Your preference is automatically saved.')).toBeTruthy();
    });

    it('should apply correct theme colors to components', () => {
      const { getByText } = render(<ThemeSettingsScreen />);

      const title = getByText('Appearance');
      expect(title.props.style).toMatchObject(
        expect.objectContaining({
          color: '#2D5A27',
        })
      );
    });
  });

  describe('Dark Mode Toggle', () => {
    it('should toggle dark mode when pressed', () => {
      const { getByLabelText } = render(<ThemeSettingsScreen />);

      const darkModeToggle = getByLabelText('Toggle dark mode');
      
      act(() => {
        fireEvent.press(darkModeToggle);
      });
      
      expect(mockSetThemeType).toHaveBeenCalledWith('dark');
    });

    it('should show correct state for dark mode toggle', () => {
      const { getByLabelText } = render(<ThemeSettingsScreen />);
      const darkModeToggle = getByLabelText('Toggle dark mode');
      
      // Should be false since we mocked themeType as 'light'
      expect(darkModeToggle.props.accessibilityState.checked).toBe(false);
    });
  });

  describe('System Theme Toggle', () => {
    it('should enable system theme when toggled', () => {
      const { getByLabelText } = render(<ThemeSettingsScreen />);

      const systemToggle = getByLabelText('Follow system theme');
      
      act(() => {
        fireEvent.press(systemToggle);
      });
      
      expect(mockSetThemeType).toHaveBeenCalledWith('system');
    });

    it('should show correct state for system toggle', () => {
      const { getByLabelText } = render(<ThemeSettingsScreen />);
      const systemToggle = getByLabelText('Follow system theme');
      
      // Should be false since we mocked themeType as 'light'
      expect(systemToggle.props.accessibilityState.checked).toBe(false);
    });
  });

  describe('High Contrast Toggle', () => {
    it('should toggle high contrast mode', () => {
      const { getByLabelText } = render(<ThemeSettingsScreen />);

      const highContrastToggle = getByLabelText('Toggle high contrast');
      
      act(() => {
        fireEvent.press(highContrastToggle);
      });
      
      expect(mockSetIsHighContrast).toHaveBeenCalledWith(true);
    });

    it('should show correct state for high contrast toggle', () => {
      const { getByLabelText } = render(<ThemeSettingsScreen />);
      const highContrastToggle = getByLabelText('Toggle high contrast');
      
      // Should be false since we mocked isHighContrast as false
      expect(highContrastToggle.props.accessibilityState.checked).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(<ThemeSettingsScreen />);

      const darkModeToggle = getByLabelText('Toggle dark mode');
      expect(darkModeToggle.props.accessibilityHint).toBe(
        'Switches between light and dark appearance'
      );

      const systemToggle = getByLabelText('Follow system theme');
      expect(systemToggle.props.accessibilityHint).toBe(
        'Uses your device\'s dark or light mode setting'
      );

      const highContrastToggle = getByLabelText('Toggle high contrast');
      expect(highContrastToggle.props.accessibilityHint).toBe(
        'Increases text and background contrast for better visibility'
      );
    });

    it('should have proper accessibility roles', () => {
      const { getByLabelText } = render(<ThemeSettingsScreen />);

      const darkModeToggle = getByLabelText('Toggle dark mode');
      expect(darkModeToggle.props.accessibilityRole).toBe('switch');

      const systemToggle = getByLabelText('Follow system theme');
      expect(systemToggle.props.accessibilityRole).toBe('switch');

      const highContrastToggle = getByLabelText('Toggle high contrast');
      expect(highContrastToggle.props.accessibilityRole).toBe('switch');
    });
  });

  describe('Theme Integration', () => {
    it('should maintain stress-friendly design patterns', () => {
      const { getByText } = render(<ThemeSettingsScreen />);

      // Check that empathetic messaging is present
      expect(getByText('Customize how the app looks to support your comfort and accessibility needs.')).toBeTruthy();
      expect(getByText('Theme changes take effect immediately. Your preference is automatically saved.')).toBeTruthy();
    });
  });
});