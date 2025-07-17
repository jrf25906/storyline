import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../../context/ThemeContext';
import { BouncePlanTaskDefinition } from '../../../constants/bouncePlanTasks';
import { useBouncePlanStore } from '../../../stores/bouncePlanStore';

interface TaskDetailModalProps {
  task: BouncePlanTaskDefinition | null;
  visible: boolean;
  onClose: () => void;
  onComplete: (taskId: string, notes?: string) => void;
  onSkip: (taskId: string) => void;
  onReopen: (taskId: string) => void;
}

const CATEGORY_COLORS = {
  mindset: '#8B5CF6',
  practical: '#3B82F6',
  network: '#10B981',
  prepare: '#F59E0B',
  action: '#EF4444',
};

const CATEGORY_LABELS = {
  mindset: 'Mindset',
  practical: 'Practical',
  network: 'Network',
  prepare: 'Prepare',
  action: 'Action',
};

export default function TaskDetailModal({
  task,
  visible,
  onClose,
  onComplete,
  onSkip,
  onReopen,
}: TaskDetailModalProps) {
  const { theme } = useTheme();
  const [notes, setNotes] = useState('');
  const { getTaskStatus, taskNotes } = useBouncePlanStore();
  
  React.useEffect(() => {
    if (task && taskNotes[task.id]) {
      setNotes(taskNotes[task.id]);
    } else {
      setNotes('');
    }
  }, [task, taskNotes]);
  
  if (!task) return null;
  
  const status = getTaskStatus(task.id);
  const categoryColor = CATEGORY_COLORS[task.category];
  
  const handleComplete = () => {
    onComplete(task.id, notes);
    onClose();
  };
  
  const handleSkip = () => {
    Alert.alert(
      'Skip This Task?',
      'You can always come back to this task later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => {
            onSkip(task.id);
            onClose();
          }
        },
      ]
    );
  };
  
  const handleReopen = () => {
    onReopen(task.id);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.blurContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.closeButton}
                accessible={true}
                accessibilityLabel="Close task details"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              
              <View style={styles.headerInfo}>
                <View style={[styles.dayBadge, { backgroundColor: categoryColor + '20' }]}>
                  <Text style={[styles.dayText, { color: categoryColor }]}>
                    Day {task.day}
                  </Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
                  <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {CATEGORY_LABELS[task.category]}
                  </Text>
                </View>
                {task.duration !== '0 minutes' && (
                  <View style={styles.durationBadge}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.durationText, { color: theme.colors.textSecondary }]}>
                      {task.duration}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {task.title}
              </Text>
              
              {/* Description */}
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {task.description}
              </Text>
              
              {/* Tips */}
              {task.tips.length > 0 && !task.isWeekend && (
                <View style={styles.tipsSection}>
                  <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
                    Tips for Success:
                  </Text>
                  {task.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color={categoryColor} 
                      />
                      <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Notes Section */}
              {!task.isWeekend && (
                <View style={styles.notesSection}>
                  <Text style={[styles.notesTitle, { color: theme.colors.text }]}>
                    Your Notes:
                  </Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      {
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    multiline
                    numberOfLines={4}
                    placeholder="Add any thoughts or reflections..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    textAlignVertical="top"
                  />
                </View>
              )}
              
              {/* Status Badge */}
              {status === 'completed' && (
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  <Text style={[styles.statusText, { color: theme.colors.success }]}>
                    Task Completed
                  </Text>
                </View>
              )}
              
              {status === 'skipped' && (
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.warning} />
                  <Text style={[styles.statusText, { color: theme.colors.warning }]}>
                    Task Skipped
                  </Text>
                </View>
              )}
            </ScrollView>
            
            {/* Action Buttons */}
            {!task.isWeekend && (
              <View style={styles.actionButtons}>
                {status === 'available' && (
                  <>
                    <TouchableOpacity
                      style={[styles.skipButton, { borderColor: theme.colors.border }]}
                      onPress={handleSkip}
                      accessible={true}
                      accessibilityLabel="Skip this task"
                      accessibilityRole="button"
                    >
                      <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
                        Skip for Now
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
                      onPress={handleComplete}
                      accessible={true}
                      accessibilityLabel="Mark task as complete"
                      accessibilityRole="button"
                    >
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.completeButtonText}>
                        Mark Complete
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {(status === 'completed' || status === 'skipped') && (
                  <TouchableOpacity
                    style={[styles.reopenButton, { backgroundColor: theme.colors.surface }]}
                    onPress={handleReopen}
                    accessible={true}
                    accessibilityLabel="Reopen this task"
                    accessibilityRole="button"
                  >
                    <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                    <Text style={[styles.reopenButtonText, { color: theme.colors.primary }]}>
                      Reopen Task
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reopenButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  reopenButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});