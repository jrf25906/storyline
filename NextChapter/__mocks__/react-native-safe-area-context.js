// Mock for react-native-safe-area-context
const React = require('react');
const { View } = require('react-native');

const defaultInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const SafeAreaContext = React.createContext({
  insets: defaultInsets,
  frame: { x: 0, y: 0, width: 0, height: 0 },
});

const SafeAreaProvider = ({ children, initialMetrics, ...props }) => {
  const value = React.useMemo(
    () => ({
      insets: initialMetrics?.insets || defaultInsets,
      frame: initialMetrics?.frame || { x: 0, y: 0, width: 0, height: 0 },
    }),
    [initialMetrics]
  );

  return React.createElement(
    SafeAreaContext.Provider,
    { value },
    React.createElement(View, props, children)
  );
};

const SafeAreaView = React.forwardRef(({ children, edges, mode, ...props }, ref) => {
  const { insets } = React.useContext(SafeAreaContext);
  
  const style = {
    paddingTop: edges?.includes('top') ? insets.top : 0,
    paddingRight: edges?.includes('right') ? insets.right : 0,
    paddingBottom: edges?.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges?.includes('left') ? insets.left : 0,
  };

  return React.createElement(View, { ...props, ref, style: [props.style, style] }, children);
});

SafeAreaView.displayName = 'SafeAreaView';

const useSafeAreaInsets = () => {
  const context = React.useContext(SafeAreaContext);
  return context.insets;
};

const useSafeAreaFrame = () => {
  const context = React.useContext(SafeAreaContext);
  return context.frame;
};

module.exports = {
  SafeAreaProvider,
  SafeAreaView,
  SafeAreaContext,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics: {
    insets: defaultInsets,
    frame: { x: 0, y: 0, width: 375, height: 812 },
  },
  // Edge constants
  Edge: {
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
  },
};