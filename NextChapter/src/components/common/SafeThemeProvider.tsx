import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SafeThemeProviderProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that ensures theme is properly loaded before rendering children
 */
export const SafeThemeProvider: React.FC<SafeThemeProviderProps> = ({ children }) => {
  const { theme } = useTheme();
  
  // Check if theme is properly initialized
  if (!theme || !theme.colors || !theme.typography) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading theme...</Text>
      </View>
    );
  }
  
  return <>{children}</>;
};