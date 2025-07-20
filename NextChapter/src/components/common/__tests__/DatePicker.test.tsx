import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { renderWithProviders } from '@test-utils/test-helpers';
import { DatePicker } from '../DatePicker';

// Mock the animation hooks
jest.mock('@hooks/useAnimations', () => ({
  useDropdownAnimation: jest.fn(() => ({
    chevronRotation: '0deg',
  })),
  useFadeInAnimation: jest.fn(() => ({
    animatedStyle: { opacity: 1 },
    animate: jest.fn(),
    reset: jest.fn(),
  })),
  useCardPressAnimation: jest.fn(() => ({
    pressIn: jest.fn(),
    pressOut: jest.fn(),
    animatedStyle: { transform: [{ scale: 1 }] },
  })),
}));

// Mock AccessibilityInfo
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  announceForAccessibility: jest.fn(),
}));

// Mock Intl.DateTimeFormat for consistent testing
const mockFormat = jest.fn((date: Date) => {
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
});

global.Intl = {
  ...global.Intl,
  DateTimeFormat: jest.fn(() => ({
    format: mockFormat,
  })) as any,
};

describe('DatePicker', () => {
  const mockOnChange = jest.fn();
  const testDate = new Date(2024, 0, 15); // January 15, 2024
  const today = new Date(2024, 0, 1); // January 1, 2024

  const defaultProps = {
    onChange: mockOnChange,
    testID: 'test-date-picker',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(today);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders correctly with minimal props', () => {
      const { getByTestId, getByText } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      expect(getByTestId('test-date-picker')).toBeTruthy();
      expect(getByText('Select a date')).toBeTruthy();
    });

    it('renders with custom placeholder', () => {
      const { getByText } = renderWithProviders(
        <DatePicker {...defaultProps} placeholder="Choose a date" />
      );
      
      expect(getByText('Choose a date')).toBeTruthy();
    });

    it('renders with selected value', () => {
      const { getByText } = renderWithProviders(
        <DatePicker {...defaultProps} value={testDate} />
      );
      
      expect(getByText('Jan 15, 2024')).toBeTruthy();
    });

    it('renders with label and required indicator', () => {
      const { getByText } = renderWithProviders(
        <DatePicker {...defaultProps} label="Birth Date" required />
      );
      
      expect(getByText('Birth Date')).toBeTruthy();
      expect(getByText('*')).toBeTruthy();
    });

    it('renders with hint text', () => {
      const { getByText } = renderWithProviders(
        <DatePicker {...defaultProps} hint="Please select your birth date" />
      );
      
      expect(getByText('Please select your birth date')).toBeTruthy();
    });

    it('renders with error state', () => {
      const { getByText, queryByText } = renderWithProviders(
        <DatePicker 
          {...defaultProps} 
          error="This field is required" 
          hint="This hint should not show"
        />
      );
      
      expect(getByText('This field is required')).toBeTruthy();
      expect(queryByText('This hint should not show')).toBeNull();
    });

    it('applies disabled state', () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} disabled />
      );
      
      const input = getByTestId('test-date-picker');
      expect(input.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Calendar Opening and Closing', () => {
    it('opens calendar on press', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      const input = getByTestId('test-date-picker');
      fireEvent.press(input);
      
      await waitFor(() => {
        expect(getByText('January 2024')).toBeTruthy();
        expect(getByText('Today')).toBeTruthy();
      });
    });

    it('does not open when disabled', () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <DatePicker {...defaultProps} disabled />
      );
      
      const input = getByTestId('test-date-picker');
      fireEvent.press(input);
      
      expect(queryByText('January 2024')).toBeNull();
    });

    it('closes calendar when overlay is pressed', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        expect(getByText('January 2024')).toBeTruthy();
      });

      // Find the modal overlay (TouchableOpacity with testID would be better)
      const overlay = getByText('January 2024').parent?.parent?.parent;
      if (overlay) {
        fireEvent.press(overlay);
      }
      
      await waitFor(() => {
        expect(queryByText('January 2024')).toBeNull();
      });
    });
  });

  describe('Date Selection', () => {
    it('selects date on day press', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      // Wait for calendar to appear and select January 15
      await waitFor(() => {
        const dayButton = getByTestId(`test-date-picker-day-${testDate.getTime()}`);
        fireEvent.press(dayButton);
      });
      
      expect(mockOnChange).toHaveBeenCalledWith(testDate);
    });

    it('highlights selected date', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} value={testDate} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        const selectedDay = getByTestId(`test-date-picker-day-${testDate.getTime()}`);
        expect(selectedDay.props.accessibilityState.selected).toBe(true);
      });
    });

    it('highlights today', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        const todayDay = getByTestId(`test-date-picker-day-${today.getTime()}`);
        expect(todayDay.props.accessibilityLabel).toContain('today');
      });
    });

    it('selects today when today button is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        const todayButton = getByTestId('test-date-picker-today');
        fireEvent.press(todayButton);
      });
      
      expect(mockOnChange).toHaveBeenCalledWith(today);
    });
  });

  describe('Month Navigation', () => {
    it('navigates to previous month', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        expect(getByText('January 2024')).toBeTruthy();
      });

      const previousButton = getByTestId('test-date-picker-previous-month');
      fireEvent.press(previousButton);
      
      await waitFor(() => {
        expect(getByText('December 2023')).toBeTruthy();
        expect(queryByText('January 2024')).toBeNull();
      });
    });

    it('navigates to next month', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        expect(getByText('January 2024')).toBeTruthy();
      });

      const nextButton = getByTestId('test-date-picker-next-month');
      fireEvent.press(nextButton);
      
      await waitFor(() => {
        expect(getByText('February 2024')).toBeTruthy();
        expect(queryByText('January 2024')).toBeNull();
      });
    });
  });

  describe('Date Constraints', () => {
    const minDate = new Date(2024, 0, 10); // January 10, 2024
    const maxDate = new Date(2024, 0, 20); // January 20, 2024

    it('disables dates before minimum date', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} minimumDate={minDate} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      const disabledDate = new Date(2024, 0, 5); // January 5, 2024
      
      await waitFor(() => {
        const disabledDay = getByTestId(`test-date-picker-day-${disabledDate.getTime()}`);
        expect(disabledDay.props.accessibilityState.disabled).toBe(true);
      });
    });

    it('disables dates after maximum date', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} maximumDate={maxDate} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      const disabledDate = new Date(2024, 0, 25); // January 25, 2024
      
      await waitFor(() => {
        const disabledDay = getByTestId(`test-date-picker-day-${disabledDate.getTime()}`);
        expect(disabledDay.props.accessibilityState.disabled).toBe(true);
      });
    });

    it('does not select disabled dates', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} minimumDate={minDate} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      const disabledDate = new Date(2024, 0, 5); // January 5, 2024
      
      await waitFor(() => {
        const disabledDay = getByTestId(`test-date-picker-day-${disabledDate.getTime()}`);
        fireEvent.press(disabledDay);
      });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not select today if today is disabled', async () => {
      const futureMinDate = new Date(2024, 0, 10); // January 10, 2024 (after today)
      
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} minimumDate={futureMinDate} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        const todayButton = getByTestId('test-date-picker-today');
        fireEvent.press(todayButton);
      });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Variants and Sizes', () => {
    it('applies different variants', () => {
      const variants = ['default', 'success', 'warning', 'gentle'] as const;
      
      variants.forEach(variant => {
        const { getByTestId } = renderWithProviders(
          <DatePicker {...defaultProps} variant={variant} testID={`date-picker-${variant}`} />
        );
        
        const input = getByTestId(`date-picker-${variant}`);
        expect(input).toBeTruthy();
      });
    });

    it('applies different sizes', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const { getByTestId } = renderWithProviders(
          <DatePicker {...defaultProps} size={size} testID={`date-picker-${size}`} />
        );
        
        const input = getByTestId(`date-picker-${size}`);
        expect(input).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role and states', () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} value={testDate} disabled />
      );
      
      const input = getByTestId('test-date-picker');
      expect(input.props.accessibilityRole).toBe('button');
      expect(input.props.accessibilityState).toEqual({
        disabled: true,
        expanded: false,
      });
    });

    it('has correct accessibility label', () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} label="Birth Date" value={testDate} />
      );
      
      const input = getByTestId('test-date-picker');
      expect(input.props.accessibilityLabel).toBe('Birth Date, current value: Jan 15, 2024');
    });

    it('uses custom accessibility label', () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} accessibilityLabel="Custom date picker" />
      );
      
      const input = getByTestId('test-date-picker');
      expect(input.props.accessibilityLabel).toBe('Custom date picker');
    });

    it('announces calendar open', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} label="Birth Date" />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          'Birth Date opened. Use swipe gestures to navigate calendar.'
        );
      });
    });

    it('announces date selection', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        const dayButton = getByTestId(`test-date-picker-day-${testDate.getTime()}`);
        fireEvent.press(dayButton);
      });
      
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Selected Jan 15, 2024'
      );
    });

    it('calendar day has correct accessibility properties', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} value={testDate} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        const selectedDay = getByTestId(`test-date-picker-day-${testDate.getTime()}`);
        const todayDay = getByTestId(`test-date-picker-day-${today.getTime()}`);
        
        expect(selectedDay.props.accessibilityRole).toBe('button');
        expect(selectedDay.props.accessibilityLabel).toContain('Jan 15, 2024');
        expect(selectedDay.props.accessibilityLabel).toContain('selected');
        expect(selectedDay.props.accessibilityState.selected).toBe(true);
        
        expect(todayDay.props.accessibilityLabel).toContain('today');
      });
    });

    it('navigation buttons have correct accessibility labels', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        const previousButton = getByTestId('test-date-picker-previous-month');
        const nextButton = getByTestId('test-date-picker-next-month');
        const todayButton = getByTestId('test-date-picker-today');
        
        expect(previousButton.props.accessibilityLabel).toBe('Previous month');
        expect(nextButton.props.accessibilityLabel).toBe('Next month');
        expect(todayButton.props.accessibilityLabel).toBe('Select today');
      });
    });
  });

  describe('Locale Support', () => {
    afterEach(() => {
      // Reset to default mock
      mockFormat.mockImplementation((date: Date) => {
        const month = date.toLocaleString('en-US', { month: 'short' });
        return `${month} ${date.getDate()}, ${date.getFullYear()}`;
      });
    });

    it('uses custom locale for date formatting', () => {
      // Mock European date format
      mockFormat.mockImplementation((date: Date) => {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      });

      const { getByText } = renderWithProviders(
        <DatePicker {...defaultProps} value={testDate} locale="en-GB" />
      );
      
      expect(getByText('15/1/2024')).toBeTruthy();
    });

    it('falls back to default format when Intl fails', () => {
      // Mock Intl.DateTimeFormat to throw an error
      const originalIntl = global.Intl;
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn(() => {
          throw new Error('Unsupported locale');
        }),
      } as any;

      const { getByText } = renderWithProviders(
        <DatePicker {...defaultProps} value={testDate} locale="unsupported" />
      );
      
      // Should fall back to default format
      expect(getByText('Jan 15, 2024')).toBeTruthy();

      // Restore Intl
      global.Intl = originalIntl;
    });
  });

  describe('Edge Cases', () => {
    it('handles month boundaries correctly', async () => {
      const endOfMonth = new Date(2024, 0, 31); // January 31, 2024
      
      const { getByTestId, getByText } = renderWithProviders(
        <DatePicker {...defaultProps} value={endOfMonth} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        expect(getByText('January 2024')).toBeTruthy();
      });

      // Navigate to February
      const nextButton = getByTestId('test-date-picker-next-month');
      fireEvent.press(nextButton);
      
      await waitFor(() => {
        expect(getByText('February 2024')).toBeTruthy();
      });
    });

    it('handles year boundaries correctly', async () => {
      const endOfYear = new Date(2024, 11, 31); // December 31, 2024
      
      const { getByTestId, getByText } = renderWithProviders(
        <DatePicker {...defaultProps} value={endOfYear} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        expect(getByText('December 2024')).toBeTruthy();
      });

      // Navigate to next month (January 2025)
      const nextButton = getByTestId('test-date-picker-next-month');
      fireEvent.press(nextButton);
      
      await waitFor(() => {
        expect(getByText('January 2025')).toBeTruthy();
      });
    });

    it('displays previous and next month days correctly', async () => {
      const { getByTestId } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      // January 2024 starts on Monday, so should show some December 2023 days
      await waitFor(() => {
        const prevMonthDay = new Date(2023, 11, 31); // December 31, 2023
        const prevMonthButton = getByTestId(`test-date-picker-day-${prevMonthDay.getTime()}`);
        expect(prevMonthButton).toBeTruthy();
      });
    });

    it('handles leap year correctly', async () => {
      jest.setSystemTime(new Date(2024, 1, 1)); // February 1, 2024 (leap year)
      
      const { getByTestId, getByText } = renderWithProviders(
        <DatePicker {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-date-picker'));
      
      await waitFor(() => {
        expect(getByText('February 2024')).toBeTruthy();
        // February 29 should exist in 2024 (leap year)
        const leapDay = new Date(2024, 1, 29);
        const leapDayButton = getByTestId(`test-date-picker-day-${leapDay.getTime()}`);
        expect(leapDayButton).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles invalid date props gracefully', () => {
      const invalidDate = new Date('invalid');
      
      expect(() => {
        renderWithProviders(
          <DatePicker {...defaultProps} value={invalidDate} />
        );
      }).not.toThrow();
    });

    it('handles missing onChange prop gracefully', () => {
      expect(() => {
        renderWithProviders(
          <DatePicker value={testDate} testID="test" />
        );
      }).not.toThrow();
    });
  });
});