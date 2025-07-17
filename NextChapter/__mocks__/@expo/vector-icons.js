// Mock for @expo/vector-icons
const React = require('react');
const { Text } = require('react-native');

const createIconComponent = (name) => {
  return React.forwardRef((props, ref) => {
    return React.createElement(Text, {
      ...props,
      ref,
      testID: props.testID || `icon-${name}`,
    }, props.name || name);
  });
};

module.exports = {
  Feather: createIconComponent('Feather'),
  FontAwesome: createIconComponent('FontAwesome'),
  Ionicons: createIconComponent('Ionicons'),
  MaterialIcons: createIconComponent('MaterialIcons'),
  MaterialCommunityIcons: createIconComponent('MaterialCommunityIcons'),
  Entypo: createIconComponent('Entypo'),
  EvilIcons: createIconComponent('EvilIcons'),
  Foundation: createIconComponent('Foundation'),
  Octicons: createIconComponent('Octicons'),
  SimpleLineIcons: createIconComponent('SimpleLineIcons'),
  Zocial: createIconComponent('Zocial'),
  AntDesign: createIconComponent('AntDesign'),
};