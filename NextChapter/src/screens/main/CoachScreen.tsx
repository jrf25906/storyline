import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { useCoachStore } from '@stores/coachStore';
import { useAuthStore } from '@stores/authStore';
import { openAIService } from '@services/api/openai';
import { CoachMessage } from '@types/coach';
import { MessageBubble } from '@components/coach/MessageBubble';
import { MessageInput } from '@components/coach/MessageInput';
import { CoachHeader } from '@components/coach/CoachHeader';
import { CoachSettings } from '@components/coach/CoachSettings';
import { APP_CONFIG } from '@utils/constants';
import { withErrorBoundary } from '@components/common';
import { 
  H2,
  Body,
  BodySM,
  Caption
} from '@components/common/Typography';
import { Colors, Spacing } from '@theme';
import uuid from 'react-native-uuid';

function CoachScreen() {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [currentTone, setCurrentTone] = useState<'hype' | 'pragmatist' | 'tough-love'>('pragmatist');
  
  const {
    getAllMessages,
    loadConversations,
    sendMessage,
    canSendMessage,
    getMessageCountToday,
  } = useCoachStore();

  const { user } = useAuthStore();
  const [messages, setMessages] = useState<CoachMessage[]>([]);

  useEffect(() => {
    // Only load conversations if we have a user
    if (user?.id) {
      loadConversations(user.id);
      
      // Get current messages and transform them to match CoachMessage interface
      const currentMessages = getAllMessages();
      const transformedMessages: CoachMessage[] = currentMessages.map(msg => ({
        id: msg.id,
        content: msg.message, // Transform 'message' to 'content'
        role: msg.role,
        tone: msg.tone,
        timestamp: msg.timestamp,
      }));
      setMessages(transformedMessages);
    }
  }, [user?.id]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = async (content: string) => {
    if (!canSendMessage()) {
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY} messages for today. Upgrade to Pro for unlimited messages.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user?.id) {
      Alert.alert(
        'Authentication Error',
        'Please log in to use the coach feature.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // Send user message to store
      await sendMessage(user.id, content);
      
      // Prepare messages for AI API
      const currentMessages = getAllMessages();
      const apiMessages = currentMessages.map(msg => ({
        role: msg.role,
        content: msg.message,
      }));
      
      // Add the new user message for API context
      apiMessages.push({
        role: 'user',
        content,
      });

      // Get AI response
      const response = await openAIService.sendMessage(apiMessages, content);
      
      // Save AI response to store
      await sendMessage(user.id, response.message);
      
      // Update local messages state
      const updatedMessages = getAllMessages();
      const transformedMessages: CoachMessage[] = updatedMessages.map(msg => ({
        id: msg.id,
        content: msg.message,
        role: msg.role,
        tone: msg.tone,
        timestamp: msg.timestamp,
      }));
      setMessages(transformedMessages);
      
      // Show crisis resources if needed
      if (response.isCrisis) {
        setTimeout(() => {
          Alert.alert(
            'Crisis Resources',
            'Help is available 24/7:\n\n• Call or text 988\n• Text HOME to 741741\n• Visit 988lifeline.org',
            [{ text: 'OK' }]
          );
        }, 500);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to the coach. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: CoachMessage }) => (
    <MessageBubble message={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <H2 style={[styles.emptyStateTitle, { color: '#4A6FA5', textAlign: 'center' }]}>
        Hi! I'm your AI Career Coach
      </H2>
      <Body style={[styles.emptyStateText, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
        I'm here to help you navigate your job search journey. Whether you need motivation,
        practical advice, or someone to keep you accountable, I'm here for you.
      </Body>
      <Body style={[styles.emptyStateText, { color: '#4A6FA5', marginTop: 16, textAlign: 'center' }]}>
        How are you feeling about your job search today?
      </Body>
    </View>
  );

  const messagesRemaining = APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY - getMessageCountToday();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <CoachHeader 
        currentTone={currentTone}
        onToneChange={setCurrentTone}
        messagesRemaining={messagesRemaining}
        onSettingsPress={() => setSettingsVisible(true)} 
      />
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4A6FA5" />
          <Caption style={[styles.loadingText, { color: '#4A6FA5' }]}>
            Coach is thinking...
          </Caption>
        </View>
      )}
      
      <MessageInput
        onSend={handleSendMessage}
        disabled={!canSendMessage()}
        isLoading={isLoading}
        messagesRemaining={messagesRemaining}
      />
      
      <CoachSettings
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default withErrorBoundary(CoachScreen, {
  errorMessage: {
    title: 'Coach feature unavailable',
    message: 'Your AI coach is temporarily offline. Please try again soon.'
  }
});