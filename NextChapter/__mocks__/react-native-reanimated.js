// Mock for react-native-reanimated
const React = require('react');
const { View, Text, ScrollView, FlatList, Image } = require('react-native');

// Mock animated values
const makeMockAnimatedValue = (initialValue) => ({
  value: initialValue,
  setValue: jest.fn((value) => {
    this.value = value;
  }),
  interpolate: jest.fn((config) => initialValue),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  stopAnimation: jest.fn(),
  resetAnimation: jest.fn(),
});

// Mock hooks
const useSharedValue = (initialValue) => {
  return { value: initialValue };
};

const useAnimatedStyle = (styleFactory) => {
  return typeof styleFactory === 'function' ? styleFactory() : {};
};

const useAnimatedProps = (propsFactory) => {
  return typeof propsFactory === 'function' ? propsFactory() : {};
};

const useAnimatedGestureHandler = (handlers) => {
  return {};
};

const useAnimatedScrollHandler = (handlers) => {
  return {};
};

const useDerivedValue = (factory) => {
  return { value: factory() };
};

const useAnimatedRef = () => {
  return React.useRef(null);
};

// Mock animation functions
const withSpring = (value, config) => value;
const withTiming = (value, config) => value;
const withDecay = (value, config) => value;
const withDelay = (delay, animation) => animation;
const withRepeat = (animation, numberOfReps, reverse) => animation;
const withSequence = (...animations) => animations[0];

// Mock components
const createAnimatedComponent = (Component) => {
  const AnimatedComponent = React.forwardRef((props, ref) => {
    return React.createElement(Component, { ...props, ref });
  });
  AnimatedComponent.displayName = `Animated.${Component.displayName || Component.name || 'Component'}`;
  return AnimatedComponent;
};

const Animated = {
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  ScrollView: createAnimatedComponent(ScrollView),
  FlatList: createAnimatedComponent(FlatList),
  Image: createAnimatedComponent(Image),
  createAnimatedComponent,
};

// Mock Easing
const Easing = {
  linear: jest.fn(),
  ease: jest.fn(),
  quad: jest.fn(),
  cubic: jest.fn(),
  poly: jest.fn(),
  sin: jest.fn(),
  circle: jest.fn(),
  exp: jest.fn(),
  elastic: jest.fn(),
  back: jest.fn(),
  bounce: jest.fn(),
  bezier: jest.fn(),
  in: jest.fn(),
  out: jest.fn(),
  inOut: jest.fn(),
};

// Mock other utilities
const interpolate = (value, inputRange, outputRange, extrapolate) => {
  return outputRange[0];
};

const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;

module.exports = {
  default: {
    ...Animated,
    Value: makeMockAnimatedValue,
    Clock: jest.fn(),
    Node: jest.fn(),
    block: jest.fn((arr) => arr),
    cond: jest.fn((condition, ifBlock, elseBlock) => ifBlock),
    set: jest.fn(),
    add: jest.fn((a, b) => a + b),
    sub: jest.fn((a, b) => a - b),
    multiply: jest.fn((a, b) => a * b),
    divide: jest.fn((a, b) => a / b),
    pow: jest.fn((a, b) => Math.pow(a, b)),
    modulo: jest.fn((a, b) => a % b),
    sqrt: jest.fn(Math.sqrt),
    log: jest.fn(Math.log),
    sin: jest.fn(Math.sin),
    cos: jest.fn(Math.cos),
    tan: jest.fn(Math.tan),
    acos: jest.fn(Math.acos),
    asin: jest.fn(Math.asin),
    atan: jest.fn(Math.atan),
    exp: jest.fn(Math.exp),
    round: jest.fn(Math.round),
    floor: jest.fn(Math.floor),
    ceil: jest.fn(Math.ceil),
    abs: jest.fn(Math.abs),
    min: jest.fn(Math.min),
    max: jest.fn(Math.max),
    eq: jest.fn((a, b) => a === b),
    neq: jest.fn((a, b) => a !== b),
    and: jest.fn((a, b) => a && b),
    or: jest.fn((a, b) => a || b),
    not: jest.fn((a) => !a),
    defined: jest.fn((a) => a !== undefined),
    greaterThan: jest.fn((a, b) => a > b),
    lessThan: jest.fn((a, b) => a < b),
    greaterOrEq: jest.fn((a, b) => a >= b),
    lessOrEq: jest.fn((a, b) => a <= b),
    proc: jest.fn((fn) => fn),
    call: jest.fn((fn, ...args) => fn(...args)),
    debug: jest.fn(),
    onChange: jest.fn(),
    startClock: jest.fn(),
    stopClock: jest.fn(),
    clockRunning: jest.fn(),
    event: jest.fn(),
    decay: jest.fn(),
    timing: jest.fn(),
    spring: jest.fn(),
    SpringUtils: {
      makeDefaultConfig: jest.fn(),
      makeConfigFromBouncinessAndSpeed: jest.fn(),
      makeConfigFromOrigamiTensionAndFriction: jest.fn(),
    },
    Extrapolate: {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity',
    },
  },
  // Reanimated 2 API
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  useDerivedValue,
  useAnimatedRef,
  withSpring,
  withTiming,
  withDecay,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
  runOnUI,
  makeMutable: (value) => ({ value }),
  // Layout animations
  FadeIn: { duration: jest.fn(() => ({ duration: 300 })) },
  FadeOut: { duration: jest.fn(() => ({ duration: 300 })) },
  SlideInRight: { duration: jest.fn(() => ({ duration: 300 })) },
  SlideOutLeft: { duration: jest.fn(() => ({ duration: 300 })) },
};