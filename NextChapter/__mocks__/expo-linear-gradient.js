// Mock for expo-linear-gradient
const React = require('react');
const { View } = require('react-native');

const LinearGradient = React.forwardRef((props, ref) => {
  const { colors, start, end, locations, style, children, ...otherProps } = props;
  
  // Create a simple View with the first color as background
  const backgroundColor = colors && colors.length > 0 ? colors[0] : 'transparent';
  
  return React.createElement(View, {
    ...otherProps,
    ref,
    style: [style, { backgroundColor }],
    testID: props.testID || 'linear-gradient',
  }, children);
});

LinearGradient.displayName = 'LinearGradient';

module.exports = { LinearGradient };