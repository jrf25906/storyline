/**
 * Jest Setup for React Native Testing
 * 
 * Configures proper behavior for React Native components in tests
 */

// import '@testing-library/jest-native/extend-expect'; // TODO: Fix dependency conflict

// Properly mock TouchableOpacity to respect disabled prop
jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => {
  const React = require('react');
  const { TouchableOpacity: RealTouchableOpacity } = jest.requireActual('react-native');

  const MockTouchableOpacity = React.forwardRef((props: any, ref: any) => {
    return React.createElement(RealTouchableOpacity, {
      ...props,
      onPress: props.disabled ? undefined : props.onPress,
      ref,
    });
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