import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useJobTrackerStore } from '@stores/jobTrackerStore';
import { JobApplicationStatus } from '@types/database';
import { withErrorBoundary } from '@components/common';
import {
  ApplicationCard,
  KanbanColumn,
  TrackerStats,
  SearchBar,
} from '@components/feature/tracker';
import { Colors, Typography, Spacing } from '@theme';
import { 
  H1,
  H2,
  Body,
  BodySM,
  Caption
} from '@components/common/Typography';

type TrackerStackParamList = {
  JobApplications: undefined;
  AddApplication: undefined;
  ApplicationDetails: { applicationId: string };
};

type JobApplicationsScreenNavigationProp = StackNavigationProp<TrackerStackParamList, 'JobApplications'>;
type JobApplicationsScreenRouteProp = RouteProp<TrackerStackParamList, 'JobApplications'>;

interface JobApplicationsScreenProps {
  navigation: JobApplicationsScreenNavigationProp;
  route: JobApplicationsScreenRouteProp;
}

const { width } = Dimensions.get('window');
const isTablet = width > 768;

export const JobApplicationsScreen: React.FC<JobApplicationsScreenProps> = ({ navigation }) => {
  const {
    applications,
    isLoading,
    searchQuery,
    selectedStatus,
    loadApplications,
    setSearchQuery,
    setSelectedStatus,
  } = useJobTrackerStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(isTablet ? 'kanban' : 'list');

  useEffect(() => {
    loadApplications();
  }, []);

  // Filter applications based on search and status
  const filteredApplications = useMemo(() => {
    let filtered = applications;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.company.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query) ||
        app.location?.toLowerCase().includes(query) ||
        app.notes?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }
    
    return filtered;
  }, [applications, searchQuery, selectedStatus]);

  // Group applications by status for kanban view
  const applicationsByStatus = useMemo(() => {
    const grouped: Record<JobApplicationStatus, typeof applications> = {
      applied: [],
      interviewing: [],
      offer: [],
      rejected: [],
      withdrawn: [],
      saved: [],
    };
    
    filteredApplications.forEach(app => {
      grouped[app.status].push(app);
    });
    
    return grouped;
  }, [filteredApplications]);

  const handleApplicationPress = (applicationId: string) => {
    navigation.navigate('ApplicationDetails', { applicationId });
  };

  const renderKanbanView = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.kanbanContainer}
      style={styles.kanbanScroll}
    >
      <KanbanColumn
        title="Applied"
        status="applied"
        applications={applicationsByStatus.applied}
        onApplicationPress={(app) => handleApplicationPress(app.id)}
        accentColor={Colors.neutral[600]}
      />
      <KanbanColumn
        title="Interviewing"
        status="interviewing"
        applications={applicationsByStatus.interviewing}
        onApplicationPress={(app) => handleApplicationPress(app.id)}
        accentColor={Colors.calmBlue}
      />
      <KanbanColumn
        title="Offer"
        status="offer"
        applications={applicationsByStatus.offer}
        onApplicationPress={(app) => handleApplicationPress(app.id)}
        accentColor={Colors.successMint}
      />
    </ScrollView>
  );

  const renderListView = () => (
    <ScrollView
      style={styles.listScroll}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {filteredApplications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={64} color={Colors.textTertiary} />
          <H2 style={styles.emptyStateTitle}>
            {searchQuery ? 'No matching applications' : 'No applications yet'}
          </H2>
          <Body style={styles.emptyStateText}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Start tracking your job search journey'
            }
          </Body>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('AddJobApplication' as any)}
              accessibilityLabel="Add your first application"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
              <Body style={styles.emptyStateButtonText}>Add your first application</Body>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        filteredApplications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            onPress={() => handleApplicationPress(application.id)}
          />
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <H1 style={styles.headerTitle}>Job Tracker</H1>
          <Body style={styles.headerSubtitle}>Your path to the next chapter</Body>
        </View>
        <View style={styles.headerActions}>
          {isTablet && (
            <TouchableOpacity
              style={styles.viewModeButton}
              onPress={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}
              accessibilityLabel={`Switch to ${viewMode === 'kanban' ? 'list' : 'kanban'} view`}
              accessibilityRole="button"
            >
              <Ionicons 
                name={viewMode === 'kanban' ? 'list-outline' : 'grid-outline'} 
                size={24} 
                color={Colors.primary}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddJobApplication' as any)}
            accessibilityLabel="Add new application"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Body style={styles.addButtonText}>Add</Body>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TrackerStats applications={applications} />
        
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by company, role, or location..."
          />
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterChips}
            contentContainerStyle={styles.filterChipsContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                (!selectedStatus || selectedStatus === 'all') && styles.filterChipActive
              ]}
              onPress={() => setSelectedStatus('all')}
            >
              <BodySM style={[
                styles.filterChipText,
                (!selectedStatus || selectedStatus === 'all') && styles.filterChipTextActive
              ]}>
                All ({applications.length})
              </BodySM>
            </TouchableOpacity>
            
            {(['applied', 'interviewing', 'offer'] as JobApplicationStatus[]).map(status => {
              const count = applications.filter(app => app.status === status).length;
              const isActive = selectedStatus === status;
              
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <BodySM style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                  </BodySM>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {viewMode === 'kanban' && isTablet ? renderKanbanView() : renderListView()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.displayLG,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.semiBold,
    marginLeft: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  searchSection: {
    marginBottom: Spacing.lg,
  },
  filterChips: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.xs,
  },
  filterChipsContent: {
    paddingHorizontal: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSection,
    marginHorizontal: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: Typography.fontWeights.semiBold,
  },
  kanbanScroll: {
    marginHorizontal: -Spacing.lg,
  },
  kanbanContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSizes.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.semiBold,
    marginLeft: Spacing.sm,
  },
});

export default withErrorBoundary(JobApplicationsScreen, {
  errorMessage: {
    title: 'Application tracker loading issue',
    message: 'Your applications are safe. Please refresh to view them.'
  }
});