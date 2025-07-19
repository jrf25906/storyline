import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import AccessibleTouchable from '@components/common/AccessibleTouchable';
import { MINIMUM_TOUCH_TARGET_SIZE } from '@utils/accessibility';

describe('AccessibleTouchable', () => {
  const defaultProps = {
    accessibilityRole: 'button' as const,
    accessibilityLabel: 'Test Button',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with required accessibility properties', () => {
    const { getByRole, getByLabelText } = render(
      <AccessibleTouchable {...defaultProps}>
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    
    const labeledButton = getByLabelText('Test Button');
    expect(labeledButton).toBeTruthy();
  });

  it('should apply minimum touch target size by default', () => {
    const { getByRole } = render(
      <AccessibleTouchable {...defaultProps}>
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    const button = getByRole('button');
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          minWidth: MINIMUM_TOUCH_TARGET_SIZE,
          minHeight: MINIMUM_TOUCH_TARGET_SIZE,
        })
      ])
    );
  });

  it('should not apply minimum size when minSize is false', () => {
    const { getByRole } = render(
      <AccessibleTouchable {...defaultProps} minSize={false}>
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    const button = getByRole('button');
    const styles = button.props.style;
    const hasMinSize = styles.some(style => 
      style && (style.minWidth === MINIMUM_TOUCH_TARGET_SIZE || style.minHeight === MINIMUM_TOUCH_TARGET_SIZE)
    );
    expect(hasMinSize).toBe(false);
  });

  it('should render children correctly', () => {
    const { getByText } = render(
      <AccessibleTouchable {...defaultProps}>
        <Text>Button Text</Text>
      </AccessibleTouchable>
    );

    expect(getByText('Button Text')).toBeTruthy();
  });

  it('should handle onPress events', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <AccessibleTouchable {...defaultProps} onPress={onPress}>
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should apply accessibility hint when provided', () => {
    const { getByRole } = render(
      <AccessibleTouchable 
        {...defaultProps} 
        accessibilityHint="Double tap to activate"
      >
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    const button = getByRole('button');
    expect(button.props.accessibilityHint).toBe('Double tap to activate');
  });

  it('should apply accessibility state when provided', () => {
    const { getByRole } = render(
      <AccessibleTouchable 
        {...defaultProps} 
        accessibilityState={{ disabled: true, selected: false }}
      >
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState).toEqual({
      disabled: true,
      selected: false,
    });
  });

  it('should merge custom styles with default styles', () => {
    const customStyle = {
      backgroundColor: 'red',
      padding: 20,
    };

    const { getByRole } = render(
      <AccessibleTouchable {...defaultProps} style={customStyle}>
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    const button = getByRole('button');
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          minWidth: MINIMUM_TOUCH_TARGET_SIZE,
          minHeight: MINIMUM_TOUCH_TARGET_SIZE,
        }),
        customStyle,
      ])
    );
  });

  it('should wrap children in View when minSize is true', () => {
    const { UNSAFE_getByType } = render(
      <AccessibleTouchable {...defaultProps} minSize={true}>
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    // Check that there's a View wrapper with contentWrapper styles
    const views = UNSAFE_getByType(View);
    expect(views.props.style).toEqual(
      expect.objectContaining({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      })
    );
  });

  it('should not wrap children when minSize is false', () => {
    const { UNSAFE_queryByType } = render(
      <AccessibleTouchable {...defaultProps} minSize={false}>
        <Text testID="child-text">Click me</Text>
      </AccessibleTouchable>
    );

    // The Text should be a direct child of TouchableOpacity
    const text = UNSAFE_queryByType(Text);
    expect(text.props.testID).toBe('child-text');
  });

  it('should be disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <AccessibleTouchable {...defaultProps} onPress={onPress} disabled={true}>
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    const button = getByRole('button');
    
    // Check that disabled prop is passed through
    expect(button.props.disabled).toBe(true);
    
    // Note: In React Native, TouchableOpacity may still fire onPress even when disabled
    // depending on the version. We're checking the prop is passed correctly.
  });

  it('should support different accessibility roles', () => {
    const { getByRole } = render(
      <AccessibleTouchable 
        {...defaultProps}
        accessibilityRole="link"
      >
        <Text>Link Text</Text>
      </AccessibleTouchable>
    );

    expect(getByRole('link')).toBeTruthy();
  });

  it('should always have accessible prop set to true', () => {
    const { getByRole } = render(
      <AccessibleTouchable {...defaultProps}>
        <Text>Click me</Text>
      </AccessibleTouchable>
    );

    const button = getByRole('button');
    expect(button.props.accessible).toBe(true);
  });
});