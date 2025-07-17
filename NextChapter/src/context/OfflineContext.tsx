import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface OfflineContextType {
  isConnected: boolean;
  isWifiEnabled: boolean;
  networkType: string | null;
  hasPendingSyncs: boolean;
  syncInProgress: boolean;
  triggerSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isWifiEnabled, setIsWifiEnabled] = useState(false);
  const [networkType, setNetworkType] = useState<string | null>(null);
  const [hasPendingSyncs, setHasPendingSyncs] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsWifiEnabled(state.type === 'wifi');
      setNetworkType(state.type);
    });

    return unsubscribe;
  }, []);

  // Check for pending syncs periodically
  useEffect(() => {
    const checkPendingSyncs = async () => {
      try {
        const { syncManager } = await import('../services/database/sync/syncManager');
        setHasPendingSyncs(syncManager.hasPendingSyncs());
      } catch (error) {
        // In test environment, dynamic imports might fail
        if (process.env.NODE_ENV === 'test') {
          const syncManager = require('../services/database/sync/syncManager').syncManager;
          setHasPendingSyncs(syncManager.hasPendingSyncs());
        } else {
          console.error('Failed to import syncManager:', error);
        }
      }
    };

    // Check immediately
    checkPendingSyncs();

    // Check every 5 seconds
    const interval = setInterval(checkPendingSyncs, 5000);

    return () => clearInterval(interval);
  }, []);

  const triggerSync = async () => {
    if (!isConnected || syncInProgress) return;
    
    setSyncInProgress(true);
    try {
      let syncManager;
      try {
        // Import sync manager dynamically to avoid circular dependencies
        const module = await import('../services/database/sync/syncManager');
        syncManager = module.syncManager;
      } catch (error) {
        // In test environment, use require
        if (process.env.NODE_ENV === 'test') {
          syncManager = require('../services/database/sync/syncManager').syncManager;
        } else {
          throw error;
        }
      }
      
      const result = await syncManager.syncAll();
      
      if (result.success) {
        setHasPendingSyncs(false);
      } else {
        console.error('Sync errors:', result.errors);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isConnected && hasPendingSyncs && !syncInProgress) {
      triggerSync();
    }
  }, [isConnected, hasPendingSyncs, syncInProgress]);

  const value: OfflineContextType = {
    isConnected,
    isWifiEnabled,
    networkType,
    hasPendingSyncs,
    syncInProgress,
    triggerSync,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}