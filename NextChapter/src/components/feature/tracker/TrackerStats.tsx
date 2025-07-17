import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Card from '../../common/Card';
import { JobApplication } from '../../../types/database';
import { Colors, Typography, Spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays } from 'date-fns';

interface TrackerStatsProps {
  applications: JobApplication[];
}

export const TrackerStats: React.FC<TrackerStatsProps> = ({ applications }) => {
  const totalApplications = applications.length;
  const interviewingCount = applications.filter(app => app.status === 'interviewing').length;
  const offerCount = applications.filter(app => app.status === 'offer').length;
  
  // Calculate response rate (interviewing + offer / total)
  const responseRate = totalApplications > 0 
    ? Math.round(((interviewingCount + offerCount) / totalApplications) * 100)
    : 0;
  
  // Find days since last application
  const sortedByDate = [...applications].sort((a, b) => {
    const dateA = new Date(a.applied_date || a.created_at);
    const dateB = new Date(b.applied_date || b.created_at);
    return dateB.getTime() - dateA.getTime();
  });
  
  const daysSinceLastApplication = sortedByDate.length > 0
    ? differenceInDays(new Date(), new Date(sortedByDate[0].applied_date || sortedByDate[0].created_at))
    : null;

  return (
    <Card variant="progress" style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={styles.statHeader}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.white} />
            <Text style={styles.statValue}>{totalApplications}</Text>
          </View>
          <Text style={styles.statLabel}>Total Applications</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={styles.statHeader}>
            <Ionicons name="trending-up-outline" size={20} color={Colors.white} />
            <Text style={styles.statValue}>{responseRate}%</Text>
          </View>
          <Text style={styles.statLabel}>Response Rate</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={styles.statHeader}>
            <Ionicons name="time-outline" size={20} color={Colors.white} />
            <Text style={styles.statValue}>
              {daysSinceLastApplication !== null ? `${daysSinceLastApplication}d` : '-'}
            </Text>
          </View>
          <Text style={styles.statLabel}>Since Last Apply</Text>
        </View>
      </View>
      
      {totalApplications === 0 && (
        <Text style={styles.encouragement}>
          Start your journey by adding your first application!
        </Text>
      )}
      
      {totalApplications > 0 && responseRate === 0 && (
        <Text style={styles.encouragement}>
          Keep going! Every application brings you closer to your next opportunity.
        </Text>
      )}
      
      {responseRate > 0 && responseRate < 20 && (
        <Text style={styles.encouragement}>
          You're getting responses! That's a great sign.
        </Text>
      )}
      
      {responseRate >= 20 && (
        <Text style={styles.encouragement}>
          Excellent response rate! Your approach is working well.
        </Text>
      )}
      
      {daysSinceLastApplication !== null && daysSinceLastApplication > 7 && (
        <Text style={styles.reminder}>
          It's been a while since your last application. Ready to send another?
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.fontSizes.displayLG,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSizes.caption,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  encouragement: {
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.white,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    lineHeight: Typography.fontSizes.bodySM * 1.5,
  },
  reminder: {
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.white,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
});