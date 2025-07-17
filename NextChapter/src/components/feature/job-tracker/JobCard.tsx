import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobApplication } from '../../../types/database';
import { useTheme } from '../../../context/ThemeContext';

interface JobCardProps {
  application: JobApplication;
  onPress: () => void;
  isDragging?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ application, onPress, isDragging = false }) => {
  const { theme } = useTheme();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysAgo = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    opacity: isDragging ? 0.8 : 1,
    transform: [{ scale: isDragging ? 1.05 : 1 }],
  };

  return (
    <TouchableOpacity
      style={[styles.container, cardStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={[styles.company, { color: theme.colors.text }]} numberOfLines={1}>
          {application.company}
        </Text>
        {application.applied_date && (
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
            {formatDate(application.applied_date)}
          </Text>
        )}
      </View>

      <Text style={[styles.position, { color: theme.colors.text }]} numberOfLines={2}>
        {application.position}
      </Text>

      {application.location && (
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.location, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {application.location}
          </Text>
        </View>
      )}

      {application.salary_range && (
        <View style={styles.salaryContainer}>
          <Ionicons name="cash-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.salary, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {application.salary_range}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        {application.applied_date && (
          <Text style={[styles.daysAgo, { color: theme.colors.textSecondary }]}>
            {getDaysAgo(application.applied_date)}
          </Text>
        )}
        <View style={styles.icons}>
          {application.notes && (
            <Ionicons name="document-text-outline" size={16} color={theme.colors.textSecondary} />
          )}
          {application.contact_name && (
            <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} style={styles.iconSpacing} />
          )}
          {application.job_posting_url && (
            <Ionicons name="link-outline" size={16} color={theme.colors.textSecondary} style={styles.iconSpacing} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  company: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
  },
  position: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  salary: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  daysAgo: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginLeft: 8,
  },
});

export default JobCard;