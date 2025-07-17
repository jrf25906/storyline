// Mock for @react-navigation/bottom-tabs
const React = require('react');

const createBottomTabNavigator = () => {
  const Navigator = ({ children, screenOptions, tabBar, ...props }) => children;
  
  const Screen = ({ name, component: Component, options, ...props }) => {
    // Return null as screens are handled by the navigator
    return null;
  };
  
  Navigator.Screen = Screen;
  Navigator.Navigator = Navigator;
  
  return {
    Navigator,
    Screen,
  };
};

// Mock tab bar components
const BottomTabBar = ({ state, descriptors, navigation, ...props }) => null;
const BottomTabView = ({ state, descriptors, navigation, ...props }) => null;

// Mock hooks
const useBottomTabBarHeight = () => 49; // Default tab bar height

module.exports = {
  createBottomTabNavigator,
  
  // Components
  BottomTabBar,
  BottomTabView,
  
  // Hooks
  useBottomTabBarHeight,
  
  // Utilities
  BottomTabBarHeightContext: React.createContext(49),
  BottomTabBarHeightCallbackContext: React.createContext(() => {}),
};