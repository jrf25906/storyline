import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobApplicationStatus } from '@types/database';
import { Colors, Typography, Spacing, Borders } from '@theme';
import Card from '@components/common/Card';

interface AddApplicationModalProps {
  onClose: () => void;
  onSave: (application: {
    company: string;
    position: string;
    location?: string;
    salary_range?: string;
    status: JobApplicationStatus;
    notes?: string;
    job_posting_url?: string;
  }) => void;
}

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  onClose,
  onSave,
}) => {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [status, setStatus] = useState<JobApplicationStatus>('applied');
  const [notes, setNotes] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  const handleSave = () => {
    if (!company.trim() || !position.trim()) return;

    onSave({
      company: company.trim(),
      position: position.trim(),
      location: location.trim() || undefined,
      salary_range: salaryRange.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
      job_posting_url: jobUrl.trim() || undefined,
    });
  };

  const isValid = company.trim() && position.trim();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card variant="elevated" style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Application</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company *</Text>
              <TextInput
                style={styles.input}
                value={company}
                onChangeText={setCompany}
                placeholder="e.g., TechCorp Inc."
                placeholderTextColor={Colors.textTertiary}
                accessibilityLabel="Company name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Position *</Text>
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={setPosition}
                placeholder="e.g., Senior Developer"
                placeholderTextColor={Colors.textTertiary}
                accessibilityLabel="Position title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., San Francisco, CA or Remote"
                placeholderTextColor={Colors.textTertiary}
                accessibilityLabel="Job location"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salary Range</Text>
              <TextInput
                style={styles.input}
                value={salaryRange}
                onChangeText={setSalaryRange}
                placeholder="e.g., $120k-140k"
                placeholderTextColor={Colors.textTertiary}
                accessibilityLabel="Salary range"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusOptions}>
                {(['saved', 'applied', 'interviewing'] as JobApplicationStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      status === s && styles.statusOptionActive,
                    ]}
                    onPress={() => setStatus(s)}
                    accessibilityLabel={`Status: ${s}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: status === s }}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        status === s && styles.statusOptionTextActive,
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Posting URL</Text>
              <TextInput
                style={styles.input}
                value={jobUrl}
                onChangeText={setJobUrl}
                placeholder="https://..."
                placeholderTextColor={Colors.textTertiary}
                keyboardType="url"
                autoCapitalize="none"
                accessibilityLabel="Job posting URL"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this application..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="Application notes"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid}
              accessibilityLabel="Save application"
              accessibilityRole="button"
              accessibilityState={{ disabled: !isValid }}
            >
              <Text style={styles.saveButtonText}>Save Application</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modal: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSizes.headingLG,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSizes.bodySM,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Borders.radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSizes.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.sm,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  statusOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSection,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
  statusOptionTextActive: {
    color: Colors.white,
    fontWeight: Typography.fontWeights.semiBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Borders.radius.md,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.white,
  },
});