import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { lightTheme } from '@theme';
import { ThemeProvider } from '@/styles/ThemeContext';
import { DateRangePicker, DateRange, DateRangePreset } from '../DateRangePicker';

// Mock animation hooks
const mockAnimationHooks = {
  useFadeInAnimation: () => ({
    animate: jest.fn(),
    reset: jest.fn(),
    fadeOut: jest.fn(),
    animatedStyle: { opacity: 1 },
  }),
  useSlideInAnimation: () => ({
    animate: jest.fn(),
    reset: jest.fn(),
    animatedStyle: { transform: [{ translateY: 0 }] },
  }),
};

jest.mock('@hooks', () => mockAnimationHooks);

// Mock AccessibilityInfo
const mockAccessibilityInfo = {
  announceForAccessibility: jest.fn(),
  isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};

jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => mockAccessibilityInfo);

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={lightTheme}>
    {children}
  </ThemeProvider>
);

describe('DateRangePicker', () => {
  const mockOnRangeChange = jest.fn();
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-01-31');

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessibilityInfo.announceForAccessibility.mockClear();
  });

  const defaultProps = {
    onRangeChange: mockOnRangeChange,
    testID: 'test-date-picker',
  };

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      expect(getByTestId('test-date-picker')).toBeTruthy();
      expect(getByText('Select date range')).toBeTruthy();
    });

    it('renders with label and required indicator', () => {
      const { getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            label="Budget Period"
            required
          />
        </TestWrapper>
      );

      expect(getByText('Budget Period')).toBeTruthy();
      expect(getByText('*')).toBeTruthy();
    });

    it('renders with custom placeholder', () => {
      const { getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            placeholder="Choose budget period"
          />
        </TestWrapper>
      );

      expect(getByText('Choose budget period')).toBeTruthy();
    });

    it('renders hint text when provided', () => {
      const { getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            hint="Select the period for your budget tracking"
          />
        </TestWrapper>
      );

      expect(getByText('Select the period for your budget tracking')).toBeTruthy();
    });

    it('renders error message when provided', () => {
      const { getByText, queryByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            error="Please select a valid date range"
            hint="This should be hidden"
          />
        </TestWrapper>
      );

      expect(getByText('Please select a valid date range')).toBeTruthy();
      expect(queryByText('This should be hidden')).toBeNull();
    });

    it('displays formatted date range when dates are selected', () => {
      const { getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            startDate={startDate}
            endDate={endDate}
          />
        </TestWrapper>
      );

      expect(getByText('Jan 1, 2025 - Jan 31, 2025')).toBeTruthy();
    });

    it('displays single date when start and end are the same', () => {
      const sameDate = new Date('2025-01-15');
      const { getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            startDate={sameDate}
            endDate={sameDate}
          />
        </TestWrapper>
      );

      expect(getByText('Jan 15, 2025')).toBeTruthy();
    });

    it('displays partial range when only start date is selected', () => {
      const { getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            startDate={startDate}
            endDate={null}
          />
        </TestWrapper>
      );

      expect(getByText('From Jan 1, 2025')).toBeTruthy();
    });

    it('displays partial range when only end date is selected', () => {
      const { getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            startDate={null}
            endDate={endDate}
          />
        </TestWrapper>
      );

      expect(getByText('Until Jan 31, 2025')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('opens modal when pressed', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('test-date-picker'));

      await waitFor(() => {
        expect(getByText('Quick Select')).toBeTruthy();
      });

      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('opened')
      );
    });

    it('does not open when disabled', () => {
      const { getByTestId, queryByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} disabled />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('test-date-picker'));

      expect(queryByText('Quick Select')).toBeNull();
    });

    it('closes modal when close button is pressed', async () => {
      const { getByTestId, queryByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      // Open modal
      fireEvent.press(getByTestId('test-date-picker'));
      await waitFor(() => expect(queryByText('Quick Select')).toBeTruthy());

      // Close modal
      fireEvent.press(getByTestId('test-date-picker-close'));
      
      await waitFor(() => {
        expect(queryByText('Quick Select')).toBeNull();
      });
    });

    it('closes modal when overlay is pressed', async () => {
      const { getByTestId, queryByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      // Open modal
      fireEvent.press(getByTestId('test-date-picker'));
      await waitFor(() => expect(queryByText('Quick Select')).toBeTruthy());

      // Find and press overlay (parent of modal content)
      const modal = getByTestId('test-date-picker').parent?.parent;
      if (modal) {
        fireEvent.press(modal);
      }

      await waitFor(() => {
        expect(queryByText('Quick Select')).toBeNull();
      });
    });
  });

  describe('Preset Selection', () => {
    it('renders default presets', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('test-date-picker'));

      await waitFor(() => {
        expect(getByText('Last 7 days')).toBeTruthy();
        expect(getByText('Last 30 days')).toBeTruthy();
        expect(getByText('Last 3 months')).toBeTruthy();
        expect(getByText('This month')).toBeTruthy();
        expect(getByText('Last month')).toBeTruthy();
      });
    });

    it('renders custom presets when provided', async () => {
      const customPresets: DateRangePreset[] = [
        {
          label: 'Last Quarter',
          value: 'last-quarter',
          getDates: () => ({ startDate: new Date('2024-10-01'), endDate: new Date('2024-12-31') }),
          description: 'Previous 3-month quarter',
        },
      ];

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} presets={customPresets} />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('test-date-picker'));

      await waitFor(() => {
        expect(getByText('Last Quarter')).toBeTruthy();
        expect(getByText('Previous 3-month quarter')).toBeTruthy();
      });
    });

    it('selects preset and closes modal', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('test-date-picker'));

      await waitFor(() => {
        const preset = getByTestId('test-date-picker-preset-last-7-days');
        fireEvent.press(preset);
      });

      expect(mockOnRangeChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );

      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('Selected Last 7 days')
      );
    });

    it('opens custom range view when custom button is pressed', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('test-date-picker'));

      await waitFor(() => {
        fireEvent.press(getByTestId('test-date-picker-custom-range'));
      });

      await waitFor(() => {
        expect(getByText('Select Dates')).toBeTruthy();
      });

      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('calendar view')
      );
    });

    it('clears selection when clear button is pressed', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            startDate={startDate}
            endDate={endDate}
          />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('test-date-picker'));

      await waitFor(() => {
        fireEvent.press(getByTestId('test-date-picker-clear'));
      });

      expect(mockOnRangeChange).toHaveBeenCalledWith({
        startDate: null,
        endDate: null,
      });

      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('cleared')
      );
    });
  });

  describe('Calendar View', () => {
    const openCalendarView = async (component: any) => {
      fireEvent.press(component.getByTestId('test-date-picker'));
      await waitFor(() => {
        fireEvent.press(component.getByTestId('test-date-picker-custom-range'));
      });
      await waitFor(() => {
        expect(component.getByText('Select Dates')).toBeTruthy();
      });
    };

    it('navigates between months', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      await openCalendarView({ getByTestId, getByText });

      // Check current month (should be current date's month)
      const currentMonth = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      expect(getByText(currentMonth)).toBeTruthy();

      // Navigate to next month
      fireEvent.press(getByTestId('test-date-picker-next-month'));

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthText = nextMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      await waitFor(() => {
        expect(getByText(nextMonthText)).toBeTruthy();
      });

      // Navigate to previous month (back to current)
      fireEvent.press(getByTestId('test-date-picker-prev-month'));

      await waitFor(() => {
        expect(getByText(currentMonth)).toBeTruthy();
      });
    });

    it('selects start and end dates', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      await openCalendarView({ getByTestId, getByText });

      // Select first date (start)
      const firstDay = getByTestId('test-date-picker-day-1');
      fireEvent.press(firstDay);

      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('Selected')
      );

      // Select second date (end)
      const fifteenthDay = getByTestId('test-date-picker-day-15');
      fireEvent.press(fifteenthDay);

      // Apply the range
      const applyButton = getByTestId('test-date-picker-apply');
      fireEvent.press(applyButton);

      expect(mockOnRangeChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });

    it('handles date selection with constraints', async () => {
      const minDate = new Date('2025-01-10');
      const maxDate = new Date('2025-01-20');

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            minDate={minDate}
            maxDate={maxDate}
          />
        </TestWrapper>
      );

      await openCalendarView({ getByTestId, getByText });

      // Try to select a date before minDate (should not work)
      const earlyDay = getByTestId('test-date-picker-day-5');
      fireEvent.press(earlyDay);

      // The callback should not be called for disabled dates
      expect(mockAccessibilityInfo.announceForAccessibility).not.toHaveBeenCalledWith(
        expect.stringContaining('Selected')
      );
    });

    it('returns to presets view when back button is pressed', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} />
        </TestWrapper>
      );

      await openCalendarView({ getByTestId, getByText });

      fireEvent.press(getByTestId('test-date-picker-back'));

      await waitFor(() => {
        expect(getByText('Quick Select')).toBeTruthy();
      });

      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('preset view')
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            label="Budget Period"
            accessibilityLabel="Budget period selector"
            accessibilityHint="Choose the time period for budget tracking"
          />
        </TestWrapper>
      );

      const picker = getByTestId('test-date-picker');
      expect(picker).toHaveAccessibilityState({ disabled: false, expanded: false });
    });

    it('announces state changes properly', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} label="Budget Period" />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('test-date-picker'));

      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('Budget Period opened')
      );
    });

    it('has proper error accessibility', () => {
      const { getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            error="Invalid date range"
          />
        </TestWrapper>
      );

      const errorText = getByText('Invalid date range');
      expect(errorText).toHaveAccessibilityRole('alert');
    });
  });

  describe('Variants and Sizes', () => {
    it('applies different variants correctly', () => {
      const { rerender, getByTestId } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} variant="success" />
        </TestWrapper>
      );

      let picker = getByTestId('test-date-picker');
      expect(picker).toBeTruthy();

      rerender(
        <TestWrapper>
          <DateRangePicker {...defaultProps} variant="warning" />
        </TestWrapper>
      );

      picker = getByTestId('test-date-picker');
      expect(picker).toBeTruthy();

      rerender(
        <TestWrapper>
          <DateRangePicker {...defaultProps} variant="gentle" />
        </TestWrapper>
      );

      picker = getByTestId('test-date-picker');
      expect(picker).toBeTruthy();
    });

    it('applies different sizes correctly', () => {
      const { rerender, getByTestId } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} size="small" />
        </TestWrapper>
      );

      let picker = getByTestId('test-date-picker');
      expect(picker).toBeTruthy();

      rerender(
        <TestWrapper>
          <DateRangePicker {...defaultProps} size="large" />
        </TestWrapper>
      );

      picker = getByTestId('test-date-picker');
      expect(picker).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty presets array', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <DateRangePicker {...defaultProps} presets={[]} />
        </TestWrapper>
      );

      fireEvent.press(getByTestId('test-date-picker'));

      await waitFor(() => {
        expect(getByText('Quick Select')).toBeTruthy();
        expect(getByText('Custom Date Range')).toBeTruthy();
      });
    });

    it('handles date range that spans years', () => {
      const startDate = new Date('2024-12-15');
      const endDate = new Date('2025-01-15');

      const { getByText } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            startDate={startDate}
            endDate={endDate}
          />
        </TestWrapper>
      );

      expect(getByText('Dec 15, 2024 - Jan 15, 2025')).toBeTruthy();
    });

    it('resets temp dates when props change', () => {
      const { rerender } = render(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            startDate={null}
            endDate={null}
          />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <DateRangePicker
            {...defaultProps}
            startDate={startDate}
            endDate={endDate}
          />
        </TestWrapper>
      );

      // Component should handle the prop change gracefully
      expect(mockOnRangeChange).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('does not rerender unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = (props: any) => {
        renderSpy();
        return <DateRangePicker {...props} />;
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent {...defaultProps} />
        </TestWrapper>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Rerender with same props
      rerender(
        <TestWrapper>
          <TestComponent {...defaultProps} />
        </TestWrapper>
      );

      // Should not cause additional renders for same props
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });
  });
});