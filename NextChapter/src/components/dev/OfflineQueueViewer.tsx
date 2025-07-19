import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineQueueViewerProps {
  testID?: string;
}

export const OfflineQueueViewer: React.FC<OfflineQueueViewerProps> = ({ testID }) => {
  const { theme } = useTheme();
  const { isConnected } = useNetworkStatus();
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock offline store for development
  const mockOfflineStore = {
    queue: [],
    getQueueSize: () => queue.length,
    processQueue: async () => {
      setIsLoading(true);
      try {
        // Simulate sync process
        await new Promise(resolve => setTimeout(resolve, 1000));
        setQueue([]);
        return { success: true, syncedCount: queue.length, failedCount: 0 };
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    retryFailedActions: async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      } finally {
        setIsLoading(false);
      }
    },
  };

  useEffect(() => {
    // Load queue from mock store
    setQueue(mockOfflineStore.queue);
  }, []);

  const handleSyncNow = async () => {
    if (!isConnected) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.');
      return;
    }

    try {
      const result = await mockOfflineStore.processQueue();
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.syncedCount} actions.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        'Failed to sync offline actions. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRetryFailed = async () => {
    try {
      await mockOfflineStore.retryFailedActions();
      Alert.alert('Retry Complete', 'Failed actions have been retried.', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Retry Failed', 'Failed to retry actions.', [{ text: 'OK' }]);
    }
  };

  const renderQueueItem = ({ item }: { item: OfflineAction }) => (
    <View style={styles.queueItem}>
      <View style={styles.queueItemHeader}>
        <Text style={[styles.queueItemType, { color: theme.colors.text }]}>
          {item.type}
        </Text>
        <Text style={[styles.queueItemTime, { color: theme.colors.textSecondary }]}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={[styles.queueItemPayload, { color: theme.colors.textTertiary }]}>
        {JSON.stringify(item.payload, null, 2)}
      </Text>
      {item.retryCount > 0 && (
        <Text style={[styles.retryCount, { color: theme.colors.warning }]}>
          Retries: {item.retryCount}
        </Text>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSizes.headingMD,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: theme.typography.fontSizes.bodySM,
      color: theme.colors.textSecondary,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    button: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.sm,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: theme.colors.textTertiary,
    },
    buttonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSizes.body,
      fontWeight: theme.typography.fontWeights.semiBold,
    },
    queueContainer: {
      flex: 1,
    },
    queueItem: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.sm,
      borderRadius: theme.borders.radius.md,
      marginBottom: theme.spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    queueItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    queueItemType: {
      fontSize: theme.typography.fontSizes.body,
      fontWeight: theme.typography.fontWeights.semiBold,
    },
    queueItemTime: {
      fontSize: theme.typography.fontSizes.bodySM,
    },
    queueItemPayload: {
      fontSize: theme.typography.fontSizes.bodySM,
      fontFamily: 'monospace',
    },
    retryCount: {
      fontSize: theme.typography.fontSizes.bodySM,
      fontWeight: theme.typography.fontWeights.semiBold,
      marginTop: theme.spacing.xs,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: theme.typography.fontSizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Offline Queue ({mockOfflineStore.getQueueSize()} actions)
        </Text>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? theme.colors.success : theme.colors.error },
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, (!isConnected || isLoading) && styles.buttonDisabled]}
          onPress={handleSyncNow}
          disabled={!isConnected || isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRetryFailed}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Retry Failed</Text>
        </TouchableOpacity>
      </View>

      {/* Queue List */}
      <View style={styles.queueContainer}>
        {queue.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No offline actions in queue.{'\n'}
              Actions will appear here when you're offline.
            </Text>
          </View>
        ) : (
          <FlatList
            data={queue}
            renderItem={renderQueueItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};