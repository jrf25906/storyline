// Mock for @react-navigation/stack
const React = require('react');

const createStackNavigator = () => {
  const Navigator = ({ children, screenOptions, ...props }) => children;
  
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

// Mock header components
const Header = ({ scene, previous, navigation }) => null;
const HeaderBackButton = ({ onPress, ...props }) => null;
const HeaderTitle = ({ children, ...props }) => null;
const HeaderBackground = ({ children, ...props }) => null;

// Mock transition specs
const TransitionSpecs = {
  TransitionIOSSpec: {
    animation: 'spring',
    config: {
      stiffness: 1000,
      damping: 500,
      mass: 3,
      overshootClamping: true,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
  },
  FadeSpec: {
    animation: 'timing',
    config: {
      duration: 150,
    },
  },
  CardStyleInterpolators: {
    forHorizontalIOS: jest.fn(),
    forVerticalIOS: jest.fn(),
    forModalPresentationIOS: jest.fn(),
    forFadeFromBottomAndroid: jest.fn(),
    forRevealFromBottomAndroid: jest.fn(),
    forScaleFromCenterAndroid: jest.fn(),
    forNoAnimation: jest.fn(),
  },
  HeaderStyleInterpolators: {
    forUIKit: jest.fn(),
    forFade: jest.fn(),
    forStatic: jest.fn(),
  },
  TransitionPresets: {
    SlideFromRightIOS: {},
    ModalSlideFromBottomIOS: {},
    ModalPresentationIOS: {},
    FadeFromBottomAndroid: {},
    RevealFromBottomAndroid: {},
    ScaleFromCenterAndroid: {},
    DefaultTransition: {},
    ModalTransition: {},
  },
};

module.exports = {
  createStackNavigator,
  
  // Header components
  Header,
  HeaderBackButton,
  HeaderTitle,
  HeaderBackground,
  
  // Transition specs
  ...TransitionSpecs,
  
  // Stack navigation options
  CardAnimationContext: React.createContext(null),
  GestureHandlerRefContext: React.createContext(null),
  HeaderBackContext: React.createContext(null),
  HeaderHeightContext: React.createContext(null),
  HeaderShownContext: React.createContext(null),
  
  // Utilities
  useCardAnimation: () => ({
    current: {
      progress: { value: 1 },
    },
  }),
  useGestureHandlerRef: () => React.useRef(null),
  useHeaderHeight: () => 44,
  
  // Assets
  Assets: [],
};