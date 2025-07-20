import React from 'react';
import { fireEvent, waitFor, render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { TimePicker, TimeValue, TimePickerProps } from '../TimePicker';
import { SafeThemeProvider } from '../SafeThemeProvider';

// Mock the animation hooks
jest.mock('@hooks/useAnimations', () => ({
  ...jest.requireActual('@hooks/useAnimations'),
  useDropdownAnimation: jest.fn(() => ({
    chevronRotation: '0deg',
  })),
  useFadeInAnimation: jest.fn(() => ({
    animate: jest.fn(),
    animatedStyle: {},
  })),
}));

// Mock AccessibilityInfo
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  announceForAccessibility: jest.fn(),
}));

describe('TimePicker', () => {
  const mockOnChange = jest.fn();

  const defaultProps: TimePickerProps = {
    onChange: mockOnChange,
    testID: 'test-time-picker',
  };

  const renderComponent = (props: Partial<TimePickerProps> = {}) => {
    return render(
      <SafeThemeProvider>
        <TimePicker {...defaultProps} {...props} />
      </SafeThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders correctly with minimal props', () => {
      const { getByTestId, getByText } = renderComponent();
      
      expect(getByTestId('test-time-picker')).toBeTruthy();
      expect(getByText('Select time')).toBeTruthy();
    });

    it('renders with custom placeholder', () => {
      const { getByText } = renderComponent({ placeholder: "Choose time" });
      
      expect(getByText('Choose time')).toBeTruthy();
    });

    it('renders with 12-hour format value', () => {
      const value: TimeValue = { hours: 2, minutes: 30, period: 'PM' };
      const { getByText } = renderComponent({ value, format: "12" });
      
      expect(getByText('2:30 PM')).toBeTruthy();
    });

    it('renders with 24-hour format value', () => {
      const value: TimeValue = { hours: 14, minutes: 30 };
      const { getByText } = renderComponent({ value, format: "24" });
      
      expect(getByText('14:30')).toBeTruthy();
    });

    it('renders with label and required indicator', () => {
      const { getByText } = renderComponent({ label: "Meeting time", required: true });
      
      expect(getByText('Meeting time')).toBeTruthy();
      expect(getByText('*')).toBeTruthy();
    });

    it('handles edge case times correctly', () => {
      // Test midnight in 12-hour format
      const midnightValue: TimeValue = { hours: 0, minutes: 0, period: 'AM' };
      const { getByText: getText1 } = renderComponent({ value: midnightValue, format: "12" });
      expect(getText1('12:00 AM')).toBeTruthy();

      // Test noon in 12-hour format
      const noonValue: TimeValue = { hours: 12, minutes: 0, period: 'PM' };
      const { getByText: getText2 } = renderComponent({ value: noonValue, format: "12" });
      expect(getText2('12:00 PM')).toBeTruthy();
    });
  });

  describe('Modal Interaction', () => {
    it('opens time picker modal on press', async () => {
      const { getByTestId, getByText } = renderComponent({ label: "Meeting time" });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        expect(getByText('Hours')).toBeTruthy();
        expect(getByText('Minutes')).toBeTruthy();
      });
    });

    it('does not open when disabled', () => {
      const { getByTestId, queryByText } = renderComponent({ disabled: true });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      expect(queryByText('Hours')).toBeNull();
    });

    it('closes modal on cancel', async () => {
      const { getByTestId, getByText, queryByText } = renderComponent();
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        expect(getByText('Cancel')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Cancel'));
      
      await waitFor(() => {
        expect(queryByText('Hours')).toBeNull();
      });
    });
  });

  describe('12-hour vs 24-hour formats', () => {
    it('shows AM/PM selector in 12-hour format', async () => {
      const { getByTestId, getByText } = renderComponent({ format: "12" });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        expect(getByText('Period')).toBeTruthy();
        expect(getByTestId('test-time-picker-period-AM')).toBeTruthy();
        expect(getByTestId('test-time-picker-period-PM')).toBeTruthy();
      });
    });

    it('does not show AM/PM selector in 24-hour format', async () => {
      const { getByTestId, queryByText } = renderComponent({ format: "24" });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        expect(queryByText('Period')).toBeNull();
      });
    });

    it('selects time correctly in 12-hour format', async () => {
      const { getByTestId } = renderComponent({ format: "12" });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        fireEvent.press(getByTestId('test-time-picker-hour-3'));
        fireEvent.press(getByTestId('test-time-picker-minute-15'));
        fireEvent.press(getByTestId('test-time-picker-period-PM'));
        fireEvent.press(getByTestId('test-time-picker-confirm'));
      });
      
      expect(mockOnChange).toHaveBeenCalledWith({
        hours: 3,
        minutes: 15,
        period: 'PM',
      });
    });

    it('selects time correctly in 24-hour format', async () => {
      const { getByTestId } = renderComponent({ format: "24" });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        fireEvent.press(getByTestId('test-time-picker-hour-15'));
        fireEvent.press(getByTestId('test-time-picker-minute-30'));
        fireEvent.press(getByTestId('test-time-picker-confirm'));
      });
      
      expect(mockOnChange).toHaveBeenCalledWith({
        hours: 15,
        minutes: 30,
      });
    });
  });

  describe('Time constraints', () => {
    it('respects minimum time constraint', async () => {
      const minTime: TimeValue = { hours: 9, minutes: 0, period: 'AM' };
      const { getByTestId } = renderComponent({ format: "12", minTime });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        // Try to select 8:00 AM (before minTime)
        fireEvent.press(getByTestId('test-time-picker-hour-8'));
        fireEvent.press(getByTestId('test-time-picker-minute-0'));
        fireEvent.press(getByTestId('test-time-picker-period-AM'));
      });
      
      // Confirm button should be disabled
      const confirmButton = getByTestId('test-time-picker-confirm');
      expect(confirmButton.props.accessibilityState.disabled).toBe(true);
    });

    it('allows valid time within constraints', async () => {
      const minTime: TimeValue = { hours: 9, minutes: 0, period: 'AM' };
      const maxTime: TimeValue = { hours: 5, minutes: 0, period: 'PM' };
      const { getByTestId } = renderComponent({ format: "12", minTime, maxTime });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        // Select all values in one sequence
        fireEvent.press(getByTestId('test-time-picker-hour-2'));
        fireEvent.press(getByTestId('test-time-picker-minute-0'));
        fireEvent.press(getByTestId('test-time-picker-period-PM'));
        fireEvent.press(getByTestId('test-time-picker-confirm'));
      });
      
      expect(mockOnChange).toHaveBeenCalled();
      // Verify that onChange was called at least once
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.period).toBe('PM');
      expect(lastCall.minutes).toBe(0);
      // The hour should be within our valid range
      expect(lastCall.hours).toBeGreaterThanOrEqual(1);
      expect(lastCall.hours).toBeLessThanOrEqual(12);
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role and states', () => {
      const value: TimeValue = { hours: 2, minutes: 30, period: 'PM' };
      const { getByTestId } = renderComponent({ value, disabled: true });
      
      const picker = getByTestId('test-time-picker');
      expect(picker.props.accessibilityRole).toBe('button');
      expect(picker.props.accessibilityState).toEqual({
        disabled: true,
        expanded: false,
      });
    });

    it('has correct accessibility label', () => {
      const value: TimeValue = { hours: 2, minutes: 30, period: 'PM' };
      const { getByTestId } = renderComponent({ label: "Meeting time", value });
      
      const picker = getByTestId('test-time-picker');
      expect(picker.props.accessibilityLabel).toBe('Meeting time, current value: 2:30 PM');
    });

    it('announces time picker open', async () => {
      const { getByTestId } = renderComponent({ label: "Meeting time", format: "12" });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          'Meeting time opened. Select hours, minutes, and AM or PM.'
        );
      });
    });

    it('announces time selection', async () => {
      const { getByTestId } = renderComponent({ format: "12" });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        fireEvent.press(getByTestId('test-time-picker-hour-3'));
        fireEvent.press(getByTestId('test-time-picker-minute-15'));
        fireEvent.press(getByTestId('test-time-picker-period-PM'));
        fireEvent.press(getByTestId('test-time-picker-confirm'));
      });
      
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Time selected: 3:15 PM'
      );
    });
  });

  describe('Variants and error states', () => {
    it('renders with error state', () => {
      const { getByText, queryByText } = renderComponent({ 
        error: "Time is required", 
        hint: "This hint should not show"
      });
      
      expect(getByText('Time is required')).toBeTruthy();
      expect(queryByText('This hint should not show')).toBeNull();
    });

    it('applies different variants', () => {
      const variants = ['default', 'success', 'warning', 'gentle'] as const;
      
      variants.forEach(variant => {
        const { getByTestId } = renderComponent({ variant, testID: `picker-${variant}` });
        
        const picker = getByTestId(`picker-${variant}`);
        expect(picker).toBeTruthy();
      });
    });

    it('applies different sizes', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const { getByTestId } = renderComponent({ size, testID: `picker-${size}` });
        
        const picker = getByTestId(`picker-${size}`);
        expect(picker).toBeTruthy();
      });
    });
  });

  describe('Integration with existing value', () => {
    it('initializes with current value', async () => {
      const value: TimeValue = { hours: 3, minutes: 15, period: 'PM' };
      const { getByTestId } = renderComponent({ value, format: "12" });
      
      fireEvent.press(getByTestId('test-time-picker'));
      
      await waitFor(() => {
        const hour3 = getByTestId('test-time-picker-hour-3');
        const minute15 = getByTestId('test-time-picker-minute-15');
        const periodPM = getByTestId('test-time-picker-period-PM');
        
        expect(hour3.props.accessibilityState.selected).toBe(true);
        expect(minute15.props.accessibilityState.selected).toBe(true);
        expect(periodPM.props.accessibilityState.selected).toBe(true);
      });
    });
  });
});