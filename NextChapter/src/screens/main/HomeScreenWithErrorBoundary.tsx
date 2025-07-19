import React from 'react';
import HomeScreen from '@screens/main/HomeScreen';
import { ErrorBoundary } from '@components/common/ErrorBoundary';

export default function HomeScreenWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <HomeScreen />
    </ErrorBoundary>
  );
}