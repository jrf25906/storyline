import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { render, RenderOptions } from '@testing-library/react-native';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that includes all necessary providers for testing
 */
export const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <NavigationContainer>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </NavigationContainer>
  );
};

/**
 * Custom render method that includes all providers
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

/**
 * Provider wrapper for components that need theme only
 */
export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

/**
 * Custom render for components that only need theme
 */
export const renderWithTheme = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: ThemeWrapper, ...options });
};