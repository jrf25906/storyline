/**
 * Jest Setup for React Native Testing
 * 
 * Configures proper behavior for React Native components in tests
 */

// import '@testing-library/jest-native/extend-expect'; // TODO: Fix dependency conflict

// Mock TouchableOpacity to avoid circular dependency issues
jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => {
  const React = require('react');
  
  const MockTouchableOpacity = React.forwardRef((props: any, ref: any) => {
    const { onPress, disabled, children, style, testID, accessibilityLabel, accessibilityHint, accessibilityRole, accessibilityState, hitSlop, ...otherProps } = props;
    
    return React.createElement('TouchableOpacity', {
      ...otherProps,
      onPress: disabled ? undefined : onPress,
      disabled,
      style,
      testID,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
      accessibilityState,
      hitSlop,
      ref,
    }, children);
  });

  MockTouchableOpacity.displayName = 'TouchableOpacity';
  
  return MockTouchableOpacity;
});

// Add custom test matchers
expect.extend({
  toMatchStyle(received: any, expected: any) {
    // Flatten style arrays and objects
    const flattenStyle = (style: any): any => {
      if (Array.isArray(style)) {
        return style.reduce((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
      }
      return style || {};
    };

    const receivedFlat = flattenStyle(received);
    const expectedFlat = flattenStyle(expected);

    const pass = Object.keys(expectedFlat).every(
      key => receivedFlat[key] === expectedFlat[key]
    );

    return {
      pass,
      message: () =>
        pass
          ? `expected style not to match ${JSON.stringify(expectedFlat)}`
          : `expected style to match ${JSON.stringify(expectedFlat)}, but got ${JSON.stringify(receivedFlat)}`,
    };
  },
});