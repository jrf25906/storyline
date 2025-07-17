import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { Checkbox } from '../Checkbox';
import { ThemeProvider } from '../../../context/ThemeContext';

// Mock the theme modules
jest.mock('../../../theme', () => ({
  Colors: {
    primary: '#2D5A27',
    secondary: '#7BA05B',
    gentleCoral: '#D4736A',
    background: '#FDFCF8',
    surface: '#FFFFFF',
    border: '#E8EDE9',
    textPrimary: '#1D2B1F',
    textSecondary: '#5A6B5D',
    white: '#FFFFFF',
    transparent: 'transparent',
    dark: {
      background: '#1A1F1B',
      surface: '#252B26',
      border: '#3A453C',
      textPrimary: '#FDFCF8',
      textSecondary: '#B3BDB6',
    },
  },
  Spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    minTouchTarget: 48,
  },
  Typography: {
    fontSizes: {
      body: 16,
      bodySM: 14,
    },
    fontWeights: {
      medium: '500',
    },
  },
  Borders: {
    radius: {
      sm: 4,
      md: 8,
      lg: 16,
      full: 9999,
    },
  },
  Shadows: {
    focus: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  },
}));

// Mock ThemeContext
const mockTheme = {
  colors: {
    primary: '#2D5A27',
    background: '#FDFCF8',
  },
};

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: mockTheme,
    isDark: false,
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Checkbox', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with label', () => {
    const { getByText } = renderWithTheme(
      <Checkbox label="Accept terms and conditions" />
    );

    expect(getByText('Accept terms and conditions')).toBeTruthy();
  });

  it('should render unchecked by default', () => {
    const { getByTestId } = renderWithTheme(
      <Checkbox label="Test checkbox" onToggle={() => {}} testID="checkbox" />
    );

    const touchable = getByTestId('checkbox-touchable');
    // When checked is false, React Native might not include it in accessibilityState
    expect(touchable.props.accessibilityState.checked).toBeFalsy();
  });

  it('should render checked when checked prop is true', () => {
    const { getByTestId } = renderWithTheme(
      <Checkbox label="Test checkbox" checked={true} testID="checkbox" />
    );

    const touchable = getByTestId('checkbox-touchable');
    expect(touchable.props.accessibilityState.checked).toBe(true);
  });

  it('should call onToggle when pressed', () => {
    const mockOnToggle = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Checkbox 
        label="Test checkbox" 
        checked={false}
        onToggle={mockOnToggle}
        testID="checkbox"
      />
    );

    const touchable = getByTestId('checkbox-touchable');
    fireEvent.press(touchable);

    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it('should toggle checked state when pressed', () => {
    const mockOnToggle = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Checkbox 
        label="Test checkbox" 
        checked={true}
        onToggle={mockOnToggle}
        testID="checkbox"
      />
    );

    const touchable = getByTestId('checkbox-touchable');
    fireEvent.press(touchable);

    expect(mockOnToggle).toHaveBeenCalledWith(false);
  });

  it('should not call onToggle when disabled', () => {
    const mockOnToggle = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Checkbox 
        label="Test checkbox" 
        disabled={true}
        onToggle={mockOnToggle}
        testID="checkbox"
      />
    );

    const touchable = getByTestId('checkbox-touchable');
    fireEvent.press(touchable);

    expect(mockOnToggle).not.toHaveBeenCalled();
  });

  it('should display error message when provided', () => {
    const errorMessage = 'This field is required';
    const { getByText } = renderWithTheme(
      <Checkbox 
        label="Test checkbox" 
        error={errorMessage}
      />
    );

    const error = getByText(errorMessage);
    expect(error).toBeTruthy();
    expect(error.props.accessibilityRole).toBe('alert');
    expect(error.props.accessibilityLiveRegion).toBe('polite');
  });

  it('should have correct accessibility attributes', () => {
    const { getByTestId } = renderWithTheme(
      <Checkbox 
        label="Subscribe to newsletter" 
        checked={true}
        disabled={false}
        testID="checkbox"
      />
    );

    const touchable = getByTestId('checkbox-touchable');
    expect(touchable.props.accessible).toBe(true);
    expect(touchable.props.accessibilityRole).toBe('checkbox');
    expect(touchable.props.accessibilityLabel).toBe('Subscribe to newsletter');
    expect(touchable.props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });
  });

  it('should show disabled state correctly', () => {
    const { getByTestId } = renderWithTheme(
      <Checkbox 
        label="Disabled checkbox" 
        disabled={true}
        testID="checkbox"
      />
    );

    const touchable = getByTestId('checkbox-touchable');
    expect(touchable.props.disabled).toBe(true);
    expect(touchable.props.accessibilityState.disabled).toBe(true);
    
    // Check opacity styling
    expect(touchable.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 0.6 })
      ])
    );
  });

  it('should animate scale on press', async () => {
    const animationSpy = jest.spyOn(Animated, 'sequence');
    
    const { getByTestId } = renderWithTheme(
      <Checkbox 
        label="Animated checkbox" 
        onToggle={() => {}}
        testID="checkbox"
      />
    );

    const touchable = getByTestId('checkbox-touchable');
    fireEvent.press(touchable);

    await waitFor(() => {
      expect(animationSpy).toHaveBeenCalled();
    });

    animationSpy.mockRestore();
  });

  it('should handle press states', () => {
    const { getByTestId } = renderWithTheme(
      <Checkbox 
        label="Press state checkbox" 
        testID="checkbox"
      />
    );

    const touchable = getByTestId('checkbox-touchable');
    
    // Press in
    fireEvent(touchable, 'pressIn');
    // The container should have pressed state applied
    
    // Press out
    fireEvent(touchable, 'pressOut');
    // The container should remove pressed state
  });

  it('should use dark mode colors when theme is dark', () => {
    const useThemeMock = require('../../../context/ThemeContext').useTheme;
    useThemeMock.mockReturnValue({
      theme: {
        colors: {
          primary: '#2D5A27',
          background: '#1A1F1B', // Dark background
        },
      },
      isDark: true,
    });

    const { getByText } = renderWithTheme(
      <Checkbox label="Dark mode checkbox" />
    );

    const label = getByText('Dark mode checkbox');
    expect(label.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#FDFCF8' }) // Dark mode text
      ])
    );
  });

  it('should apply container styles', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = renderWithTheme(
      <Checkbox 
        label="Styled checkbox" 
        containerStyle={customStyle}
        testID="checkbox"
      />
    );

    const container = getByTestId('checkbox');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });

  it('should animate checkbox appearance when checked changes', async () => {
    const animationSpy = jest.spyOn(Animated, 'parallel');
    
    const { rerender } = renderWithTheme(
      <Checkbox label="Animated checkbox" checked={false} />
    );

    rerender(
      <ThemeProvider>
        <Checkbox label="Animated checkbox" checked={true} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(animationSpy).toHaveBeenCalled();
    });

    animationSpy.mockRestore();
  });
});