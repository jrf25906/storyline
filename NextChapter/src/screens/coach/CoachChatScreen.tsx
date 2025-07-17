import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useCoachStore } from '../../stores/coachStore';
import { useAuthStore } from '../../stores/authStore';
import { CoachHeader } from '../../components/coach/CoachHeader';
import { MessageBubble } from '../../components/coach/MessageBubble';
import { MessageInput } from '../../components/coach/MessageInput';
import { TypingIndicator } from '../../components/coach/TypingIndicator';
import { Typography } from '../../components/common/Typography';
import { CoachTone } from '../../types/database';
import { CoachMessage } from '../../types/coach';
import { withErrorBoundary } from '../../components/common';

type CoachStackParamList = {
  CoachChat: undefined;
  CoachSettings: undefined;
};

type CoachChatScreenNavigationProp = StackNavigationProp<CoachStackParamList, 'CoachChat'>;
type CoachChatScreenRouteProp = RouteProp<CoachStackParamList, 'CoachChat'>;

interface CoachChatScreenProps {
  navigation: CoachChatScreenNavigationProp;
  route: CoachChatScreenRouteProp;
}


export const CoachChatScreen: React.FC<CoachChatScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const {
    getAllMessages,
    sendMessage,
    currentTone,
    setCurrentTone,
    getMessageCountToday,
    canSendMessage,
    isSending,
    isLoading,
  } = useCoachStore();
  
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const messageAnimations = useRef<Map<string, Animated.Value>>(new Map());
  
  const messages = getAllMessages();
  const messagesRemaining = 10 - getMessageCountToday();

  useEffect(() => {
    // Initialize with welcome message if no messages
    if (messages.length === 0) {
      const welcomeMessage: CoachMessage = {
        id: 'welcome',
        content: "Hi! I'm your AI career coach. How are you feeling about your job search today?",
        role: 'assistant',
        tone: 'pragmatist',
        timestamp: new Date(),
      };
      // Add initial message animation
      const anim = new Animated.Value(0);
      messageAnimations.current.set(welcomeMessage.id, anim);
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = async (text: string) => {
    if (!canSendMessage() || !user) return;
    
    setIsTyping(true);
    
    // Send message
    const userMessage = await sendMessage(user.id, text);
    if (userMessage) {
      // Animate new message
      const anim = new Animated.Value(0);
      messageAnimations.current.set(userMessage.id, anim);
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    // Simulate coach typing and response
    setTimeout(() => {
      setIsTyping(false);
      // In a real app, this would call the AI service
      const coachResponse: CoachMessage = {
        id: Date.now().toString(),
        content: "I hear you. Let's break this down into manageable steps. What's your biggest challenge right now?",
        role: 'assistant',
        tone: currentTone,
        timestamp: new Date(),
      };
      
      // Animate coach response
      const anim = new Animated.Value(0);
      messageAnimations.current.set(coachResponse.id, anim);
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 2000);
  };

  const getMessageAnimation = (messageId: string) => {
    if (!messageAnimations.current.has(messageId)) {
      const anim = new Animated.Value(1);
      messageAnimations.current.set(messageId, anim);
      return anim;
    }
    return messageAnimations.current.get(messageId)!;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Typography variant="body" color="secondary" style={styles.loadingText}>
            Loading your coach...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CoachHeader
        currentTone={currentTone}
        onToneChange={setCurrentTone}
        messagesRemaining={messagesRemaining}
        onSettingsPress={() => navigation.navigate('CoachSettings')}
      />

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Typography variant="body" color="secondary" align="center">
                Start a conversation with your AI coach
              </Typography>
            </View>
          )}
          
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              animatedValue={getMessageAnimation(message.id)}
            />
          ))}
          
          {isTyping && <TypingIndicator />}
        </ScrollView>

        <MessageInput
          onSend={handleSendMessage}
          disabled={!canSendMessage()}
          isLoading={isSending}
          messagesRemaining={messagesRemaining}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  emptyStateContainer: {
    paddingHorizontal: 32,
    paddingTop: 40,
  },
});

export default withErrorBoundary(CoachChatScreen, {
  errorMessage: {
    title: 'Coach connection issue',
    message: "Your coach is taking a quick break. Please try again in a moment."
  }
});