import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { syncManager } from '../../../services/database/sync/syncManager';
import { theme } from '../../../theme';

export const OfflineQueueViewer: React.FC = () => {
  const [queueData, setQueueData] = useState(syncManager.getOfflineQueueVisualization());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['bouncePlan', 'jobApplications', 'budget', 'wellness', 'coach']));
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueData(syncManager.getOfflineQueueVisualization());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleRetryAll = async () => {
    setIsRetrying(true);
    try {
      await syncManager.syncAll();
      setQueueData(syncManager.getOfflineQueueVisualization());
    } catch (error) {
      Alert.alert('Sync Failed', 'Please check your connection and try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClearItem = async (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from the queue? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await syncManager.clearQueueItem(itemId);
            setQueueData(syncManager.getOfflineQueueVisualization());
          },
        },
      ]
    );
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'bouncePlan':
        return 'calendar';
      case 'jobApplications':
        return 'briefcase';
      case 'budget':
        return 'wallet';
      case 'wellness':
        return 'heart';
      case 'coach':
        return 'chatbubbles';
      default:
        return 'document';
    }
  };

  const getItemDescription = (item: any) => {
    switch (item.type) {
      case 'task_completion':
        return 'Task completion';
      case 'application_create':
        return `New application: ${item.data.company || 'Unknown'}`;
      case 'application_update':
        return `Status update: ${item.data.status || 'Unknown'}`;
      case 'budget_update':
        return 'Budget update';
      case 'mood_entry':
        return `Mood entry: ${item.data.value}/5`;
      default:
        return item.type.replace(/_/g, ' ');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatOldestItem = () => {
    if (!queueData.oldestItem) return '';
    
    const now = new Date();
    const diff = now.getTime() - new Date(queueData.oldestItem).getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 1) return 'Less than 1 hour ago';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getStorageWarning = () => {
    if (!queueData.sizeInBytes) return null;
    
    const sizeInMB = queueData.sizeInBytes / (1024 * 1024);
    const limitMB = 20; // Soft limit from CLAUDE.md
    
    if (sizeInMB > limitMB * 0.75) {
      return {
        text: `Large queue size: ${sizeInMB.toFixed(1)} MB of ${limitMB} MB limit`,
        isWarning: true,
      };
    }
    
    return null;
  };

  if (queueData.totalItems === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
        <Text style={styles.emptyTitle}>No pending items</Text>
        <Text style={styles.emptySubtitle}>All changes have been saved</Text>
      </View>
    );
  }

  const storageWarning = getStorageWarning();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{queueData.totalItems} items waiting to sync</Text>
        {queueData.oldestItem && (
          <Text style={styles.subtitle}>Oldest item: {formatOldestItem()}</Text>
        )}
        {storageWarning && (
          <View style={styles.warningContainer} testID="storage-warning">
            <Ionicons name="warning" size={16} color={theme.colors.warning} />
            <Text style={styles.warningText}>{storageWarning.text}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRetryAll}
        disabled={isRetrying}
        testID="retry-all-button"
      >
        <Ionicons name="sync" size={20} color={theme.colors.primary} />
        <Text style={styles.retryButtonText}>
          {isRetrying ? 'Syncing...' : 'Retry All'}
        </Text>
      </TouchableOpacity>

      {Object.entries(queueData.byFeature).map(([feature, count]) => {
        if (count === 0) return null;

        const featureItems = queueData.items.filter(item => item.feature === feature);
        const isExpanded = expandedSections.has(feature);

        return (
          <View key={feature} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(feature)}
              testID={`collapse-${feature}`}
            >
              <Ionicons
                name={getFeatureIcon(feature)}
                size={20}
                color={theme.colors.primary}
                testID={`icon-${feature}`}
              />
              <Text style={styles.sectionTitle}>
                {feature.replace(/([A-Z])/g, ' $1').trim()} ({count})
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.sectionContent}>
                {featureItems.map((item) => (
                  <View key={item.id} style={styles.queueItem}>
                    <View style={styles.queueItemContent}>
                      <Text style={styles.queueItemTitle}>
                        {getItemDescription(item)}
                      </Text>
                      <Text style={styles.queueItemTime}>
                        {formatTimestamp(item.timestamp)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleClearItem(item.id)}
                      testID={`clear-item-${item.id}`}
                      style={styles.clearButton}
                    >
                      <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.small,
  },
  warningText: {
    fontSize: 13,
    color: theme.colors.warning,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    textTransform: 'capitalize',
  },
  sectionContent: {
    backgroundColor: theme.colors.background,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  queueItemContent: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: 14,
    color: theme.colors.text,
  },
  queueItemTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
});