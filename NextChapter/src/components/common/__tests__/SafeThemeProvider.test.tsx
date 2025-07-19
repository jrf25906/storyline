import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeThemeProvider, useTheme } from '@components/common/SafeThemeProvider';
import { lightCompatibleTheme, darkCompatibleTheme } from '@theme';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock useColorScheme
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn().mockReturnValue('light'),
}));

// Test component that uses the theme
const ThemeConsumer = () => {
  const { theme, themeType, isHighContrast } = useTheme();
  
  return (
    <View>
      <Text testID="theme-type">{themeType}</Text>
      <Text testID="high-contrast">{String(isHighContrast)}</Text>
      <Text testID="primary-color">{theme.colors.primary}</Text>
      <Text testID="background-color">{theme.colors.background}</Text>
    </View>
  );
};

describe('SafeThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.clear as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children with default theme', () => {
    const { getByTestId } = render(
      <SafeThemeProvider>
        <ThemeConsumer />
      </SafeThemeProvider>
    );

    expect(getByTestId('theme-type').children[0]).toBe('system');
    expect(getByTestId('high-contrast').children[0]).toBe('false');
    expect(getByTestId('primary-color').children[0]).toBe(lightCompatibleTheme.colors.primary);
  });

  it('should apply test theme overrides', () => {
    const testTheme = {
      colors: {
        primary: '#TEST123',
        background: '#TESTBG',
      },
    };

    const { getByTestId } = render(
      <SafeThemeProvider testTheme={testTheme}>
        <ThemeConsumer />
      </SafeThemeProvider>
    );

    expect(getByTestId('primary-color').children[0]).toBe('#TEST123');
    expect(getByTestId('background-color').children[0]).toBe('#TESTBG');
  });

  it('should merge test theme with default theme', () => {
    const testTheme = {
      colors: {
        primary: '#MERGED',
      },
    };

    const { getByTestId } = render(
      <SafeThemeProvider testTheme={testTheme}>
        <ThemeConsumer />
      </SafeThemeProvider>
    );

    // Primary should be overridden
    expect(getByTestId('primary-color').children[0]).toBe('#MERGED');
    // Background should remain from default theme
    expect(getByTestId('background-color').children[0]).toBe(lightCompatibleTheme.colors.background);
  });

  it('should not save to AsyncStorage when testTheme is provided', async () => {
    const TestComponent = () => {
      const { setThemeType, setIsHighContrast } = useTheme();
      
      React.useEffect(() => {
        setThemeType('dark');
        setIsHighContrast(true);
      }, [setThemeType, setIsHighContrast]);
      
      return <Text>Test</Text>;
    };

    render(
      <SafeThemeProvider testTheme={{ colors: { primary: '#TEST' } }}>
        <TestComponent />
      </SafeThemeProvider>
    );

    await waitFor(() => {
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  it('should load preferences from AsyncStorage when no testTheme', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'themeType') return Promise.resolve('dark');
      if (key === 'isHighContrast') return Promise.resolve('true');
      return Promise.resolve(null);
    });

    const { getByTestId } = render(
      <SafeThemeProvider>
        <ThemeConsumer />
      </SafeThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('theme-type').children[0]).toBe('dark');
      expect(getByTestId('high-contrast').children[0]).toBe('true');
    });
  });

  it('should handle AsyncStorage errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

    const { getByTestId } = render(
      <SafeThemeProvider>
        <ThemeConsumer />
      </SafeThemeProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load theme preferences:', expect.any(Error));
    });

    // Should still render with defaults
    expect(getByTestId('theme-type').children[0]).toBe('system');
    
    consoleSpy.mockRestore();
  });

  it('should apply high contrast mode', async () => {
    const TestComponent = () => {
      const { theme, setIsHighContrast } = useTheme();
      
      React.useEffect(() => {
        setIsHighContrast(true);
      }, [setIsHighContrast]);
      
      return (
        <View>
          <Text testID="text-color">{theme.colors.text}</Text>
          <Text testID="bg-color">{theme.colors.background}</Text>
        </View>
      );
    };

    const { getByTestId } = render(
      <SafeThemeProvider>
        <TestComponent />
      </SafeThemeProvider>
    );

    // Wait for the effect to run
    await waitFor(() => {
      expect(getByTestId('text-color').children[0]).toBe(lightCompatibleTheme.colors.textHighContrast);
      expect(getByTestId('bg-color').children[0]).toBe(lightCompatibleTheme.colors.backgroundHighContrast);
    });
  });

  it('should throw error when useTheme is used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<ThemeConsumer />);
    }).toThrow('useSafeTheme must be used within a SafeThemeProvider');
    
    consoleSpy.mockRestore();
  });

  it('should use dark theme when themeType is set to dark', async () => {
    const TestComponent = () => {
      const { theme, setThemeType } = useTheme();
      
      React.useEffect(() => {
        setThemeType('dark');
      }, [setThemeType]);
      
      return (
        <View>
          <Text testID="background-color">{theme.colors.background}</Text>
        </View>
      );
    };
    
    const { getByTestId } = render(
      <SafeThemeProvider>
        <TestComponent />
      </SafeThemeProvider>
    );
    
    await waitFor(() => {
      expect(getByTestId('background-color').children[0]).toBe(darkCompatibleTheme.colors.background);
    });
  });

  it('should preserve non-color theme properties when applying test theme', () => {
    const TestComponent = () => {
      const { theme } = useTheme();
      
      return (
        <View>
          <Text testID="spacing-sm">{theme.spacing.sm}</Text>
          <Text testID="font-size">{theme.typography.fontSizes.body}</Text>
        </View>
      );
    };

    const testTheme = {
      colors: {
        primary: '#CUSTOM',
      },
      spacing: {
        sm: 999,
      },
    };

    const { getByTestId } = render(
      <SafeThemeProvider testTheme={testTheme}>
        <TestComponent />
      </SafeThemeProvider>
    );

    expect(getByTestId('spacing-sm').children[0]).toBe('999');
    expect(getByTestId('font-size').children[0]).toBe(String(lightCompatibleTheme.typography.fontSizes.body));
  });
});