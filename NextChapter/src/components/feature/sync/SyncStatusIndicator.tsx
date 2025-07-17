import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { syncManager } from '../../../services/database/sync/syncManager';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { theme } from '../../../theme';

export const SyncStatusIndicator: React.FC = () => {
  const { isConnected } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState(syncManager.getSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  // Refresh sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSyncing) {
        setSyncStatus(syncManager.getSyncStatus());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSyncing]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isConnected && syncManager.hasPendingSyncs() && !isSyncing) {
      handleSync();
    }
  }, [isConnected]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setConflicts([]);

    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    try {
      const result = await syncManager.syncAll();
      
      if (result.success) {
        setSyncStatus(syncManager.getSyncStatus());
        if (result.conflicts && result.conflicts.length > 0) {
          setConflicts(result.conflicts);
        }
      } else {
        setSyncError(result.errors.join(', '));
      }
    } catch (error) {
      setSyncError('Sync failed - tap to retry');
    } finally {
      setIsSyncing(false);
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  };

  const getStatusText = () => {
    if (!isConnected) {
      return `Offline - ${syncStatus.totalPending} items queued`;
    }
    
    if (isSyncing) {
      return 'Syncing...';
    }
    
    if (syncError) {
      return syncError;
    }
    
    if (conflicts.length > 0) {
      return `${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''} resolved`;
    }
    
    if (syncStatus.isFullySynced) {
      return 'All data synced';
    }
    
    return `${syncStatus.totalPending} items pending sync`;
  };

  const getIcon = () => {
    if (!isConnected) {
      return <Ionicons name="cloud-offline" size={20} color={theme.colors.textSecondary} testID="sync-icon-offline" />;
    }
    
    if (isSyncing) {
      const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });
      
      return (
        <Animated.View style={{ transform: [{ rotate: spin }] }} testID="sync-icon-loading">
          <Ionicons name="sync" size={20} color={theme.colors.primary} />
        </Animated.View>
      );
    }
    
    if (syncError) {
      return <Ionicons name="alert-circle" size={20} color={theme.colors.error} testID="sync-icon-error" />;
    }
    
    if (syncStatus.isFullySynced) {
      return <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} testID="sync-icon-check" />;
    }
    
    return <Ionicons name="cloud-upload" size={20} color={theme.colors.warning} />;
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainButton}
        onPress={handleSync}
        disabled={isSyncing || !isConnected}
        testID="sync-button"
      >
        <View style={styles.statusRow}>
          {getIcon()}
          <Text style={[
            styles.statusText,
            syncError && styles.errorText,
            syncStatus.isFullySynced && styles.successText
          ]}>
            {getStatusText()}
          </Text>
          <TouchableOpacity
            onPress={() => setIsExpanded(!isExpanded)}
            testID="expand-button"
            style={styles.expandButton}
          >
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bounce Plan:</Text>
            <Text style={styles.detailValue}>
              {syncStatus.bouncePlan.pendingOperations > 0 
                ? `${syncStatus.bouncePlan.pendingOperations} pending`
                : 'Synced'}
            </Text>
            <Text style={styles.detailTime}>
              {formatLastSync(syncStatus.bouncePlan.lastSync)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Job Applications:</Text>
            <Text style={styles.detailValue}>
              {syncStatus.jobApplications.pendingOperations > 0 
                ? `${syncStatus.jobApplications.pendingOperations} pending`
                : 'Synced'}
            </Text>
            <Text style={styles.detailTime}>
              {formatLastSync(syncStatus.jobApplications.lastSync)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Budget:</Text>
            <Text style={styles.detailValue}>
              {syncStatus.budget.pendingOperations > 0 
                ? `${syncStatus.budget.pendingOperations} pending`
                : 'Synced'}
            </Text>
            <Text style={styles.detailTime}>
              {formatLastSync(syncStatus.budget.lastSync)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Wellness:</Text>
            <Text style={styles.detailValue}>
              {syncStatus.wellness.pendingOperations > 0 
                ? `${syncStatus.wellness.pendingOperations} pending`
                : 'Synced'}
            </Text>
            <Text style={styles.detailTime}>
              {formatLastSync(syncStatus.wellness.lastSync)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Coach:</Text>
            <Text style={styles.detailValue}>
              {syncStatus.coach.pendingOperations > 0 
                ? `${syncStatus.coach.pendingOperations} pending`
                : 'Synced'}
            </Text>
            <Text style={styles.detailTime}>
              {formatLastSync(syncStatus.coach.lastSync)}
            </Text>
          </View>

          {conflicts.length > 0 && (
            <View style={styles.conflictsSection}>
              <Text style={styles.conflictsTitle}>Resolved Conflicts:</Text>
              {conflicts.map((conflict, index) => (
                <View key={index} style={styles.conflictItem}>
                  <Text style={styles.conflictType}>{conflict.type}</Text>
                  <Text style={styles.conflictDetail}>
                    Local: {JSON.stringify(conflict.localData).substring(0, 50)}...
                  </Text>
                  <Text style={styles.conflictDetail}>
                    Server: {JSON.stringify(conflict.serverData).substring(0, 50)}...
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainButton: {
    padding: theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  errorText: {
    color: theme.colors.error,
  },
  successText: {
    color: theme.colors.success,
  },
  expandButton: {
    padding: theme.spacing.xs,
  },
  expandedContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  detailTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  conflictsSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  conflictsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  conflictItem: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
    marginBottom: theme.spacing.xs,
  },
  conflictType: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.warning,
    marginBottom: 4,
  },
  conflictDetail: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
});