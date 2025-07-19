import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SwipeableCard, SwipeAction } from '@components/common/SwipeableCard';
import { ExpandableCard } from '@components/common/ExpandableCard';
import { useToast } from '@context/../contexts/ToastContext';
import { useCelebrationAnimation } from '@hooks/useAnimations';
import { Colors } from '@theme/colors';
import { Typography } from '@theme/typography';
import { Spacing } from '@theme/spacing';

export type ApplicationStatus = 
  | 'saved' 
  | 'applied' 
  | 'screening' 
  | 'interview' 
  | 'offer' 
  | 'rejected' 
  | 'archived';

export interface JobApplication {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  status: ApplicationStatus;
  appliedDate?: string;
  nextSteps?: string[];
  notes?: string;
  interviewDate?: string;
  contactPerson?: string;
  jobUrl?: string;
}

export interface JobApplicationCardProps {
  application: JobApplication;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onPress?: (application: JobApplication) => void;
  showExpandedDetails?: boolean;
  variant?: 'compact' | 'detailed';
}

export const JobApplicationCard: React.FC<JobApplicationCardProps> = ({
  application,
  onStatusChange,
  onArchive,
  onDelete,
  onPress,
  showExpandedDetails = false,
  variant = 'detailed',
}) => {
  const { showSuccess, showInfo, showWarning } = useToast();
  const { animate: celebrate } = useCelebrationAnimation();
  const [isExpanded, setIsExpanded] = useState(showExpandedDetails);

  const getStatusInfo = (status: ApplicationStatus) => {
    switch (status) {
      case 'saved':
        return { label: 'Saved', color: Colors.text.secondary, variant: 'default' as const };
      case 'applied':
        return { label: 'Applied', color: Colors.primary.main, variant: 'info' as const };
      case 'screening':
        return { label: 'Screening', color: Colors.warning.main, variant: 'warning' as const };
      case 'interview':
        return { label: 'Interview', color: Colors.success.main, variant: 'success' as const };
      case 'offer':
        return { label: 'Offer!', color: Colors.success.dark, variant: 'success' as const };
      case 'rejected':
        return { label: 'Not selected', color: Colors.error.main, variant: 'default' as const };
      case 'archived':
        return { label: 'Archived', color: Colors.text.disabled, variant: 'default' as const };
    }
  };

  const getSwipeActions = (): { left: SwipeAction[], right: SwipeAction[] } => {
    const statusInfo = getStatusInfo(application.status);
    
    // Left actions (positive actions)
    const leftActions: SwipeAction[] = [];
    
    if (application.status === 'saved') {
      leftActions.push({
        id: 'apply',
        label: 'Apply',
        icon: '📝',
        color: '#FFFFFF',
        backgroundColor: Colors.primary.main,
        onPress: () => {
          celebrate();
          onStatusChange(application.id, 'applied');
          showSuccess('Application submitted! Great progress! 🎉');
        },
      });
    } else if (application.status === 'applied') {
      leftActions.push({
        id: 'screening',
        label: 'Screening',
        icon: '📞',
        color: '#FFFFFF',
        backgroundColor: Colors.warning.main,
        onPress: () => {
          onStatusChange(application.id, 'screening');
          showInfo('Moved to screening phase! 📞');
        },
      });
    } else if (application.status === 'screening') {
      leftActions.push({
        id: 'interview',
        label: 'Interview',
        icon: '🤝',
        color: '#FFFFFF',
        backgroundColor: Colors.success.main,
        onPress: () => {
          celebrate();
          onStatusChange(application.id, 'interview');
          showSuccess('Interview scheduled! You\'ve got this! 💪');
        },
      });
    }

    // Right actions (secondary actions)
    const rightActions: SwipeAction[] = [];
    
    if (application.status !== 'archived') {
      rightActions.push({
        id: 'archive',
        label: 'Archive',
        icon: '📁',
        color: '#FFFFFF',
        backgroundColor: Colors.text.secondary,
        onPress: () => {
          onArchive(application.id);
          showInfo('Application archived');
        },
      });
    }

    if (application.status === 'saved' || application.status === 'rejected') {
      rightActions.push({
        id: 'delete',
        label: 'Delete',
        icon: '🗑️',
        color: '#FFFFFF',
        backgroundColor: Colors.error.main,
        onPress: () => {
          onDelete(application.id);
          showWarning('Application deleted');
        },
      });
    }

    return { left: leftActions, right: rightActions };
  };

  const { left: leftActions, right: rightActions } = getSwipeActions();
  const statusInfo = getStatusInfo(application.status);

  const handleCardPress = () => {
    onPress?.(application);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    });
  };

  const renderCompactCard = () => (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      onPress={handleCardPress}
      accessibilityLabel={`${application.title} at ${application.company}, status: ${statusInfo.label}`}
      accessibilityHint="Double tap to view details, swipe for actions"
    >
      <View style={styles.compactContent}>
        <View style={styles.compactHeader}>
          <Text style={styles.jobTitle} numberOfLines={1}>{application.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        <Text style={styles.jobCompany} numberOfLines={1}>{application.company}</Text>
        <View style={styles.compactFooter}>
          <Text style={styles.jobLocation} numberOfLines={1}>{application.location}</Text>
          {application.appliedDate && (
            <Text style={styles.appliedDate}>
              Applied {formatDate(application.appliedDate)}
            </Text>
          )}
        </View>
      </View>
    </SwipeableCard>
  );

  const renderDetailedCard = () => (
    <ExpandableCard
      title={`${application.title} at ${application.company}`}
      subtitle={`${application.location} • ${statusInfo.label}`}
      variant={statusInfo.variant}
      initiallyExpanded={isExpanded}
      onToggle={setIsExpanded}
    >
      <SwipeableCard
        leftActions={leftActions}
        rightActions={rightActions}
        onPress={handleCardPress}
        accessibilityLabel={`Job application details for ${application.title}`}
      >
        <View style={styles.detailedContent}>
          {application.salary && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Salary:</Text>
              <Text style={styles.salaryText}>{application.salary}</Text>
            </View>
          )}
          
          {application.appliedDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Applied:</Text>
              <Text style={styles.detailValue}>{formatDate(application.appliedDate)}</Text>
            </View>
          )}

          {application.interviewDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Interview:</Text>
              <Text style={styles.detailValue}>{formatDate(application.interviewDate)}</Text>
            </View>
          )}

          {application.contactPerson && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact:</Text>
              <Text style={styles.detailValue}>{application.contactPerson}</Text>
            </View>
          )}

          {application.nextSteps && application.nextSteps.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Next Steps:</Text>
              {application.nextSteps.map((step, index) => (
                <Text key={index} style={styles.nextStepItem}>• {step}</Text>
              ))}
            </View>
          )}

          {application.notes && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.notesText}>{application.notes}</Text>
            </View>
          )}
        </View>
      </SwipeableCard>
    </ExpandableCard>
  );

  return variant === 'compact' ? renderCompactCard() : renderDetailedCard();
};

const styles = StyleSheet.create({
  // Compact Card Styles
  compactContent: {
    gap: Spacing.xs,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  compactFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  
  // Detailed Card Styles
  detailedContent: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailSection: {
    gap: Spacing.xs,
  },
  
  // Text Styles
  jobTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  jobCompany: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  jobLocation: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    flex: 1,
  },
  appliedDate: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  
  // Status Badge
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.body.small,
    fontWeight: '600',
    fontSize: 11,
  },
  
  // Detail Styles
  detailLabel: {
    ...Typography.body.semiBold,
    color: Colors.text.primary,
  },
  detailValue: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  salaryText: {
    ...Typography.body.medium,
    color: Colors.success.main,
    fontWeight: '600',
  },
  nextStepItem: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginLeft: Spacing.sm,
  },
  notesText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});