import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { OfflineProvider } from './src/context/OfflineContext';
import { AppNavigator } from './src/navigation';
import { NotificationSetup } from './src/components/app/NotificationSetup';
import { ErrorBoundary } from './src/components/common';
import { SafeThemeProvider } from './src/components/common/SafeThemeProvider';
import './src/services/builderConfig';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeThemeProvider>
          <AuthProvider>
            <OfflineProvider>
              <StatusBar style="auto" />
              <NotificationSetup />
              <AppNavigator />
            </OfflineProvider>
          </AuthProvider>
        </SafeThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
