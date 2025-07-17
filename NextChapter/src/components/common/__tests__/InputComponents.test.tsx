import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeTestWrapper, renderWithTheme } from '../../../test-utils/ThemeTestWrapper';
import Input from '../Input';
import Checkbox from '../Checkbox';
import Radio from '../Radio';
import { Colors, Spacing, Typography, Borders, Shadows } from '../../../theme';

describe('Input Component', () => {
  describe('Styling', () => {
    it('should render with correct padding (16px)', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="test-input" placeholder="Enter text" />
      );
      
      const input = getByTestId('test-input').children[0];
      expect(input.props.style).toMatchObject({
        paddingHorizontal: 16,
        paddingVertical: Spacing.sm,
      });
    });

    it('should have 8px border radius', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="test-input" placeholder="Enter text" />
      );
      
      const input = getByTestId('test-input').children[0];
      expect(input.props.style).toMatchObject({
        borderRadius: 8,
      });
    });

    it('should have 2px border in light gray by default', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="test-input" placeholder="Enter text" />
      );
      
      const input = getByTestId('test-input').children[0];
      expect(input.props.style).toMatchObject({
        borderWidth: 2,
        borderColor: Colors.border,
      });
    });

    it('should show primary green border on focus', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="test-input" placeholder="Enter text" />
      );
      
      const input = getByTestId('test-input').children[0];
      fireEvent(input, 'focus');
      
      expect(input.props.style).toMatchObject({
        borderColor: Colors.primary,
      });
    });

    it('should have italic placeholder text in tertiary color', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <Input placeholder="Enter text" />
      );
      
      const input = getByPlaceholderText('Enter text');
      expect(input.props.placeholderTextColor).toBe(Colors.textTertiary);
      expect(input.props.style).toMatchObject({
        fontStyle: 'italic',
      });
    });

    it('should show focus shadow when focused', async () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="test-input" placeholder="Enter text" />
      );
      
      const container = getByTestId('test-input');
      const input = container.children[0];
      
      fireEvent(input, 'focus');
      
      await waitFor(() => {
        expect(container.props.style).toMatchObject({
          ...Shadows.focus,
        });
      });
    });

    it('should use Gentle Coral color for error states', () => {
      const { getByText } = renderWithTheme(
        <Input error="This field is required" />
      );
      
      const errorText = getByText('This field is required');
      expect(errorText.props.style).toMatchObject({
        color: Colors.gentleCoral,
      });
    });

    it('should have smooth focus/blur transitions', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="test-input" placeholder="Enter text" />
      );
      
      const container = getByTestId('test-input');
      expect(container.props.style).toMatchObject({
        transitionProperty: 'box-shadow, border-color',
        transitionDuration: '200ms',
        transitionTimingFunction: 'ease',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = renderWithTheme(
        <Input label="Email Address" placeholder="Enter your email" />
      );
      
      const input = getByLabelText('Email Address');
      expect(input).toBeTruthy();
    });

    it('should announce error messages', () => {
      const { getByRole } = renderWithTheme(
        <Input error="Invalid email format" />
      );
      
      const errorAlert = getByRole('alert');
      expect(errorAlert.props.accessibilityLiveRegion).toBe('polite');
    });

    it('should indicate required fields', () => {
      const { getByText } = renderWithTheme(
        <Input label="Email" required />
      );
      
      const requiredIndicator = getByText('*');
      expect(requiredIndicator).toBeTruthy();
    });
  });

  describe('Dark Mode', () => {
    it('should use dark theme colors', () => {
      const { getByTestId } = renderWithTheme(
        <Input testID="test-input" placeholder="Enter text" />,
        true
      );
      
      const input = getByTestId('test-input').children[0];
      expect(input.props.style).toMatchObject({
        backgroundColor: Colors.dark.surfaceVariant,
        color: Colors.dark.textPrimary,
        borderColor: Colors.dark.border,
      });
    });
  });
});

describe('Checkbox Component', () => {
  describe('Styling', () => {
    it('should be 24x24px with rounded corners', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="test-checkbox" label="Accept terms" />
      );
      
      const checkbox = getByTestId('test-checkbox-box');
      expect(checkbox.props.style).toMatchObject({
        width: 24,
        height: 24,
        borderRadius: 4,
      });
    });

    it('should have 2px border in light gray', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="test-checkbox" label="Accept terms" />
      );
      
      const checkbox = getByTestId('test-checkbox-box');
      expect(checkbox.props.style).toMatchObject({
        borderWidth: 2,
        borderColor: Colors.border,
      });
    });

    it('should show primary green background when checked', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="test-checkbox" label="Accept terms" checked />
      );
      
      const checkbox = getByTestId('test-checkbox-box');
      expect(checkbox.props.style).toMatchObject({
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
      });
    });

    it('should show white checkmark when checked', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="test-checkbox" label="Accept terms" checked />
      );
      
      const checkmark = getByTestId('test-checkbox-checkmark');
      expect(checkmark.props.style).toMatchObject({
        color: Colors.white,
      });
    });

    it('should have smooth check/uncheck animation', async () => {
      const { getByTestId, rerender } = renderWithTheme(
        <Checkbox testID="test-checkbox" label="Accept terms" checked={false} />
      );
      
      const checkbox = getByTestId('test-checkbox-box');
      expect(checkbox.props.style).toMatchObject({
        transitionProperty: 'background-color, border-color',
        transitionDuration: '200ms',
      });
      
      rerender(
        <ThemeProvider initialTheme="light">
          <Checkbox testID="test-checkbox" label="Accept terms" checked />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        expect(checkbox.props.style).toMatchObject({
          backgroundColor: Colors.primary,
        });
      });
    });

    it('should show focus state', () => {
      const { getByTestId } = renderWithTheme(
        <Checkbox testID="test-checkbox" label="Accept terms" />
      );
      
      const touchable = getByTestId('test-checkbox-touchable');
      fireEvent(touchable, 'pressIn');
      
      const container = getByTestId('test-checkbox');
      expect(container.props.style).toMatchObject({
        ...Shadows.focus,
      });
    });
  });

  describe('Functionality', () => {
    it('should toggle checked state on press', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = renderWithTheme(
        <Checkbox 
          testID="test-checkbox" 
          label="Accept terms" 
          onValueChange={onValueChange}
        />
      );
      
      const touchable = getByTestId('test-checkbox-touchable');
      fireEvent.press(touchable);
      
      expect(onValueChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Accessibility', () => {
    it('should have checkbox role', () => {
      const { getByRole } = renderWithTheme(
        <Checkbox label="Accept terms" />
      );
      
      const checkbox = getByRole('checkbox');
      expect(checkbox).toBeTruthy();
    });

    it('should announce checked state', () => {
      const { getByRole } = renderWithTheme(
        <Checkbox label="Accept terms" checked />
      );
      
      const checkbox = getByRole('checkbox');
      expect(checkbox.props.accessibilityState).toMatchObject({
        checked: true,
      });
    });
  });
});

describe('Radio Component', () => {
  describe('Styling', () => {
    it('should be circular with 24x24px size', () => {
      const { getByTestId } = renderWithTheme(
        <Radio testID="test-radio" label="Option 1" value="option1" />
      );
      
      const radio = getByTestId('test-radio-circle');
      expect(radio.props.style).toMatchObject({
        width: 24,
        height: 24,
        borderRadius: 12,
      });
    });

    it('should have 2px border in light gray', () => {
      const { getByTestId } = renderWithTheme(
        <Radio testID="test-radio" label="Option 1" value="option1" />
      );
      
      const radio = getByTestId('test-radio-circle');
      expect(radio.props.style).toMatchObject({
        borderWidth: 2,
        borderColor: Colors.border,
      });
    });

    it('should show primary green border when selected', () => {
      const { getByTestId } = renderWithTheme(
        <Radio testID="test-radio" label="Option 1" value="option1" selected />
      );
      
      const radio = getByTestId('test-radio-circle');
      expect(radio.props.style).toMatchObject({
        borderColor: Colors.primary,
      });
    });

    it('should show inner dot when selected', () => {
      const { getByTestId } = renderWithTheme(
        <Radio testID="test-radio" label="Option 1" value="option1" selected />
      );
      
      const dot = getByTestId('test-radio-dot');
      expect(dot.props.style).toMatchObject({
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
      });
    });

    it('should have smooth selection animation', async () => {
      const { getByTestId, rerender } = renderWithTheme(
        <Radio testID="test-radio" label="Option 1" value="option1" selected={false} />
      );
      
      rerender(
        <ThemeProvider initialTheme="light">
          <Radio testID="test-radio" label="Option 1" value="option1" selected />
        </ThemeProvider>
      );
      
      await waitFor(() => {
        const dot = getByTestId('test-radio-dot');
        expect(dot.props.style).toMatchObject({
          transform: [{ scale: 1 }],
          opacity: 1,
        });
      });
    });
  });

  describe('Group Functionality', () => {
    it('should work in a radio group', () => {
      const onValueChange = jest.fn();
      const { getByText } = renderWithTheme(
        <Radio.Group value="option1" onValueChange={onValueChange}>
          <Radio label="Option 1" value="option1" />
          <Radio label="Option 2" value="option2" />
          <Radio label="Option 3" value="option3" />
        </Radio.Group>
      );
      
      fireEvent.press(getByText('Option 2'));
      expect(onValueChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('Accessibility', () => {
    it('should have radio role', () => {
      const { getByRole } = renderWithTheme(
        <Radio label="Option 1" value="option1" />
      );
      
      const radio = getByRole('radio');
      expect(radio).toBeTruthy();
    });

    it('should announce selected state', () => {
      const { getByRole } = renderWithTheme(
        <Radio label="Option 1" value="option1" selected />
      );
      
      const radio = getByRole('radio');
      expect(radio.props.accessibilityState).toMatchObject({
        selected: true,
      });
    });
  });
});

describe('Error States', () => {
  it('should use Gentle Coral for all error messages', () => {
    const { getByText: getInputError } = renderWithTheme(
      <Input error="Email is required" />
    );
    
    const { getByText: getCheckboxError } = renderWithTheme(
      <Checkbox label="Terms" error="You must accept the terms" />
    );
    
    const { getByText: getRadioError } = renderWithTheme(
      <Radio.Group error="Please select an option">
        <Radio label="Option 1" value="option1" />
      </Radio.Group>
    );
    
    expect(getInputError('Email is required').props.style).toMatchObject({
      color: Colors.gentleCoral,
    });
    
    expect(getCheckboxError('You must accept the terms').props.style).toMatchObject({
      color: Colors.gentleCoral,
    });
    
    expect(getRadioError('Please select an option').props.style).toMatchObject({
      color: Colors.gentleCoral,
    });
  });
  
  it('should show error border color on inputs', () => {
    const { getByTestId } = renderWithTheme(
      <Input testID="test-input" error="This field has an error" />
    );
    
    const input = getByTestId('test-input').children[0];
    expect(input.props.style).toMatchObject({
      borderColor: Colors.gentleCoral,
    });
  });
});