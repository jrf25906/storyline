import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { format } from 'date-fns';
import Card from '../../common/Card';
import { JobApplication } from '../../../types/database';
import { Colors, Typography, Spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

interface ApplicationCardProps {
  application: JobApplication;
  onPress: () => void;
  onLongPress?: () => void;
  isDragging?: boolean;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onPress,
  onLongPress,
  isDragging = false,
}) => {
  const dragOpacity = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(dragOpacity, {
      toValue: isDragging ? 0.7 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isDragging]);

  const getStatusColor = () => {
    switch (application.status) {
      case 'applied':
        return Colors.neutral[600]; // Neutral for applied
      case 'interviewing':
        return Colors.calmBlue; // Calm blue for interviewing
      case 'offer':
        return Colors.successMint; // Success mint for offers
      case 'rejected':
        return Colors.gentleCoral; // Gentle coral for rejections
      case 'withdrawn':
        return Colors.neutral[500]; // Muted for withdrawn
      default:
        return Colors.neutral[500];
    }
  };

  const getStatusIcon = () => {
    switch (application.status) {
      case 'applied':
        return 'paper-plane-outline';
      case 'interviewing':
        return 'chatbubbles-outline';
      case 'offer':
        return 'trophy-outline';
      case 'rejected':
        return 'close-circle-outline';
      case 'withdrawn':
        return 'arrow-back-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Animated.View style={{ opacity: dragOpacity }}>
      <Card
        variant="task"
        onPress={onPress}
        hoverable
        animatePress
        style={styles.card}
        accessibilityLabel={`${application.position} at ${application.company}, status: ${application.status}`}
        accessibilityHint="Tap to view details"
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.company} numberOfLines={1}>
              {application.company}
            </Text>
            <Text style={styles.position} numberOfLines={1}>
              {application.position}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Ionicons 
              name={getStatusIcon() as any} 
              size={14} 
              color={Colors.white} 
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          {application.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {application.location}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {formatDate(application.applied_date || application.created_at)}
            </Text>
          </View>
        </View>

        {application.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {application.notes}
          </Text>
        )}

        {application.salary_range && (
          <View style={styles.salaryBadge}>
            <Text style={styles.salaryText}>{application.salary_range}</Text>
          </View>
        )}
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  company: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  position: {
    fontSize: Typography.fontSizes.body,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: Typography.fontSizes.caption,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.white,
  },
  details: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  notes: {
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    lineHeight: Typography.fontSizes.bodySM * 1.4,
  },
  salaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSection,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  salaryText: {
    fontSize: Typography.fontSizes.caption,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.primary,
  },
});