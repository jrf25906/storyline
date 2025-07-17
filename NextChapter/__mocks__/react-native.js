const React = require('react');

// Mock components
const View = (props) => React.createElement('View', props);
const Text = (props) => React.createElement('Text', props);
const TextInput = (props) => React.createElement('TextInput', props);
const TouchableOpacity = (props) => React.createElement('TouchableOpacity', props);
const TouchableHighlight = (props) => React.createElement('TouchableHighlight', props);
const TouchableWithoutFeedback = (props) => React.createElement('TouchableWithoutFeedback', props);
const Pressable = (props) => React.createElement('Pressable', props);
const ScrollView = (props) => React.createElement('ScrollView', props);
const FlatList = (props) => React.createElement('FlatList', props);
const Modal = (props) => React.createElement('Modal', props);
const Image = (props) => React.createElement('Image', props);
const SafeAreaView = (props) => React.createElement('SafeAreaView', props);
const ActivityIndicator = (props) => React.createElement('ActivityIndicator', props);
const Switch = (props) => React.createElement('Switch', props);
const RefreshControl = (props) => React.createElement('RefreshControl', props);
const StatusBar = (props) => React.createElement('StatusBar', props);
const KeyboardAvoidingView = (props) => React.createElement('KeyboardAvoidingView', props);
const VirtualizedList = (props) => React.createElement('VirtualizedList', props);
const SectionList = (props) => React.createElement('SectionList', props);
const Button = (props) => React.createElement('Button', props);

// Mock StyleSheet
const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => Object.assign({}, ...(Array.isArray(style) ? style : [style])),
  hairlineWidth: 1,
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

// Mock Dimensions
const Dimensions = {
  get: (dim) => {
    const dimensions = {
      window: { width: 375, height: 812, scale: 2, fontScale: 1 },
      screen: { width: 375, height: 812, scale: 2, fontScale: 1 },
    };
    return dimensions[dim] || dimensions.window;
  },
  set: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
};

// Mock PixelRatio
const PixelRatio = {
  get: () => 2,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size) => size * 2,
  roundToNearestPixel: (size) => Math.round(size * 2) / 2,
};

// Mock Platform
const Platform = {
  OS: 'ios',
  Version: 14,
  select: (obj) => obj.ios || obj.default,
  isPad: false,
  isTV: false,
  isTesting: true,
};

// Mock Animated
const Animated = {
  Value: class {
    constructor(value) {
      this._value = value;
    }
    setValue(value) {
      this._value = value;
    }
    setOffset() {}
    flattenOffset() {}
    extractOffset() {}
    addListener() {
      return { remove: jest.fn() };
    }
    removeAllListeners() {}
    interpolate() {
      return this;
    }
  },
  ValueXY: class {
    constructor() {
      this.x = new Animated.Value(0);
      this.y = new Animated.Value(0);
    }
    setValue() {}
    setOffset() {}
    flattenOffset() {}
    extractOffset() {}
  },
  timing: () => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
  }),
  spring: () => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
  }),
  decay: () => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
  }),
  parallel: () => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
  }),
  sequence: () => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
  }),
  loop: () => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
  }),
  delay: () => ({
    start: jest.fn((cb) => cb && cb({ finished: true })),
    stop: jest.fn(),
  }),
  View,
  Text,
  Image,
  ScrollView,
  createAnimatedComponent: (component) => component,
  event: jest.fn(),
  add: jest.fn(),
  subtract: jest.fn(),
  multiply: jest.fn(),
  divide: jest.fn(),
  modulo: jest.fn(),
};

// Mock Alert
const Alert = {
  alert: jest.fn((title, message, buttons) => {
    if (buttons && buttons.length > 0 && buttons[0].onPress) {
      buttons[0].onPress();
    }
  }),
};

// Mock Linking
const Linking = {
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
};

// Mock Keyboard
const Keyboard = {
  dismiss: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

// Mock AppState
const AppState = {
  currentState: 'active',
  isAvailable: true,
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
};

// Mock PanResponder
const PanResponder = {
  create: jest.fn(() => ({
    panHandlers: {},
  })),
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

// Mock NativeModules
const NativeModules = {
  UIManager: {
    RCTView: {
      directEventTypes: {},
    },
    getViewManagerConfig: jest.fn(() => ({})),
  },
  DeviceInfo: {
    getConstants: () => ({
      Dimensions: {
        window: { width: 375, height: 812, scale: 2, fontScale: 1 },
        screen: { width: 375, height: 812, scale: 2, fontScale: 1 },
      },
    }),
  },
  PlatformConstants: {
    getConstants: () => ({
      forceTouchAvailable: false,
      interfaceIdiom: 'phone',
      isTesting: true,
      osVersion: '14.0',
      reactNativeVersion: { major: 0, minor: 72, patch: 0 },
      systemName: 'iOS',
    }),
  },
  DevMenu: {
    show: jest.fn(),
    reload: jest.fn(),
    debugRemotely: jest.fn(),
    setProfilingEnabled: jest.fn(),
    setLiveReloadEnabled: jest.fn(),
    setHotLoadingEnabled: jest.fn(),
  },
  SettingsManager: {
    getConstants: () => ({}),
    setValues: jest.fn(),
    deleteValues: jest.fn(),
  },
};

// Mock LayoutAnimation
const LayoutAnimation = {
  configureNext: jest.fn(),
  create: jest.fn(),
  Types: {
    spring: 'spring',
    linear: 'linear',
    easeInEaseOut: 'easeInEaseOut',
    easeIn: 'easeIn',
    easeOut: 'easeOut',
  },
  Properties: {
    opacity: 'opacity',
    scaleXY: 'scaleXY',
  },
  Presets: {
    easeInEaseOut: {},
    linear: {},
    spring: {},
  },
};

// Export all mocks
module.exports = {
  // Components
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Pressable,
  ScrollView,
  FlatList,
  Modal,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  RefreshControl,
  StatusBar,
  KeyboardAvoidingView,
  VirtualizedList,
  SectionList,
  Button,
  
  // APIs
  StyleSheet,
  Dimensions,
  PixelRatio,
  Platform,
  Animated,
  Alert,
  Linking,
  Keyboard,
  AppState,
  PanResponder,
  Easing,
  NativeModules,
  LayoutAnimation,
  
  // Additional exports
  InteractionManager: {
    runAfterInteractions: jest.fn((cb) => cb()),
    createInteractionHandle: jest.fn(),
    clearInteractionHandle: jest.fn(),
    setDeadline: jest.fn(),
  },
  
  findNodeHandle: jest.fn(),
  
  I18nManager: {
    isRTL: false,
    forceRTL: jest.fn(),
    allowRTL: jest.fn(),
    swapLeftAndRightInRTL: jest.fn(),
    getConstants: () => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: false,
    }),
  },
  
  UIManager: {
    measure: jest.fn(),
    measureInWindow: jest.fn(),
    measureLayout: jest.fn(),
    setLayoutAnimationEnabledExperimental: jest.fn(),
  },
  
  requireNativeComponent: jest.fn((name) => name),
  
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
    emit: jest.fn(),
  })),
  
  Vibration: {
    vibrate: jest.fn(),
    cancel: jest.fn(),
  },
  
  Share: {
    share: jest.fn(() => Promise.resolve({ action: 'sharedAction' })),
  },
  
  Clipboard: {
    getString: jest.fn(() => Promise.resolve('')),
    setString: jest.fn(),
  },
  
  Settings: {
    get: jest.fn(),
    set: jest.fn(),
    watchKeys: jest.fn(),
    clearWatch: jest.fn(),
  },
  
  DeviceEventEmitter: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeListener: jest.fn(),
    emit: jest.fn(),
  },
  
  BackHandler: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    exitApp: jest.fn(),
  },
  
  AccessibilityInfo: {
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    announceForAccessibility: jest.fn(),
  },
  
  PermissionsAndroid: {
    request: jest.fn(() => Promise.resolve('granted')),
    requestMultiple: jest.fn(() => Promise.resolve({})),
    check: jest.fn(() => Promise.resolve(true)),
    PERMISSIONS: {},
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
  },
  
  // Hooks
  useColorScheme: jest.fn(() => 'light'),
  useWindowDimensions: jest.fn(() => ({ width: 375, height: 812, scale: 2, fontScale: 1 })),
};