// Mock for react-native-screens
const React = require('react');
const { View } = require('react-native');

// Mock Screen component
const Screen = React.forwardRef(({ children, active = true, ...props }, ref) => {
  return React.createElement(View, { ...props, ref }, children);
});
Screen.displayName = 'Screen';

// Mock ScreenContainer
const ScreenContainer = ({ children, ...props }) => {
  return React.createElement(View, props, children);
};

// Mock other components
const NativeScreen = Screen;
const NativeScreenContainer = ScreenContainer;
const ScreenStack = ScreenContainer;
const ScreenStackHeaderConfig = ({ children, ...props }) => null;
const ScreenStackHeaderBackButton = ({ onPress, ...props }) => null;
const ScreenStackHeaderRightView = ({ children, ...props }) => null;
const ScreenStackHeaderLeftView = ({ children, ...props }) => null;
const ScreenStackHeaderCenterView = ({ children, ...props }) => null;
const ScreenStackHeaderSearchBarView = ({ children, ...props }) => null;

// Mock hooks and utilities
const shouldUseActivityState = true;
const enableScreens = jest.fn();
const enableFreeze = jest.fn();
const screensEnabled = jest.fn(() => true);

// Mock constants
const ScreenStackHeaderBackButtonDisplayMode = {
  default: 'default',
  generic: 'generic',
  minimal: 'minimal',
};

module.exports = {
  // Components
  Screen,
  ScreenContainer,
  NativeScreen,
  NativeScreenContainer,
  ScreenStack,
  ScreenStackHeaderConfig,
  ScreenStackHeaderBackButton,
  ScreenStackHeaderRightView,
  ScreenStackHeaderLeftView,
  ScreenStackHeaderCenterView,
  ScreenStackHeaderSearchBarView,
  
  // Utilities
  shouldUseActivityState,
  enableScreens,
  enableFreeze,
  screensEnabled,
  
  // Constants
  ScreenStackHeaderBackButtonDisplayMode,
};