import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResumeStore } from '@stores/resumeStore';
import { ResumeCard } from '@components/feature/resume/ResumeCard';
import { AnalysisResults } from '@components/feature/resume/AnalysisResults';
import { theme } from '@theme';
import { ResumeRewriteRequest } from '@types/resume';
import { useNavigation } from '@react-navigation/native';
import { withErrorBoundary } from '@components/common';

export const ResumeScannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    currentResume,
    resumes,
    currentAnalysis,
    uploadProgress,
    isLoading,
    error,
    hasAIConsent,
    uploadResume,
    analyzeResume,
    generateRewriteSuggestions,
    deleteResume,
    setCurrentResume,
    setAIConsent,
  } = useResumeStore();

  const [jobDescription, setJobDescription] = useState('');
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'creative' | 'technical'>('professional');
  const [focusAreas, setFocusAreas] = useState('');

  // Error message mapping
  const getErrorMessage = (err: string | null): string => {
    if (!err) return '';
    
    const errorMap: Record<string, string> = {
      'Network error': 'Unable to connect. Please check your internet connection.',
      'Rate limit exceeded': 'Too many requests. Please try again later.',
      'Invalid file format': 'Please upload a PDF, DOCX, DOC, or TXT file.',
    };

    return errorMap[err] || err;
  };

  const handleDeleteResume = (resumeId: string) => {
    Alert.alert(
      'Delete Resume',
      'Are you sure you want to delete this resume?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteResume(resumeId),
        },
      ]
    );
  };

  const handleAnalyze = () => {
    if (!hasAIConsent) return;
    analyzeResume(jobDescription);
  };

  const handleGenerateRewrite = async () => {
    if (!currentAnalysis) return;

    const request: ResumeRewriteRequest = {
      resumeId: currentResume!.id,
      targetKeywords: currentAnalysis.missingKeywords,
      jobDescription: jobDescription || undefined,
      tone: selectedTone,
      focusAreas: focusAreas.split(',').map(area => area.trim()).filter(Boolean),
    };

    await generateRewriteSuggestions(request);
    setShowRewriteModal(false);
  };

  const handleLinkToJob = () => {
    if (!currentResume) return;

    navigation.navigate('Tracker', {
      resumeId: currentResume.id,
      keywords: currentResume.extractedKeywords,
    });
  };

  const renderUploadSection = () => {
    if (uploadProgress) {
      return (
        <View style={styles.uploadProgress}>
          <Text style={styles.uploadProgressText}>{uploadProgress.message}</Text>
          <View
            testID="progress-bar"
            style={styles.progressBar}
            accessibilityValue={{
              now: uploadProgress.progress,
              min: 0,
              max: 100,
            }}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${uploadProgress.progress}%` },
              ]}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.uploadSection}>
        <Text style={styles.uploadTitle}>Upload Your Resume</Text>
        <Text style={styles.uploadSubtitle}>
          Supported formats: PDF, DOCX, DOC, TXT
        </Text>
        <TouchableOpacity
          testID="upload-button"
          style={styles.uploadButton}
          onPress={uploadResume}
          accessible
          accessibilityLabel="Upload resume file"
          accessibilityRole="button"
        >
          <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.surface} />
          <Text style={styles.uploadButtonText}>Choose File</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderConsentSection = () => (
    <View style={styles.consentSection}>
      <View style={styles.consentHeader}>
        <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.consentTitle}>AI-Powered Resume Analysis</Text>
      </View>
      <Text style={styles.consentText}>
        Enable AI analysis to get personalized suggestions and keyword optimization.
        Your data is encrypted and never shared.
      </Text>
      <View style={styles.consentToggle}>
        <Text style={styles.consentLabel}>Enable AI Analysis</Text>
        <Switch
          testID="consent-toggle"
          value={hasAIConsent}
          onValueChange={setAIConsent}
          accessibilityLabel="Enable AI-powered analysis"
        />
      </View>
    </View>
  );

  const renderResumeList = () => {
    if (resumes.length === 0) return null;

    return (
      <View style={styles.resumeListSection}>
        <Text style={styles.sectionTitle}>Your Resumes</Text>
        {resumes.map(resume => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            onPress={setCurrentResume}
            onDelete={handleDeleteResume}
            isSelected={currentResume?.id === resume.id}
            showKeywords
          />
        ))}
      </View>
    );
  };

  const renderCurrentResume = () => {
    if (!currentResume) return null;

    return (
      <View style={styles.currentResumeSection}>
        <View style={styles.currentResumeHeader}>
          <Text style={styles.sectionTitle}>{currentResume.fileName}</Text>
          <TouchableOpacity
            testID="delete-resume-button"
            onPress={() => handleDeleteResume(currentResume.id)}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.keywordCount}>
          Keywords Found: {currentResume.extractedKeywords.length}
        </Text>
        
        <ScrollView
          testID="keyword-list"
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.keywordList}
        >
          {currentResume.extractedKeywords.map((keyword, index) => (
            <View key={index} style={styles.keywordChip}>
              <Text style={styles.keywordChipText}>{keyword}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>Job Description (Optional)</Text>
          <TextInput
            style={styles.jobDescriptionInput}
            placeholder="Paste job description here (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={4}
            value={jobDescription}
            onChangeText={setJobDescription}
          />
          
          <TouchableOpacity
            testID="analyze-button"
            style={[
              styles.analyzeButton,
              !hasAIConsent && styles.disabledButton,
            ]}
            onPress={handleAnalyze}
            disabled={!hasAIConsent || isLoading}
            accessibilityState={{ disabled: !hasAIConsent }}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <>
                <Ionicons name="analytics-outline" size={20} color={theme.colors.surface} />
                <Text style={styles.analyzeButtonText}>Analyze Resume</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {currentAnalysis && (
          <>
            <Text style={styles.sectionTitle}>Analysis Results</Text>
            <AnalysisResults
              analysis={currentAnalysis}
              onGenerateRewrite={() => setShowRewriteModal(true)}
            />
            
            <TouchableOpacity
              testID="link-job-button"
              style={styles.linkJobButton}
              onPress={handleLinkToJob}
            >
              <Ionicons name="link-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.linkJobButtonText}>Link to Job Application</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderRewriteModal = () => (
    <Modal
      visible={showRewriteModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowRewriteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent} testID="rewrite-modal">
          <Text style={styles.modalTitle}>AI Rewrite Suggestions</Text>
          
          <Text style={styles.modalLabel}>Tone</Text>
          <View style={styles.toneButtons}>
            {(['professional', 'creative', 'technical'] as const).map(tone => (
              <TouchableOpacity
                key={tone}
                testID={`tone-${tone}`}
                style={[
                  styles.toneButton,
                  selectedTone === tone && styles.selectedToneButton,
                ]}
                onPress={() => setSelectedTone(tone)}
              >
                <Text
                  style={[
                    styles.toneButtonText,
                    selectedTone === tone && styles.selectedToneButtonText,
                  ]}
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalLabel}>Focus Areas</Text>
          <TextInput
            testID="focus-areas-input"
            style={styles.focusAreasInput}
            placeholder="e.g., Leadership, Cloud Architecture"
            placeholderTextColor={theme.colors.textSecondary}
            value={focusAreas}
            onChangeText={setFocusAreas}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowRewriteModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="generate-rewrite-button"
              style={styles.modalGenerateButton}
              onPress={handleGenerateRewrite}
            >
              <Text style={styles.modalGenerateText}>Generate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Resume Scanner</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
            <TouchableOpacity
              testID="dismiss-error"
              onPress={() => useResumeStore.setState({ error: null })}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {!currentResume && renderUploadSection()}
        {renderConsentSection()}
        {renderResumeList()}
        {renderCurrentResume()}
      </ScrollView>

      {currentAnalysis && (
        <TouchableOpacity
          testID="generate-suggestions-button"
          style={styles.floatingButton}
          onPress={() => setShowRewriteModal(true)}
        >
          <Ionicons name="sparkles" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      )}

      {renderRewriteModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
  },
  errorText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: 14,
  },
  uploadSection: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    minHeight: 48,
  },
  uploadButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  uploadProgress: {
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  uploadProgressText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  consentSection: {
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  consentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  consentText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  consentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  consentLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  resumeListSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  currentResumeSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  currentResumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  keywordCount: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  keywordList: {
    marginBottom: theme.spacing.lg,
  },
  keywordChip: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  keywordChipText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  analysisSection: {
    marginBottom: theme.spacing.lg,
  },
  jobDescriptionInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.md,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    minHeight: 48,
  },
  analyzeButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  linkJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.md,
  },
  linkJobButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  floatingButton: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.large,
    borderTopRightRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  toneButtons: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  toneButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
  },
  selectedToneButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toneButtonText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedToneButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  focusAreasInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  modalGenerateButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginLeft: theme.spacing.sm,
    alignItems: 'center',
  },
  modalGenerateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.surface,
  },
});

export default withErrorBoundary(ResumeScannerScreen, {
  errorMessage: {
    title: 'Resume scanner temporarily unavailable',
    message: "We're working on the scanner. Please try again in a moment."
  }
});