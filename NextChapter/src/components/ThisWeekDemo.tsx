import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Modal } from '@components/common/Modal';
import { BottomSheet } from '@components/common/BottomSheet';
import { Checkbox } from '@components/common/Checkbox';
import { RadioButton, RadioOption } from '@components/common/RadioButton';
import { ToggleSwitch } from '@components/common/ToggleSwitch';
import { SwipeableCard, SwipeAction } from '@components/common/SwipeableCard';
import { ExpandableCard } from '@components/common/ExpandableCard';
import { JobApplicationCard, JobApplication } from '@components/common/JobApplicationCard';
import { useToast } from '@context/../contexts/ToastContext';
import { Colors } from '@theme/colors';
import { Typography } from '@theme/typography';
import { Spacing } from '@theme/spacing';

export const ThisWeekDemo: React.FC = () => {
  const { showSuccess, showInfo } = useToast();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  
  // Form states
  const [checkboxStates, setCheckboxStates] = useState({
    task1: false,
    task2: false,
    task3: false,
  });
  
  const [radioValue, setRadioValue] = useState<string>('');
  const [toggleStates, setToggleStates] = useState({
    notifications: true,
    darkMode: false,
    accessibility: true,
  });

  const radioOptions: RadioOption[] = [
    {
      value: 'beginner',
      label: 'Just getting started',
      description: 'New to job searching, need guidance',
    },
    {
      value: 'experienced',
      label: 'Have some experience',
      description: 'Been through this before, know the basics',
    },
    {
      value: 'expert',
      label: 'Very experienced',
      description: 'Confident in my job search abilities',
    },
  ];

  const handleCheckboxToggle = (key: keyof typeof checkboxStates) => (checked: boolean) => {
    setCheckboxStates(prev => ({ ...prev, [key]: checked }));
    if (checked) {
      showSuccess('Task marked complete! Great progress! 🎉');
    }
  };

  const handleToggleChange = (key: keyof typeof toggleStates) => (value: boolean) => {
    setToggleStates(prev => ({ ...prev, [key]: value }));
    showInfo(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>This Week's UI Components</Text>
      
      {/* Modal System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modal System</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.buttonText}>Show Modal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => setShowBottomSheet(true)}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Show Bottom Sheet</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Form Controls Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enhanced Form Controls</Text>
        
        {/* Checkboxes */}
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Task Checkboxes</Text>
          <Checkbox
            checked={checkboxStates.task1}
            onToggle={handleCheckboxToggle('task1')}
            label="Update resume with recent experience"
            description="Add your most recent role and achievements"
            variant="success"
          />
          <Checkbox
            checked={checkboxStates.task2}
            onToggle={handleCheckboxToggle('task2')}
            label="Set up LinkedIn profile optimization"
            description="Ensure your profile is search-friendly"
            variant="gentle"
          />
          <Checkbox
            checked={checkboxStates.task3}
            onToggle={handleCheckboxToggle('task3')}
            label="Research target companies"
            description="Identify 10 companies you'd like to work for"
          />
        </View>

        {/* Radio Buttons */}
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Experience Level</Text>
          <RadioButton
            options={radioOptions}
            selectedValue={radioValue}
            onSelect={(value) => {
              setRadioValue(value);
              showInfo(`Selected: ${radioOptions.find(o => o.value === value)?.label}`);
            }}
            variant="supportive"
            accessibilityLabel="Select your job search experience level"
          />
        </View>

        {/* Toggle Switches */}
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Preferences</Text>
          <ToggleSwitch
            value={toggleStates.notifications}
            onToggle={handleToggleChange('notifications')}
            label="Push Notifications"
            description="Get gentle reminders for daily tasks"
            variant="success"
          />
          <ToggleSwitch
            value={toggleStates.darkMode}
            onToggle={handleToggleChange('darkMode')}
            label="Dark Mode"
            description="Easier on the eyes during evening sessions"
            variant="gentle"
          />
          <ToggleSwitch
            value={toggleStates.accessibility}
            onToggle={handleToggleChange('accessibility')}
            label="Enhanced Accessibility"
            description="Larger text and improved contrast"
          />
        </View>
      </View>

      {/* Enhanced Card System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enhanced Card System</Text>
        
        {/* Swipeable Cards */}
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Job Application Cards</Text>
          
          <SwipeableCard
            leftActions={[
              {
                id: 'complete',
                label: 'Applied',
                icon: '✓',
                color: '#FFFFFF',
                backgroundColor: Colors.success.main,
                onPress: () => showSuccess('Marked as applied! 🎉'),
              },
            ]}
            rightActions={[
              {
                id: 'archive',
                label: 'Archive',
                icon: '📁',
                color: '#FFFFFF',
                backgroundColor: Colors.warning.main,
                onPress: () => showInfo('Job archived'),
              },
            ]}
            onPress={() => showInfo('Job details opened')}
            accessibilityLabel="Software Engineer position at TechCorp"
            accessibilityHint="Swipe right to mark as applied, swipe left to archive"
          >
            <View style={styles.jobCard}>
              <Text style={styles.jobTitle}>Software Engineer</Text>
              <Text style={styles.jobCompany}>TechCorp Inc.</Text>
              <Text style={styles.jobLocation}>San Francisco, CA • Remote</Text>
              <Text style={styles.jobSalary}>$120k - $160k</Text>
            </View>
          </SwipeableCard>

          <SwipeableCard
            leftActions={[
              {
                id: 'interview',
                label: 'Interview',
                icon: '📞',
                color: '#FFFFFF',
                backgroundColor: Colors.primary.main,
                onPress: () => showSuccess('Interview scheduled! 📅'),
              },
            ]}
            rightActions={[
              {
                id: 'reject',
                label: 'Pass',
                icon: '❌',
                color: '#FFFFFF',
                backgroundColor: Colors.error.main,
                onPress: () => showInfo('Marked as not interested'),
              },
            ]}
            onPress={() => showInfo('Job details opened')}
          >
            <View style={styles.jobCard}>
              <Text style={styles.jobTitle}>Senior React Developer</Text>
              <Text style={styles.jobCompany}>StartupXYZ</Text>
              <Text style={styles.jobLocation}>New York, NY • Hybrid</Text>
              <Text style={styles.jobSalary}>$140k - $180k</Text>
            </View>
          </SwipeableCard>
        </View>

        {/* Expandable Cards */}
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Application Details</Text>
          
          <ExpandableCard
            title="Frontend Developer at InnovateCorp"
            subtitle="Applied 3 days ago"
            variant="info"
            onToggle={(expanded) => showInfo(`Details ${expanded ? 'expanded' : 'collapsed'}`)}
          >
            <View style={styles.expandableContent}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>Application Under Review</Text>
              
              <Text style={styles.detailLabel}>Next Steps:</Text>
              <Text style={styles.detailValue}>• Phone screening scheduled for Friday</Text>
              <Text style={styles.detailValue}>• Prepare portfolio presentation</Text>
              <Text style={styles.detailValue}>• Research company culture</Text>
              
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>Great company culture, strong engineering team. Focus on React and TypeScript experience.</Text>
            </View>
          </ExpandableCard>

          <ExpandableCard
            title="Full Stack Engineer at GrowthCo"
            subtitle="Interview completed"
            variant="success"
          >
            <View style={styles.expandableContent}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>Waiting for final decision</Text>
              
              <Text style={styles.detailLabel}>Interview Feedback:</Text>
              <Text style={styles.detailValue}>• Technical skills: Strong</Text>
              <Text style={styles.detailValue}>• Cultural fit: Excellent</Text>
              <Text style={styles.detailValue}>• Communication: Clear and confident</Text>
              
              <Text style={styles.detailLabel}>Follow-up:</Text>
              <Text style={styles.detailValue}>Send thank you email sent ✓</Text>
            </View>
          </ExpandableCard>
        </View>

        {/* Job Application Cards */}
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Smart Job Application Cards</Text>
          
          <JobApplicationCard
            application={{
              id: '1',
              title: 'Senior Frontend Developer',
              company: 'TechFlow Inc.',
              location: 'Austin, TX • Remote',
              salary: '$130k - $170k',
              status: 'saved',
              notes: 'Great company culture, strong React team. Perfect match for my skills.',
            }}
            onStatusChange={(id, status) => showSuccess(`Status updated to ${status}! 🎉`)}
            onArchive={(id) => showInfo('Application archived')}
            onDelete={(id) => showInfo('Application deleted')}
            onPress={(app) => showInfo(`Viewing details for ${app.title}`)}
            variant="compact"
          />

          <JobApplicationCard
            application={{
              id: '2',
              title: 'Full Stack Engineer',
              company: 'InnovateLabs',
              location: 'Seattle, WA • Hybrid',
              salary: '$140k - $180k',
              status: 'applied',
              appliedDate: '2024-01-10',
              nextSteps: ['Phone screening next week', 'Prepare technical presentation'],
              contactPerson: 'Sarah Johnson',
              notes: 'Applied through referral from John. Focus on Node.js and React experience.',
            }}
            onStatusChange={(id, status) => showSuccess(`Moved to ${status} phase! 💪`)}
            onArchive={(id) => showInfo('Application archived')}
            onDelete={(id) => showInfo('Application deleted')}
            onPress={(app) => showInfo(`Opening ${app.title} details`)}
            variant="detailed"
            showExpandedDetails={false}
          />

          <JobApplicationCard
            application={{
              id: '3',
              title: 'React Developer',
              company: 'StartupXYZ',
              location: 'San Francisco, CA',
              salary: '$120k - $150k',
              status: 'interview',
              appliedDate: '2024-01-05',
              interviewDate: '2024-01-20',
              nextSteps: ['Final round interview', 'Meet the team session'],
              contactPerson: 'Mike Chen',
              notes: 'Great interview! Team seems collaborative and innovative.',
            }}
            onStatusChange={(id, status) => showSuccess('Status updated! Keep going! 🚀')}
            onArchive={(id) => showInfo('Application archived')}
            onDelete={(id) => showInfo('Application deleted')}
            onPress={(app) => showInfo(`Viewing ${app.title} progress`)}
            variant="detailed"
            showExpandedDetails={true}
          />
        </View>
      </View>

      {/* Modal */}
      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Task Details"
        size="medium"
        accessibilityLabel="Task details modal"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            This is a consistent modal design that can be used across all screens. 
            It includes proper accessibility support, animations, and follows our 
            stress-friendly design principles.
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              setShowModal(false);
              showSuccess('Modal action completed!');
            }}
          >
            <Text style={styles.buttonText}>Complete Action</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Bottom Sheet */}
      <BottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="Mobile-Friendly Options"
        accessibilityLabel="Options bottom sheet"
      >
        <View style={styles.bottomSheetContent}>
          <Text style={styles.modalText}>
            Bottom sheets are perfect for mobile interactions. They feel natural 
            and don't overwhelm the user with a full-screen modal.
          </Text>
          
          <View style={styles.optionsList}>
            <TouchableOpacity style={styles.option} onPress={() => showInfo('Option 1 selected')}>
              <Text style={styles.optionText}>📝 Edit Task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => showInfo('Option 2 selected')}>
              <Text style={styles.optionText}>📅 Set Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => showInfo('Option 3 selected')}>
              <Text style={styles.optionText}>🗑️ Delete Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  subsection: {
    marginBottom: Spacing.lg,
  },
  subsectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  buttonText: {
    ...Typography.body.semiBold,
    color: Colors.text.inverse,
  },
  buttonTextSecondary: {
    color: Colors.text.primary,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalText: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  modalButton: {
    backgroundColor: Colors.success.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
  },
  bottomSheetContent: {
    // Content styling
  },
  optionsList: {
    marginTop: Spacing.lg,
  },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    marginBottom: Spacing.sm,
  },
  optionText: {
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  // Job Card Styles
  jobCard: {
    gap: Spacing.xs,
  },
  jobTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  jobCompany: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  jobLocation: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  jobSalary: {
    ...Typography.body.medium,
    color: Colors.success.main,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  // Expandable Card Styles
  expandableContent: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  detailLabel: {
    ...Typography.body.semiBold,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  detailValue: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});