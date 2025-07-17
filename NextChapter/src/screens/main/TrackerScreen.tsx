import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useJobTrackerStore } from '../../stores/jobTrackerStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { JobApplication, JobApplicationStatus } from '../../types/database';
import KanbanBoard from '../../components/feature/job-tracker/KanbanBoard';
import SearchFilterBar from '../../components/feature/job-tracker/SearchFilterBar';
import JobApplicationModal from '../../components/feature/job-tracker/JobApplicationModal';
import { 
  withErrorBoundary,
  Container
} from '../../components/common';

// Emotional Intelligence Components
import { EmotionalStateDetector } from '../../components/emotional/EmotionalStateDetector';
import { AdaptiveUIWrapper, useAdaptiveSpacing } from '../../components/emotional/AdaptiveUIWrapper';
import { SuccessCelebration } from '../../components/emotional/SuccessCelebration';
import { useEmotionalState } from '../../context/EmotionalStateContext';
import { useAccessibility } from '../../hooks/useAccessibility';

function TrackerScreen() {
  const { theme } = useTheme();
  const isConnected = useNetworkStatus();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);

  // Emotional Intelligence hooks
  const { emotionalState } = useEmotionalState();
  const { announceForAccessibility } = useAccessibility();
  const adaptiveSpacing = useAdaptiveSpacing();

  // Celebration state
  const [celebrationData, setCelebrationData] = useState<{
    visible: boolean;
    achievement: string;
    message?: string;
  }>({ visible: false, achievement: '' });

  const {
    applications,
    isLoading,
    searchQuery,
    selectedStatus,
    loadApplications,
    addApplication,
    updateApplication,
    updateApplicationStatus,
    deleteApplication,
    setSearchQuery,
    setSelectedStatus,
    syncWithSupabase,
  } = useJobTrackerStore();

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    // Sync with Supabase when coming back online
    if (isConnected) {
      syncWithSupabase();
    }
  }, [isConnected]);

  // Filter applications based on search query and selected status
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(app => app.status === selectedStatus);
    } else {
      // For Kanban view, only show applied, interviewing, and offer statuses
      filtered = filtered.filter(app => 
        app.status === 'applied' || 
        app.status === 'interviewing' || 
        app.status === 'offer'
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.company.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query) ||
        (app.location && app.location.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [applications, searchQuery, selectedStatus]);

  const handleAddPress = () => {
    setSelectedApplication(null);
    setModalVisible(true);
  };

  const handleCardPress = (application: JobApplication) => {
    setSelectedApplication(application);
    setModalVisible(true);
  };

  const handleSaveApplication = async (applicationData: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await addApplication(applicationData);
  };

  const handleUpdateApplication = async (id: string, updates: Partial<JobApplication>) => {
    await updateApplication(id, updates);
  };

  const handleDeleteApplication = async (id: string) => {
    await deleteApplication(id);
  };

  const handleStatusChange = async (id: string, newStatus: JobApplicationStatus) => {
    await updateApplicationStatus(id, newStatus);
    
    // Trigger celebrations for positive status changes
    const application = applications.find(app => app.id === id);
    if (application && newStatus === 'interviewing') {
      setCelebrationData({
        visible: true,
        achievement: 'Interview Scheduled!',
        message: `Great news! You have an interview with ${application.company}. You're making excellent progress!`,
      });
      announceForAccessibility(`Interview scheduled with ${application.company}! Congratulations!`);
    } else if (application && newStatus === 'offer') {
      setCelebrationData({
        visible: true,
        achievement: 'Job Offer Received!',
        message: `Amazing! ${application.company} has made you an offer. Your hard work is paying off!`,
      });
      announceForAccessibility(`Job offer received from ${application.company}! Incredible achievement!`);
    }
  };

  const handleSaveApplicationWithCelebration = async (applicationData: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await addApplication(applicationData);
    
    // Celebrate new application submission
    setCelebrationData({
      visible: true,
      achievement: 'Application Submitted!',
      message: `You've applied to ${applicationData.company}! Every application brings you closer to your next opportunity.`,
    });
    announceForAccessibility(`Application submitted to ${applicationData.company}! Great job taking action!`);
  };

  // Announce emotional state context for job tracking
  useEffect(() => {
    const contextMessages = {
      crisis: 'Job tracking simplified for easier navigation. Focus on one step at a time.',
      success: 'Celebrating your job search progress! Keep up the momentum.',
      struggling: 'Remember, every application is progress. You\'re doing great.',
      normal: 'Job tracker loaded. Track your applications and celebrate progress.',
    };

    if (applications.length === 0 && emotionalState === 'struggling') {
      announceForAccessibility('Starting your job search can feel overwhelming, but you\'re in the right place. Take it one application at a time.');
    } else if (emotionalState !== 'normal') {
      announceForAccessibility(contextMessages[emotionalState]);
    }
  }, [emotionalState, applications.length, announceForAccessibility]);

  if (isLoading) {
    return (
      <EmotionalStateDetector>
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </EmotionalStateDetector>
    );
  }

  return (
    <EmotionalStateDetector showIndicator={true}>
      <AdaptiveUIWrapper>
        <Container variant="fullscreen">
          <SafeAreaView style={[styles.container, { padding: adaptiveSpacing.screenPadding }]}>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onAddPress={handleAddPress}
        />

        <KanbanBoard
          applications={filteredApplications}
          onStatusChange={handleStatusChange}
          onCardPress={handleCardPress}
        />

        <JobApplicationModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveApplicationWithCelebration}
          onUpdate={handleUpdateApplication}
          onDelete={handleDeleteApplication}
          application={selectedApplication}
        />

        {/* Success Celebration Modal */}
        <SuccessCelebration
          visible={celebrationData.visible}
          onClose={() => setCelebrationData({ visible: false, achievement: '' })}
          achievement={celebrationData.achievement}
          message={celebrationData.message}
        />
      </SafeAreaView>
        </Container>
      </AdaptiveUIWrapper>
    </EmotionalStateDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default withErrorBoundary(TrackerScreen, {
  errorMessage: {
    title: 'Job tracker temporarily unavailable',
    message: "Don't worry, your data is safe. Please try again in a moment."
  }
});