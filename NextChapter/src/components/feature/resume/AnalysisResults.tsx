import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResumeAnalysis, ResumeSuggestion } from '@types/resume';
import { theme } from '@theme';

interface AnalysisResultsProps {
  analysis: ResumeAnalysis;
  onGenerateRewrite: () => void;
  onApplySuggestion?: (suggestion: ResumeSuggestion) => void;
  onExport?: (analysis: ResumeAnalysis) => void;
  isGeneratingRewrite?: boolean;
}

const SCORE_COLORS = {
  high: '#2ECC71',
  medium: '#F39C12',
  low: '#E74C3C',
};

const RELEVANCE_COLORS = {
  high: '#2ECC71',
  medium: '#F39C12',
  low: '#95A5A6',
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  onGenerateRewrite,
  onApplySuggestion,
  onExport,
  isGeneratingRewrite = false,
}) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  const getScoreColor = (score: number): string => {
    if (score >= 80) return SCORE_COLORS.high;
    if (score >= 60) return SCORE_COLORS.medium;
    return SCORE_COLORS.low;
  };

  const getScoreMessage = (score: number): string => {
    if (score >= 80) return 'Excellent match!';
    if (score >= 60) return 'Good match with room for improvement';
    return 'Consider adding more relevant keywords';
  };

  const toggleSuggestion = (suggestionId: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(suggestionId)) {
      newExpanded.delete(suggestionId);
    } else {
      newExpanded.add(suggestionId);
    }
    setExpandedSuggestions(newExpanded);
  };

  const renderScore = () => {
    const scoreColor = getScoreColor(analysis.overallScore);
    const scoreMessage = getScoreMessage(analysis.overallScore);

    return (
      <View style={styles.scoreSection}>
        <View
          testID="score-circle"
          style={[styles.scoreCircle, { borderColor: scoreColor }]}
          accessible
          accessibilityLabel={`Resume match score: ${analysis.overallScore} percent. ${scoreMessage}`}
        >
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {analysis.overallScore}%
          </Text>
        </View>
        <Text style={styles.scoreMessage}>{scoreMessage}</Text>
      </View>
    );
  };

  const renderMatchedKeywords = () => {
    if (analysis.matchedKeywords.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>No matching keywords found</Text>
        </View>
      );
    }

    // Sort by relevance then by count
    const sortedKeywords = [...analysis.matchedKeywords].sort((a, b) => {
      const relevanceOrder = { high: 0, medium: 1, low: 2 };
      if (relevanceOrder[a.relevance] !== relevanceOrder[b.relevance]) {
        return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
      }
      return b.count - a.count;
    });

    return (
      <View>
        {sortedKeywords.map((match, index) => (
          <View
            key={`keyword-match-${index}`}
            testID={`keyword-match-${index}`}
            style={styles.keywordItem}
          >
            <View style={styles.keywordInfo}>
              <Text style={styles.keywordText}>{match.keyword}</Text>
              <Text style={styles.keywordCount}>{match.count}x</Text>
            </View>
            <View
              testID={`relevance-badge-${match.relevance}-${index}`}
              style={[
                styles.relevanceBadge,
                { backgroundColor: RELEVANCE_COLORS[match.relevance] },
              ]}
            >
              <Text style={styles.relevanceText}>{match.relevance.toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderMissingKeywords = () => {
    if (analysis.missingKeywords.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>All required keywords are present!</Text>
        </View>
      );
    }

    return (
      <View>
        {analysis.missingKeywords.map((keyword, index) => (
          <View
            key={`missing-keyword-${index}`}
            testID={`missing-keyword-${index}`}
            style={styles.missingKeywordItem}
          >
            <Text style={styles.missingKeywordText}>{keyword}</Text>
            {onApplySuggestion && (
              <TouchableOpacity
                testID={`add-keyword-button-${index}`}
                accessibilityLabel={`Add ${keyword} to resume`}
                style={styles.addButton}
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderSuggestions = () => {
    if (analysis.suggestions.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>No specific improvements suggested</Text>
        </View>
      );
    }

    // Group by priority
    const groupedSuggestions = analysis.suggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.priority]) {
        acc[suggestion.priority] = [];
      }
      acc[suggestion.priority].push(suggestion);
      return acc;
    }, {} as Record<string, ResumeSuggestion[]>);

    return (
      <View>
        {(['high', 'medium', 'low'] as const).map(priority => {
          const suggestions = groupedSuggestions[priority];
          if (!suggestions || suggestions.length === 0) return null;

          return suggestions.map(suggestion => {
            const isExpanded = expandedSuggestions.has(suggestion.id);
            const iconName = 
              suggestion.type === 'keyword' ? 'key-outline' :
                suggestion.type === 'format' ? 'document-text-outline' :
                  suggestion.type === 'content' ? 'create-outline' :
                    'folder-outline';

            return (
              <TouchableOpacity
                key={suggestion.id}
                testID={`suggestion-card-${suggestion.id}`}
                style={styles.suggestionCard}
                onPress={() => toggleSuggestion(suggestion.id)}
              >
                <View style={styles.suggestionHeader}>
                  <Ionicons
                    testID={`suggestion-icon-${suggestion.type}`}
                    name={iconName as any}
                    size={20}
                    color={SCORE_COLORS[priority]}
                  />
                  <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
                  {suggestion.applied && (
                    <Ionicons
                      testID={`applied-checkmark-${suggestion.id}`}
                      name="checkmark-circle"
                      size={20}
                      color={SCORE_COLORS.high}
                    />
                  )}
                </View>
                
                {isExpanded && (
                  <View style={styles.suggestionDetails}>
                    <Text style={styles.suggestionLabel}>Original:</Text>
                    <Text style={styles.originalText}>{suggestion.originalText}</Text>
                    <Text style={styles.suggestionLabel}>Suggested:</Text>
                    <Text style={styles.suggestedText}>{suggestion.suggestedText}</Text>
                    
                    {onApplySuggestion && !suggestion.applied && (
                      <TouchableOpacity
                        testID={`apply-suggestion-button-${suggestion.id}`}
                        style={styles.applyButton}
                        onPress={() => onApplySuggestion(suggestion)}
                      >
                        <Text style={styles.applyButtonText}>Apply Suggestion</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          });
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderScore()}

      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
          accessibilityRole="header"
        >
          Matched Keywords ({analysis.matchedKeywords.length})
        </Text>
        <View testID="matched-keywords">
          {renderMatchedKeywords()}
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
          accessibilityRole="header"
        >
          Missing Keywords ({analysis.missingKeywords.length})
        </Text>
        <View testID="missing-keywords">
          {renderMissingKeywords()}
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={styles.sectionTitle}
          accessibilityRole="header"
        >
          Improvement Suggestions
        </Text>
        <View testID="suggestions-list">
          {renderSuggestions()}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          testID="generate-rewrite-button"
          style={[styles.primaryButton, isGeneratingRewrite && styles.disabledButton]}
          onPress={onGenerateRewrite}
          disabled={isGeneratingRewrite}
          accessible
          accessibilityLabel="Generate AI-powered rewrite suggestions"
          accessibilityRole="button"
          accessibilityState={{ disabled: isGeneratingRewrite }}
        >
          {isGeneratingRewrite ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={theme.colors.surface} />
              <Text style={styles.primaryButtonText}>Generate AI Rewrite</Text>
            </>
          )}
        </TouchableOpacity>

        {onExport && (
          <TouchableOpacity
            testID="export-analysis-button"
            style={styles.secondaryButton}
            onPress={() => onExport(analysis)}
          >
            <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.secondaryButtonText}>Export Analysis</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scoreSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  keywordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  keywordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  keywordText: {
    fontSize: 16,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  keywordCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  relevanceBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  relevanceText: {
    fontSize: 12,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  missingKeywordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  missingKeywordText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  suggestionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionReason: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  suggestionDetails: {
    marginTop: theme.spacing.md,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  originalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestedText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  applyButtonText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  emptySection: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
});