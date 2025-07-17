// Mock for @react-navigation/native
const React = require('react');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
    key: 'test',
    index: 0,
    routeNames: ['Screen1'],
    routes: [{ key: 'Screen1-key', name: 'Screen1' }],
  })),
};

const mockRoute = {
  key: 'test',
  name: 'Test',
  params: {},
};

module.exports = {
  NavigationContainer: ({ children }) => children,
  
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
  useNavigationState: (selector) => selector(mockNavigation.getState()),
  useFocusEffect: (callback) => {
    React.useEffect(() => {
      callback();
    }, []);
  },
  useIsFocused: () => true,
  useScrollToTop: () => {},
  
  createNavigationContainerRef: () => ({
    current: mockNavigation,
    isReady: () => true,
    navigate: mockNavigation.navigate,
    goBack: mockNavigation.goBack,
    reset: mockNavigation.reset,
    dispatch: mockNavigation.dispatch,
    setParams: mockNavigation.setParams,
    getCurrentRoute: () => mockRoute,
    getCurrentOptions: () => ({}),
    addListener: mockNavigation.addListener,
    removeListener: mockNavigation.removeListener,
  }),
  
  CommonActions: {
    navigate: jest.fn((name, params) => ({ type: 'NAVIGATE', payload: { name, params } })),
    goBack: jest.fn(() => ({ type: 'GO_BACK' })),
    reset: jest.fn((state) => ({ type: 'RESET', payload: state })),
    setParams: jest.fn((params) => ({ type: 'SET_PARAMS', payload: params })),
  },
  
  StackActions: {
    push: jest.fn((name, params) => ({ type: 'PUSH', payload: { name, params } })),
    pop: jest.fn((count = 1) => ({ type: 'POP', payload: { count } })),
    popToTop: jest.fn(() => ({ type: 'POP_TO_TOP' })),
    replace: jest.fn((name, params) => ({ type: 'REPLACE', payload: { name, params } })),
  },
  
  DrawerActions: {
    openDrawer: jest.fn(() => ({ type: 'OPEN_DRAWER' })),
    closeDrawer: jest.fn(() => ({ type: 'CLOSE_DRAWER' })),
    toggleDrawer: jest.fn(() => ({ type: 'TOGGLE_DRAWER' })),
  },
  
  TabActions: {
    jumpTo: jest.fn((name) => ({ type: 'JUMP_TO', payload: { name } })),
  },
  
  // Theme support
  DefaultTheme: {
    dark: false,
    colors: {
      primary: 'rgb(0, 122, 255)',
      background: 'rgb(242, 242, 242)',
      card: 'rgb(255, 255, 255)',
      text: 'rgb(28, 28, 30)',
      border: 'rgb(216, 216, 216)',
      notification: 'rgb(255, 59, 48)',
    },
  },
  
  DarkTheme: {
    dark: true,
    colors: {
      primary: 'rgb(10, 132, 255)',
      background: 'rgb(1, 1, 1)',
      card: 'rgb(18, 18, 18)',
      text: 'rgb(229, 229, 231)',
      border: 'rgb(39, 39, 41)',
      notification: 'rgb(255, 69, 58)',
    },
  },
  
  useTheme: () => ({
    dark: false,
    colors: {
      primary: 'rgb(0, 122, 255)',
      background: 'rgb(242, 242, 242)',
      card: 'rgb(255, 255, 255)',
      text: 'rgb(28, 28, 30)',
      border: 'rgb(216, 216, 216)',
      notification: 'rgb(255, 59, 48)',
    },
  }),
};