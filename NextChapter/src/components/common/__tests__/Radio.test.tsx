import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Radio from '@components/common/Radio';
import { ThemeProvider } from '@context/ThemeContext';

// Mock the theme modules
jest.mock('../../../theme', () => ({
  Colors: {
    primary: '#2D5A27',
    background: '#FDFCF8',
    surface: '#FFFFFF',
    border: '#E8EDE9',
    textPrimary: '#1D2B1F',
    textSecondary: '#5A6B5D',
    textTertiary: '#8A9B8D',
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
    comfortableTouchTarget: 56,
  },
  Typography: {
    fontSizes: {
      body: 16,
    },
    fontWeights: {
      regular: '400',
    },
  },
  Borders: {
    radius: {
      md: 8,
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

describe('Radio', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all options', () => {
    const { getByText } = renderWithTheme(
      <Radio options={mockOptions} onValueChange={() => {}} />
    );

    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
    expect(getByText('Option 3')).toBeTruthy();
  });

  it('should show selected option', () => {
    const { getByLabelText } = renderWithTheme(
      <Radio 
        options={mockOptions} 
        value="option2"
        onValueChange={() => {}} 
      />
    );

    const selectedOption = getByLabelText('Option 2, selected');
    expect(selectedOption).toBeTruthy();
    expect(selectedOption.props.accessibilityState.checked).toBe(true);
  });

  it('should call onValueChange when option is pressed', () => {
    const mockOnChange = jest.fn();
    const { getByText } = renderWithTheme(
      <Radio 
        options={mockOptions} 
        onValueChange={mockOnChange} 
      />
    );

    fireEvent.press(getByText('Option 2'));
    expect(mockOnChange).toHaveBeenCalledWith('option2');
  });

  it('should not call onValueChange for disabled options', () => {
    const mockOnChange = jest.fn();
    const optionsWithDisabled = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
    ];

    const { getByText } = renderWithTheme(
      <Radio 
        options={optionsWithDisabled} 
        onValueChange={mockOnChange} 
      />
    );

    fireEvent.press(getByText('Option 2'));
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should have correct accessibility attributes', () => {
    const { getByTestId, getByLabelText } = renderWithTheme(
      <Radio 
        options={mockOptions} 
        value="option1"
        onValueChange={() => {}}
        testID="radio-group"
        accessibilityLabel="Select an option"
      />
    );

    const radioGroup = getByTestId('radio-group');
    expect(radioGroup.props.accessibilityRole).toBe('radiogroup');
    expect(radioGroup.props.accessibilityLabel).toBe('Select an option');

    const option = getByLabelText('Option 1, selected');
    expect(option.props.accessibilityRole).toBe('radio');
    expect(option.props.accessibilityState).toEqual({
      checked: true,
      disabled: undefined, // Component doesn't explicitly set disabled: false
    });
  });

  it('should show disabled state correctly', () => {
    const optionsWithDisabled = [
      { value: 'option1', label: 'Option 1', disabled: true },
    ];

    const { getByLabelText } = renderWithTheme(
      <Radio 
        options={optionsWithDisabled} 
        onValueChange={() => {}} 
      />
    );

    const disabledOption = getByLabelText('Option 1');
    expect(disabledOption.props.accessibilityState.disabled).toBe(true);
    expect(disabledOption.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 0.5 })
      ])
    );
  });

  it('should update selection when value prop changes', () => {
    const { getByLabelText, rerender } = renderWithTheme(
      <Radio 
        options={mockOptions} 
        value="option1"
        onValueChange={() => {}} 
      />
    );

    expect(getByLabelText('Option 1, selected')).toBeTruthy();

    rerender(
      <ThemeProvider>
        <Radio 
          options={mockOptions} 
          value="option2"
          onValueChange={() => {}} 
        />
      </ThemeProvider>
    );

    expect(getByLabelText('Option 2, selected')).toBeTruthy();
    expect(getByLabelText('Option 1').props.accessibilityState.checked).toBe(false);
  });

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: 'red', padding: 20 };
    const { getByTestId } = renderWithTheme(
      <Radio 
        options={mockOptions} 
        onValueChange={() => {}}
        style={customStyle}
        testID="styled-radio"
      />
    );

    const radioGroup = getByTestId('styled-radio');
    expect(radioGroup.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
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
      <Radio options={mockOptions} onValueChange={() => {}} />
    );

    const option = getByText('Option 1');
    expect(option.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#FDFCF8' }) // Dark mode text
      ])
    );
  });

  it('should handle empty options array', () => {
    const { getByTestId } = renderWithTheme(
      <Radio 
        options={[]} 
        onValueChange={() => {}}
        testID="empty-radio"
      />
    );

    const radioGroup = getByTestId('empty-radio');
    expect(radioGroup.props.children).toEqual([]);
  });

  it('should style selected option with primary color border', () => {
    const { getByLabelText } = renderWithTheme(
      <Radio 
        options={mockOptions} 
        value="option2"
        onValueChange={() => {}} 
      />
    );

    const selectedOption = getByLabelText('Option 2, selected');
    expect(selectedOption.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ 
          borderColor: '#2D5A27', // Primary color
          borderWidth: 2 
        })
      ])
    );
  });

  it('should handle rapid selection changes', () => {
    const mockOnChange = jest.fn();
    const { getByText } = renderWithTheme(
      <Radio 
        options={mockOptions} 
        onValueChange={mockOnChange} 
      />
    );

    fireEvent.press(getByText('Option 1'));
    fireEvent.press(getByText('Option 2'));
    fireEvent.press(getByText('Option 3'));

    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'option1');
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 'option2');
    expect(mockOnChange).toHaveBeenNthCalledWith(3, 'option3');
  });
});