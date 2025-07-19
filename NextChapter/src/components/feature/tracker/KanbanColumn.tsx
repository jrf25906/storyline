import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { JobApplication, JobApplicationStatus } from '@types/database';
import { ApplicationCard } from '@components/feature/tracker/ApplicationCard';
import { Colors, Typography, Spacing, Borders } from '@theme';

interface KanbanColumnProps {
  title: string;
  status: JobApplicationStatus;
  applications: JobApplication[];
  onApplicationPress: (application: JobApplication) => void;
  onApplicationLongPress?: (application: JobApplication) => void;
  accentColor: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  applications,
  onApplicationPress,
  onApplicationLongPress,
  accentColor,
}) => {
  const count = applications.length;
  
  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: accentColor }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.countBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No applications</Text>
            {status === 'applied' && (
              <Text style={styles.emptyHint}>
                Add your first application to get started
              </Text>
            )}
            {status === 'interviewing' && (
              <Text style={styles.emptyHint}>
                Great news will show up here!
              </Text>
            )}
            {status === 'offer' && (
              <Text style={styles.emptyHint}>
                Your future opportunities will appear here
              </Text>
            )}
          </View>
        ) : (
          applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onPress={() => onApplicationPress(application)}
              onLongPress={() => onApplicationLongPress?.(application)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');
const columnWidth = width > 768 ? (width - 72) / 3 : width - 48;

const styles = StyleSheet.create({
  container: {
    width: columnWidth,
    flex: 1,
    backgroundColor: Colors.surfaceSection,
    borderRadius: Borders.radius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
  },
  title: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textPrimary,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: Typography.fontSizes.caption,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSizes.body,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  emptyHint: {
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: Spacing.md,
  },
});