import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeThemeProvider } from '@components/common/SafeThemeProvider';
import { AuthProvider } from '@context/AuthContext';
import { render, RenderOptions } from '@testing-library/react-native';
import { Theme } from '../theme';

interface AllTheProvidersProps {
  children: React.ReactNode;
  testTheme?: Partial<Theme>;
}

/**
 * Wrapper component that includes all necessary providers for testing
 */
export const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children, testTheme }) => {
  return (
    <NavigationContainer>
      <SafeThemeProvider testTheme={testTheme}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </SafeThemeProvider>
    </NavigationContainer>
  );
};

/**
 * Custom render method that includes all providers
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { testTheme?: Partial<Theme> }
) => {
  const { testTheme, ...renderOptions } = options || {};
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders testTheme={testTheme}>{children}</AllTheProviders>
  );
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Provider wrapper for components that need theme only
 */
export const ThemeWrapper: React.FC<{ children: React.ReactNode; testTheme?: Partial<Theme> }> = ({ 
  children, 
  testTheme 
}) => {
  return <SafeThemeProvider testTheme={testTheme}>{children}</SafeThemeProvider>;
};

/**
 * Custom render for components that only need theme
 */
export const renderWithTheme = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { testTheme?: Partial<Theme> }
) => {
  const { testTheme, ...renderOptions } = options || {};
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeWrapper testTheme={testTheme}>{children}</ThemeWrapper>
  );
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};