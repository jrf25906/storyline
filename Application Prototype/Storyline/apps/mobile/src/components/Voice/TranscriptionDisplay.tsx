/**
 * Transcription Display Component
 * Shows transcribed text with sentiment and highlights
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

interface TranscriptionDisplayProps {
  text?: string;
  isLoading?: boolean;
  sentiment?: {
    text: string;
    confidence: number;
  };
  summary?: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  textColor?: string;
  backgroundColor?: string;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  text,
  isLoading,
  sentiment,
  summary,
  words,
  textColor = '#1B1C1E',
  backgroundColor = '#F5F4F2',
}) => {
  const getSentimentColor = (sentimentText?: string) => {
    switch (sentimentText?.toLowerCase()) {
      case 'positive':
        return '#A8C090';
      case 'negative':
        return '#E94B3C';
      case 'neutral':
      default:
        return '#6E7076';
    }
  };

  const getSentimentEmoji = (sentimentText?: string) => {
    switch (sentimentText?.toLowerCase()) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😔';
      case 'neutral':
      default:
        return '😐';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={textColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Transcribing your words...
          </Text>
        </View>
      </View>
    );
  }

  if (!text) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sentiment indicator */}
        {sentiment && (
          <View style={styles.sentimentContainer}>
            <Text style={styles.sentimentEmoji}>
              {getSentimentEmoji(sentiment.text)}
            </Text>
            <Text style={[styles.sentimentText, { color: getSentimentColor(sentiment.text) }]}>
              {sentiment.text} ({Math.round(sentiment.confidence * 100)}% confident)
            </Text>
          </View>
        )}

        {/* Main transcription */}
        <Text style={[styles.transcriptionText, { color: textColor }]}>
          {text}
        </Text>

        {/* Summary if available */}
        {summary && (
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryTitle, { color: textColor }]}>
              Summary
            </Text>
            <Text style={[styles.summaryText, { color: textColor + 'CC' }]}>
              {summary}
            </Text>
          </View>
        )}

        {/* Word confidence visualization */}
        {words && words.length > 0 && (
          <View style={styles.wordsContainer}>
            <Text style={[styles.wordsTitle, { color: textColor }]}>
              Word Confidence
            </Text>
            <View style={styles.wordsWrap}>
              {words.slice(0, 50).map((word, index) => {
                const opacity = Math.max(0.4, word.confidence);
                return (
                  <Text
                    key={index}
                    style={[
                      styles.word,
                      {
                        color: textColor,
                        opacity,
                        backgroundColor: `${textColor}10`,
                      },
                    ]}
                  >
                    {word.text}
                  </Text>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    maxHeight: 400,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sentimentEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  sentimentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptionText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  summaryContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  wordsContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  wordsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  word: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 14,
  },
});