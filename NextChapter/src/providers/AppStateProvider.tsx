import React from 'react';
import { GlobalLoadingOverlay } from '../components/common/GlobalLoadingOverlay';
import { GlobalErrorHandler } from '../components/common/GlobalErrorHandler';
import { NetworkStatusIndicator } from '../components/common/NetworkStatusIndicator';

interface AppStateProviderProps {
  children: React.ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <GlobalLoadingOverlay />
      <GlobalErrorHandler />
      <NetworkStatusIndicator autoHide={true} autoHideDelay={8000} />
    </>
  );
};