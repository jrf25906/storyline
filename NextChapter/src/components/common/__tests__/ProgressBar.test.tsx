import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import ProgressBar from '@components/common/ProgressBar';
import { ThemeProvider } from '@context/ThemeContext';

// Mock ThemeContext
const mockTheme = {
  colors: {
    primary: '#2D5A27',
    background: '#FDFCF8',
  },
};

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: mockTheme,
    isDark: false,
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ProgressBar', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with basic progress', () => {
    const { getByTestId } = renderWithTheme(
      <ProgressBar progress={0.5} testID="progress-bar" />
    );

    const container = getByTestId('progress-bar');
    expect(container).toBeTruthy();
  });

  it('should display correct accessibility attributes', () => {
    const { UNSAFE_getAllByProps } = renderWithTheme(
      <ProgressBar progress={0.75} />
    );

    const progressBar = UNSAFE_getAllByProps({ accessibilityRole: 'progressbar' })[0];
    expect(progressBar.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 75,
    });
    expect(progressBar.props.accessibilityLabel).toBe('Progress: 75%');
  });

  it('should clamp progress values between 0 and 1', () => {
    const { UNSAFE_getAllByProps: getByPropsOverflow } = renderWithTheme(
      <ProgressBar progress={1.5} />
    );
    
    const overflowBar = getByPropsOverflow({ accessibilityRole: 'progressbar' })[0];
    expect(overflowBar.props.accessibilityValue.now).toBe(100);

    const { UNSAFE_getAllByProps: getByPropsNegative } = renderWithTheme(
      <ProgressBar progress={-0.5} />
    );
    
    const negativeBar = getByPropsNegative({ accessibilityRole: 'progressbar' })[0];
    expect(negativeBar.props.accessibilityValue.now).toBe(0);
  });

  it('should display label when provided', () => {
    const { getByText } = renderWithTheme(
      <ProgressBar progress={0.5} label="Upload Progress" />
    );

    expect(getByText('Upload Progress')).toBeTruthy();
  });

  it('should display percentage when showLabel is true', () => {
    const { getByText } = renderWithTheme(
      <ProgressBar progress={0.65} showLabel />
    );

    expect(getByText('65%')).toBeTruthy();
  });

  it('should display both label and percentage', () => {
    const { getByText } = renderWithTheme(
      <ProgressBar progress={0.45} label="Loading Files" showLabel />
    );

    expect(getByText('Loading Files')).toBeTruthy();
    expect(getByText('45%')).toBeTruthy();
  });

  it('should apply custom colors', () => {
    const customColor = '#FF0000';
    const customBgColor = '#0000FF';
    
    const { UNSAFE_getAllByType } = renderWithTheme(
      <ProgressBar 
        progress={0.5} 
        color={customColor}
        backgroundColor={customBgColor}
      />
    );

    const views = UNSAFE_getAllByType('View' as any);
    const track = views.find(view => {
      if (!view.props.style || !Array.isArray(view.props.style)) return false;
      return view.props.style.some((s: any) => s && s.backgroundColor === customBgColor);
    });
    
    expect(track).toBeTruthy();
    
    // Also check the fill color
    const animatedViews = UNSAFE_getAllByType(Animated.View as any);
    const fill = animatedViews.find(view => {
      if (!view.props.style || !Array.isArray(view.props.style)) return false;
      return view.props.style.some((s: any) => s && s.backgroundColor === customColor);
    });
    
    expect(fill).toBeTruthy();
  });

  it('should apply custom height', () => {
    const customHeight = 16;
    const { UNSAFE_getAllByProps } = renderWithTheme(
      <ProgressBar progress={0.5} height={customHeight} />
    );

    const track = UNSAFE_getAllByProps({ accessibilityRole: 'progressbar' })[0];
    expect(track.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ height: customHeight })
      ])
    );
  });

  it('should animate progress when animated is true', async () => {
    const animationSpy = jest.spyOn(Animated, 'timing');
    
    const { rerender } = renderWithTheme(
      <ProgressBar progress={0.2} animated={true} />
    );

    rerender(
      <ThemeProvider>
        <ProgressBar progress={0.8} animated={true} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(animationSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 0.8,
          duration: 300,
          useNativeDriver: false,
        })
      );
    });

    animationSpy.mockRestore();
  });

  it('should not animate when animated is false', () => {
    const animationSpy = jest.spyOn(Animated, 'timing');
    
    renderWithTheme(
      <ProgressBar progress={0.5} animated={false} />
    );

    expect(animationSpy).not.toHaveBeenCalled();
    animationSpy.mockRestore();
  });

  it('should use dark mode colors when theme is dark', () => {
    const useThemeMock = require('../../../context/ThemeContext').useTheme;
    useThemeMock.mockReturnValue({
      theme: {
        colors: {
          primary: '#2D5A27',
          background: '#1A1F1B', // Dark background
        },
      },
      isDark: true,
    });

    const { getByText } = renderWithTheme(
      <ProgressBar progress={0.5} label="Dark Mode" showLabel />
    );

    const label = getByText('Dark Mode');
    expect(label.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#FDFCF8' }) // Dark mode text color
      ])
    );
  });

  it('should apply custom styles', () => {
    const customStyle = { marginTop: 20, marginBottom: 10 };
    const { getByTestId } = renderWithTheme(
      <ProgressBar progress={0.5} style={customStyle} testID="styled-progress" />
    );

    const container = getByTestId('styled-progress');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });
});