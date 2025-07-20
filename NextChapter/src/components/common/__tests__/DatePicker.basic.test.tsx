import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DatePicker } from '../DatePicker';
import { SafeThemeProvider } from '../SafeThemeProvider';

// Mock AccessibilityInfo
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  announceForAccessibility: jest.fn(),
}));

// Simple theme for testing
const testTheme = {
  colors: {
    primary: '#007AFF',
    surface: { primary: '#FFFFFF', secondary: '#F2F2F7' },
    text: { primary: '#000000', secondary: '#6D6D70', inverse: '#FFFFFF' },
    semantic: { error: '#FF3B30', success: '#34C759', warning: '#FF9500' },
    border: '#C6C6C8',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  typography: {
    body: { fontSize: 16 },
    caption: { fontSize: 12 },
    subtitle: { fontSize: 18 },
  },
};

// Wrapper component for tests
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeThemeProvider testTheme={testTheme}>
    {children}
  </SafeThemeProvider>
);

describe('DatePicker Basic Tests', () => {
  const mockOnChange = jest.fn();
  const testDate = new Date(2024, 0, 15); // January 15, 2024

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with minimal props', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <DatePicker onChange={mockOnChange} testID="date-picker" />
      </TestWrapper>
    );
    
    expect(getByTestId('date-picker')).toBeTruthy();
  });

  it('displays placeholder when no value is set', () => {
    const { getByText } = render(
      <TestWrapper>
        <DatePicker onChange={mockOnChange} placeholder="Select a date" />
      </TestWrapper>
    );
    
    expect(getByText('Select a date')).toBeTruthy();
  });

  it('displays formatted date when value is set', () => {
    const { getByText } = render(
      <TestWrapper>
        <DatePicker onChange={mockOnChange} value={testDate} />
      </TestWrapper>
    );
    
    // Should show formatted date (depends on implementation)
    expect(getByText(/Jan.*15.*2024/)).toBeTruthy();
  });

  it('shows label when provided', () => {
    const { getByText } = render(
      <TestWrapper>
        <DatePicker onChange={mockOnChange} label="Birth Date" />
      </TestWrapper>
    );
    
    expect(getByText('Birth Date')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const { getByText } = render(
      <TestWrapper>
        <DatePicker onChange={mockOnChange} label="Date" required />
      </TestWrapper>
    );
    
    expect(getByText('*')).toBeTruthy();
  });

  it('shows error message', () => {
    const { getByText } = render(
      <TestWrapper>
        <DatePicker onChange={mockOnChange} error="This field is required" />
      </TestWrapper>
    );
    
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('shows hint text', () => {
    const { getByText } = render(
      <TestWrapper>
        <DatePicker onChange={mockOnChange} hint="Choose your birth date" />
      </TestWrapper>
    );
    
    expect(getByText('Choose your birth date')).toBeTruthy();
  });

  it('can be disabled', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <DatePicker onChange={mockOnChange} disabled testID="date-picker" />
      </TestWrapper>
    );
    
    const input = getByTestId('date-picker');
    expect(input.props.accessibilityState.disabled).toBe(true);
  });

  it('opens calendar when pressed', () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <DatePicker onChange={mockOnChange} testID="date-picker" />
      </TestWrapper>
    );
    
    const input = getByTestId('date-picker');
    fireEvent.press(input);
    
    // Should show month/year header
    expect(getByText(/\d{4}/)).toBeTruthy(); // Year
  });

  it('has correct accessibility properties', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <DatePicker 
          onChange={mockOnChange} 
          testID="date-picker"
          accessibilityLabel="Custom label"
        />
      </TestWrapper>
    );
    
    const input = getByTestId('date-picker');
    expect(input.props.accessibilityRole).toBe('button');
    expect(input.props.accessibilityLabel).toBe('Custom label');
  });
});