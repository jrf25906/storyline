import React, { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { lightCompatibleTheme, darkCompatibleTheme } from '../theme';

// Mock the useTheme hook directly
jest.mock('../context/ThemeContext', () => {
  const originalModule = jest.requireActual('../context/ThemeContext');
  return {
    ...originalModule,
    useTheme: jest.fn(),
  };
});

// Create a test-specific theme context that accepts initial theme
interface ThemeTestWrapperProps {
  children: ReactNode;
  theme?: 'light' | 'dark';
  initialTheme?: 'light' | 'dark';
}

export const ThemeTestWrapper: React.FC<ThemeTestWrapperProps> = ({ 
  children, 
  theme = 'light',
  initialTheme = 'light'
}) => {
  // Use the theme prop or initialTheme prop for backward compatibility
  const selectedTheme = theme || initialTheme;
  
  // Mock the useTheme hook to return our test theme
  const { useTheme } = require('@context/ThemeContext');
  useTheme.mockReturnValue({
    theme: selectedTheme === 'dark' ? darkCompatibleTheme : lightCompatibleTheme,
    themeType: selectedTheme as 'light' | 'dark',
    setThemeType: jest.fn(),
    isHighContrast: false,
    setIsHighContrast: jest.fn(),
  });
  
  return <>{children}</>;
};

// Helper function for rendering with theme (backward compatibility)
export const renderWithTheme = (component: React.ReactElement, isDark = false) => {
  return render(
    <ThemeTestWrapper theme={isDark ? 'dark' : 'light'}>
      {component}
    </ThemeTestWrapper>
  );
};