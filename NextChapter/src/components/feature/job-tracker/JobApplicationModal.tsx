import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobApplication, JobApplicationStatus } from '@types/database';
import { useTheme } from '@context/ThemeContext';
import Button from '@components/common/Button';

interface JobApplicationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (application: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onUpdate?: (id: string, updates: Partial<JobApplication>) => void;
  onDelete?: (id: string) => void;
  application?: JobApplication | null;
}

const STATUS_OPTIONS: { value: JobApplicationStatus; label: string; color: string }[] = [
  { value: 'saved', label: 'Saved', color: '#6B7280' },
  { value: 'applied', label: 'Applied', color: '#3B82F6' },
  { value: 'interviewing', label: 'Interviewing', color: '#F59E0B' },
  { value: 'offer', label: 'Offer', color: '#10B981' },
  { value: 'rejected', label: 'Rejected', color: '#EF4444' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#9333EA' },
];

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  visible,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  application,
}) => {
  const { theme } = useTheme();
  const isEditing = !!application;

  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    salary_range: '',
    status: 'applied' as JobApplicationStatus,
    applied_date: new Date().toISOString().split('T')[0],
    notes: '',
    job_posting_url: '',
    contact_name: '',
    contact_email: '',
  });

  useEffect(() => {
    if (application) {
      setFormData({
        company: application.company || '',
        position: application.position || '',
        location: application.location || '',
        salary_range: application.salary_range || '',
        status: application.status || 'applied',
        applied_date: application.applied_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: application.notes || '',
        job_posting_url: application.job_posting_url || '',
        contact_name: application.contact_name || '',
        contact_email: application.contact_email || '',
      });
    } else {
      // Reset form for new application
      setFormData({
        company: '',
        position: '',
        location: '',
        salary_range: '',
        status: 'applied',
        applied_date: new Date().toISOString().split('T')[0],
        notes: '',
        job_posting_url: '',
        contact_name: '',
        contact_email: '',
      });
    }
  }, [application]);

  const handleSave = () => {
    if (!formData.company.trim() || !formData.position.trim()) {
      Alert.alert('Required Fields', 'Please enter company name and position.');
      return;
    }

    const applicationData = {
      ...formData,
      applied_date: formData.status === 'applied' || formData.status === 'interviewing' || formData.status === 'offer' 
        ? formData.applied_date 
        : undefined,
    };

    if (isEditing && application && onUpdate) {
      onUpdate(application.id, applicationData);
    } else {
      onSave(applicationData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!application || !onDelete) return;

    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this job application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(application.id);
            onClose();
          },
        },
      ]
    );
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    multiline?: boolean,
    keyboardType?: 'default' | 'email-address' | 'url'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {isEditing ? 'Edit Application' : 'Add Job Application'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderInput(
              'Company *',
              formData.company,
              (text) => setFormData({ ...formData, company: text }),
              'e.g. Google'
            )}

            {renderInput(
              'Position *',
              formData.position,
              (text) => setFormData({ ...formData, position: text }),
              'e.g. Senior Software Engineer'
            )}

            {renderInput(
              'Location',
              formData.location,
              (text) => setFormData({ ...formData, location: text }),
              'e.g. San Francisco, CA'
            )}

            {renderInput(
              'Salary Range',
              formData.salary_range,
              (text) => setFormData({ ...formData, salary_range: text }),
              'e.g. $120k - $150k'
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Status</Text>
              <View style={styles.statusContainer}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor: formData.status === option.value ? option.color : theme.colors.background,
                        borderColor: option.color,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, status: option.value })}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: formData.status === option.value ? '#FFFFFF' : option.color,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(formData.status === 'applied' || formData.status === 'interviewing' || formData.status === 'offer') && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>Applied Date</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  value={formData.applied_date}
                  onChangeText={(text) => setFormData({ ...formData, applied_date: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            )}

            {renderInput(
              'Job Posting URL',
              formData.job_posting_url,
              (text) => setFormData({ ...formData, job_posting_url: text }),
              'https://...',
              false,
              'url'
            )}

            {renderInput(
              'Contact Name',
              formData.contact_name,
              (text) => setFormData({ ...formData, contact_name: text }),
              'e.g. John Smith'
            )}

            {renderInput(
              'Contact Email',
              formData.contact_email,
              (text) => setFormData({ ...formData, contact_email: text }),
              'john.smith@company.com',
              false,
              'email-address'
            )}

            {renderInput(
              'Notes',
              formData.notes,
              (text) => setFormData({ ...formData, notes: text }),
              'Add any notes about this application...',
              true
            )}
          </ScrollView>

          <View style={styles.footer}>
            {isEditing && onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )}
            <View style={styles.actionButtons}>
              <Button
                title="Cancel"
                onPress={onClose}
                variant="outline"
                style={styles.button}
              />
              <Button
                title={isEditing ? 'Update' : 'Add'}
                onPress={handleSave}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    minWidth: 80,
  },
});

export default JobApplicationModal;