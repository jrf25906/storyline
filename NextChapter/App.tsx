import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SafeThemeProvider } from './src/components/common/SafeThemeProvider';
import { OfflineProvider } from './src/context/OfflineContext';
import { AppNavigator } from './src/navigation';
import { NotificationSetup } from './src/components/app/NotificationSetup';
import { ErrorBoundary } from './src/components/common';
import './src/services/builderConfig';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeThemeProvider>
        <AuthProvider>
          <OfflineProvider>
            <StatusBar style="auto" />
            <NotificationSetup />
            <AppNavigator />
          </OfflineProvider>
        </AuthProvider>
      </SafeThemeProvider>
    </ErrorBoundary>
  );
}
