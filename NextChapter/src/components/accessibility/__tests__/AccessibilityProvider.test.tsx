import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityProvider, useAccessibilityContext } from '../AccessibilityProvider';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
    addEventListener: jest.fn(),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAccessibilityInfo = AccessibilityInfo as jest.Mocked<typeof AccessibilityInfo>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Test component to access context
function TestComponent() {
  const { settings, isAccessibilityEnabled, announceForAccessibility } = useAccessibilityContext();
  
  return (
    <>
      <div testID="screen-reader">{settings.screenReaderEnabled.toString()}</div>
      <div testID="reduce-motion">{settings.reduceMotionEnabled.toString()}</div>
      <div testID="accessibility-enabled">{isAccessibilityEnabled.toString()}</div>
      <button onPress={() => announceForAccessibility('Test message')}>
        Announce
      </button>
    </>
  );
}

describe('AccessibilityProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.addEventListener.mockReturnValue({ remove: jest.fn() });
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  it('initializes with default settings', async () => {
    const { getByTestId } = render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(getByTestId('screen-reader').children[0]).toBe('false');
      expect(getByTestId('reduce-motion').children[0]).toBe('false');
      expect(getByTestId('accessibility-enabled').children[0]).toBe('false');
    });
  });

  it('loads saved settings from AsyncStorage', async () => {
    const savedSettings = {
      screenReaderEnabled: true,
      reduceMotionEnabled: false,
      highContrastEnabled: true,
      largeTextEnabled: false,
      voiceControlEnabled: false,
      hapticFeedbackEnabled: true,
      announceStateChanges: true,
      extendedTimeouts: false,
    };

    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedSettings));

    const { getByTestId } = render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(getByTestId('screen-reader').children[0]).toBe('true');
    });
  });

  it('detects system accessibility features', async () => {
    mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);

    const { getByTestId } = render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(getByTestId('screen-reader').children[0]).toBe('true');
      expect(getByTestId('reduce-motion').children[0]).toBe('true');
      expect(getByTestId('accessibility-enabled').children[0]).toBe('true');
    });
  });

  it('listens for accessibility changes', async () => {
    let screenReaderCallback: (enabled: boolean) => void = () => {};
    
    mockAccessibilityInfo.addEventListener.mockImplementation((event, callback) => {
      if (event === 'screenReaderChanged') {
        screenReaderCallback = callback;
      }
      return { remove: jest.fn() };
    });

    const { getByTestId } = render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    // Simulate screen reader being enabled
    act(() => {
      screenReaderCallback(true);
    });

    await waitFor(() => {
      expect(getByTestId('screen-reader').children[0]).toBe('true');
      expect(getByTestId('accessibility-enabled').children[0]).toBe('true');
    });
  });

  it('saves settings when they change', async () => {
    const { getByTestId } = render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  it('announces messages with proper timing', async () => {
    jest.useFakeTimers();

    const { getByText } = render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    const announceButton = getByText('Announce');
    announceButton.props.onPress();

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Test message');

    jest.useRealTimers();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAccessibilityContext must be used within AccessibilityProvider');

    consoleSpy.mockRestore();
  });
});

describe('useAccessibleAnimation', () => {
  it('returns correct animation settings based on reduce motion', async () => {
    const TestAnimationComponent = () => {
      const { useAccessibleAnimation } = require('../AccessibilityProvider');
      const { shouldAnimate, duration, extendedTimeout } = useAccessibleAnimation();
      
      return (
        <>
          <div testID="should-animate">{shouldAnimate.toString()}</div>
          <div testID="duration">{duration?.toString() || 'undefined'}</div>
          <div testID="timeout">{extendedTimeout.toString()}</div>
        </>
      );
    };

    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);

    const { getByTestId } = render(
      <AccessibilityProvider>
        <TestAnimationComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(getByTestId('should-animate').children[0]).toBe('false');
      expect(getByTestId('duration').children[0]).toBe('0');
    });
  });
});

describe('useAccessibleStyling', () => {
  it('returns correct styling based on accessibility settings', async () => {
    const TestStylingComponent = () => {
      const { useAccessibleStyling } = require('../AccessibilityProvider');
      const { fontSize, contrast, touchTargetSize } = useAccessibleStyling();
      
      return (
        <>
          <div testID="font-size">{fontSize.toString()}</div>
          <div testID="contrast">{contrast}</div>
          <div testID="touch-target">{touchTargetSize.toString()}</div>
        </>
      );
    };

    mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);

    const { getByTestId } = render(
      <AccessibilityProvider>
        <TestStylingComponent />
      </AccessibilityProvider>
    );

    await waitFor(() => {
      expect(getByTestId('touch-target').children[0]).toBe('48');
    });
  });
});