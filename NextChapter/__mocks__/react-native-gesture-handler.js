// Mock for react-native-gesture-handler
const React = require('react');
const { View, ScrollView, FlatList, TouchableOpacity, TouchableHighlight, TouchableWithoutFeedback } = require('react-native');

// Mock gesture handler components
const createMockComponent = (name) => {
  const Component = React.forwardRef((props, ref) => {
    const { children, onGestureEvent, onHandlerStateChange, ...otherProps } = props;
    return React.createElement(View, { ...otherProps, ref, testID: props.testID || name }, children);
  });
  Component.displayName = name;
  return Component;
};

// Mock gesture handlers
const TapGestureHandler = createMockComponent('TapGestureHandler');
const PanGestureHandler = createMockComponent('PanGestureHandler');
const PinchGestureHandler = createMockComponent('PinchGestureHandler');
const RotationGestureHandler = createMockComponent('RotationGestureHandler');
const LongPressGestureHandler = createMockComponent('LongPressGestureHandler');
const FlingGestureHandler = createMockComponent('FlingGestureHandler');
const ForceTouchGestureHandler = createMockComponent('ForceTouchGestureHandler');

// Mock animated event
const createNativeAnimatedEvent = () => jest.fn();

// Mock State
const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

// Mock Directions
const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};

// Mock touchable components
const BaseButton = React.forwardRef((props, ref) => 
  React.createElement(TouchableOpacity, { ...props, ref })
);
BaseButton.displayName = 'BaseButton';

const RectButton = React.forwardRef((props, ref) => 
  React.createElement(TouchableOpacity, { ...props, ref })
);
RectButton.displayName = 'RectButton';

const BorderlessButton = React.forwardRef((props, ref) => 
  React.createElement(TouchableOpacity, { ...props, ref })
);
BorderlessButton.displayName = 'BorderlessButton';

// Mock ScrollView and FlatList
const NativeViewGestureHandler = createMockComponent('NativeViewGestureHandler');

const ScrollViewComponent = React.forwardRef((props, ref) => 
  React.createElement(ScrollView, { ...props, ref })
);
ScrollViewComponent.displayName = 'ScrollView';

const FlatListComponent = React.forwardRef((props, ref) => 
  React.createElement(FlatList, { ...props, ref })
);
FlatListComponent.displayName = 'FlatList';

// Mock gesture handler root view
const GestureHandlerRootView = ({ children, ...props }) => 
  React.createElement(View, props, children);

// Mock TouchableNativeFeedback
const TouchableNativeFeedback = React.forwardRef((props, ref) => 
  React.createElement(TouchableOpacity, { ...props, ref })
);
TouchableNativeFeedback.displayName = 'TouchableNativeFeedback';

// Mock DrawerLayout
const DrawerLayout = createMockComponent('DrawerLayout');

// Mock Swipeable
const Swipeable = createMockComponent('Swipeable');

module.exports = {
  // Gesture Handlers
  TapGestureHandler,
  PanGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  LongPressGestureHandler,
  FlingGestureHandler,
  ForceTouchGestureHandler,
  NativeViewGestureHandler,
  
  // Touchables
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  BaseButton,
  RectButton,
  BorderlessButton,
  
  // Components
  ScrollView: ScrollViewComponent,
  FlatList: FlatListComponent,
  GestureHandlerRootView,
  DrawerLayout,
  Swipeable,
  
  // Constants
  State,
  Directions,
  
  // Helpers
  createNativeAnimatedEvent,
  
  // Legacy exports
  gestureHandlerRootHOC: (Component) => Component,
  default: {
    TapGestureHandler,
    PanGestureHandler,
    State,
    Directions,
  },
};