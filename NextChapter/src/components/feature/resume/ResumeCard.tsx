import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Resume } from '../../../types/resume';
import { theme } from '../../../theme';

interface ResumeCardProps {
  resume: Resume;
  onPress: (resume: Resume) => void;
  onDelete: (resumeId: string) => void;
  isSelected?: boolean;
  showKeywords?: boolean;
  isDeleting?: boolean;
}

const FILE_TYPE_COLORS = {
  '.pdf': '#E74C3C',
  '.docx': '#3498DB',
  '.doc': '#3498DB',
  '.txt': '#95A5A6',
};

export const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  onPress,
  onDelete,
  isSelected = false,
  showKeywords = false,
  isDeleting = false,
}) => {
  const handlePress = () => {
    if (!isDeleting) {
      onPress(resume);
    }
  };

  const handleDelete = (e?: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    onDelete(resume.id);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderKeywords = () => {
    if (!showKeywords || resume.extractedKeywords.length === 0) return null;

    const displayKeywords = resume.extractedKeywords.slice(0, 3);
    const remainingCount = resume.extractedKeywords.length - 3;

    return (
      <View style={styles.keywordsContainer}>
        {displayKeywords.map((keyword, index) => (
          <View key={index} style={styles.keywordBadge}>
            <Text style={styles.keywordText}>{keyword}</Text>
          </View>
        ))}
        {remainingCount > 0 && (
          <Text style={styles.moreKeywords}>+{remainingCount} more</Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      testID="resume-card"
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Resume: ${resume.fileName}, ${resume.fileType.substring(1).toUpperCase()} file, ${resume.extractedKeywords.length} keywords extracted`}
      accessibilityState={{ disabled: isDeleting }}
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        isDeleting && styles.disabledCard,
      ]}
      onPress={handlePress}
      disabled={isDeleting}
    >
      <View style={styles.header}>
        <View style={styles.fileInfo}>
          <View
            testID="file-type-badge"
            style={[
              styles.fileTypeBadge,
              { backgroundColor: FILE_TYPE_COLORS[resume.fileType] || '#95A5A6' },
            ]}
          >
            <Text style={styles.fileTypeText}>
              {resume.fileType.substring(1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.fileDetails}>
            <Text
              style={styles.fileName}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {resume.fileName}
            </Text>
            <Text style={styles.metadata}>
              {resume.extractedKeywords.length} keywords extracted
            </Text>
            <Text style={styles.metadata}>
              Last modified: {formatDate(resume.lastModified)}
            </Text>
          </View>
        </View>
        {isDeleting ? (
          <ActivityIndicator
            testID="delete-spinner"
            size="small"
            color={theme.colors.error}
          />
        ) : (
          <TouchableOpacity
            testID="delete-button"
            accessible
            accessibilityLabel="Delete resume"
            accessibilityRole="button"
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>
      {renderKeywords()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#2ECC71',
  },
  disabledCard: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fileInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  fileTypeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    marginRight: theme.spacing.sm,
    height: 32,
    justifyContent: 'center',
  },
  fileTypeText: {
    color: theme.colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  metadata: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  deleteButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  keywordBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  keywordText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  moreKeywords: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});