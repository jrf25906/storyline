import { StateCreator } from 'zustand';
import { 
  CoachStore, 
  CoachStoreState,
  CoachMessage,
  CoachSession,
  CoachTone 
} from '@stores/interfaces/coachStore';
import { createStore, createInitialState, handleAsyncOperation } from '@stores/factory/createStore';
import { CoachConversation } from '@types';
import { supabase } from '@services/api/supabase';

/**
 * Emotional triggers for tone detection
 * Following Single Responsibility - just data constants
 */
const TONE_TRIGGERS = {
  hype: ['hopeless', 'lost', 'worthless', 'failure', 'burnt out', 'give up', 'defeated', 'exhausted'],
  toughLove: ['lazy', 'they screwed me', 'no one will hire me', 'this is rigged', "it's not fair", 'excuses'],
};

/**
 * Tone prompts for different emotional states
 */
const TONE_PROMPTS = {
  hype: "You've got this. Let's turn the corner—today's win:...",
  pragmatist: "Here's a step-by-step plan to get clarity. Start with...",
  'tough-love': "Let's be real: what you've tried isn't working. Try this next.",
};

/**
 * Initial state for coach store
 */
const initialState = createInitialState<Omit<CoachStoreState, 'isLoading' | 'error'>>({
  messages: [],
  currentTone: 'pragmatist',
  currentSession: null,
  sessions: [],
  isTyping: false,
  isSending: false,
  messageCount: 0,
  lastMessageTime: null,
  isRateLimited: false,
});

/**
 * Helper function to convert database conversations to messages
 */
const convertConversationsToMessages = (conversations: CoachConversation[]): CoachMessage[] => {
  return conversations.map(conv => ({
    id: conv.id,
    role: conv.role,
    content: conv.message,
    tone: conv.tone,
    timestamp: new Date(conv.created_at),
  }));
};

/**
 * Coach messaging operations implementation
 */
const createCoachMessagingOperations: StateCreator<CoachStore, [], [], Pick<CoachStore,
  'sendMessage' | 'loadConversationHistory' | 'clearConversation' | 'deleteMessage'
>> = (set, get) => ({
  sendMessage: async (content) => {
    // Check rate limiting
    if (get().isRateLimited) {
      set({ error: 'Daily message limit reached' });
      return;
    }

    set({ isSending: true, error: null });
    
    const detectedTone = get().detectTone(content);
    const timestamp = new Date();
    
    // Create user message
    const userMessage: CoachMessage = {
      id: `local_${Date.now()}`,
      role: 'user',
      content,
      tone: detectedTone,
      timestamp,
    };

    try {
      // Add message to state immediately
      set((state) => ({
        messages: [...state.messages, userMessage],
        messageCount: state.messageCount + 1,
        lastMessageTime: timestamp,
      }));

      // TODO: Call AI service to get response
      // const response = await aiService.sendMessage(content, detectedTone);
      
      // For now, mock the AI response
      const aiMessage: CoachMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `I understand you're feeling ${detectedTone}. ${TONE_PROMPTS[detectedTone]}`,
        tone: detectedTone,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, aiMessage],
        isSending: false,
        currentTone: detectedTone,
      }));

      // Check for rate limiting
      const count = get().messageCount;
      if (count >= 10) { // Free tier limit
        set({ isRateLimited: true });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send message',
        isSending: false 
      });
    }
  },

  loadConversationHistory: async () => {
    await handleAsyncOperation(
      set,
      async () => {
        // TODO: Load from actual database
        // For now, return empty array
        return [];
      },
      {
        onSuccess: (conversations) => {
          const messages = convertConversationsToMessages(conversations);
          set({ messages });
        },
        onError: (error) => {
          console.error('Error loading conversations:', error);
        }
      }
    );
  },

  clearConversation: () => {
    set({ 
      messages: [],
      messageCount: 0,
      currentSession: null,
    });
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter(msg => msg.id !== messageId),
      messageCount: Math.max(0, state.messageCount - 1),
    }));
  },
});

/**
 * Coach tone operations implementation
 */
const createCoachToneOperations: StateCreator<CoachStore, [], [], Pick<CoachStore,
  'detectTone' | 'setTone' | 'getTonePrompt'
>> = (set, get) => ({
  detectTone: (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Check for hype triggers
    const needsHype = TONE_TRIGGERS.hype.some(trigger => lowerMessage.includes(trigger));
    if (needsHype) return 'hype';
    
    // Check for tough love triggers
    const needsToughLove = TONE_TRIGGERS.toughLove.some(trigger => lowerMessage.includes(trigger));
    if (needsToughLove) return 'tough-love';
    
    // Default to pragmatist
    return 'pragmatist';
  },

  setTone: (tone) => {
    set({ currentTone: tone });
  },

  getTonePrompt: (tone) => {
    return TONE_PROMPTS[tone];
  },
});

/**
 * Coach session operations implementation
 */
const createCoachSessionOperations: StateCreator<CoachStore, [], [], Pick<CoachStore,
  'startNewSession' | 'endSession' | 'loadSession' | 'getSessions'
>> = (set, get) => ({
  startNewSession: () => {
    const session: CoachSession = {
      id: `session_${Date.now()}`,
      messages: [],
      startedAt: new Date(),
      lastMessageAt: new Date(),
      tone: 'pragmatist',
    };
    
    set({ 
      currentSession: session,
      messages: [],
      messageCount: 0,
    });
  },

  endSession: () => {
    const currentSession = get().currentSession;
    if (currentSession) {
      // Save session to sessions array
      set((state) => ({
        sessions: [...state.sessions, {
          ...currentSession,
          messages: state.messages,
        }],
        currentSession: null,
      }));
    }
  },

  loadSession: async (sessionId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (session) {
      set({ 
        currentSession: session,
        messages: session.messages,
        currentTone: session.tone,
      });
    }
  },

  getSessions: async () => {
    return get().sessions;
  },
});

/**
 * Coach analytics operations implementation
 */
const createCoachAnalyticsOperations: StateCreator<CoachStore, [], [], Pick<CoachStore,
  'trackMessageSent' | 'trackToneSwitch' | 'getUsageStats'
>> = (set, get) => ({
  trackMessageSent: (tone) => {
    // TODO: Send analytics event
    console.log('Message sent with tone:', tone);
  },

  trackToneSwitch: (fromTone, toTone) => {
    // TODO: Send analytics event
    console.log('Tone switched from', fromTone, 'to', toTone);
  },

  getUsageStats: async () => {
    const messages = get().messages;
    const toneDistribution = messages.reduce((acc, msg) => {
      if (msg.tone) {
        acc[msg.tone] = (acc[msg.tone] || 0) + 1;
      }
      return acc;
    }, {} as Record<CoachTone, number>);

    return {
      totalMessages: messages.length,
      toneDistribution,
      averageSessionLength: 0, // TODO: Calculate from sessions
    };
  },
});

/**
 * Complete coach store creator
 * Combines all functionality using composition
 */
const coachStoreCreator: StateCreator<CoachStore, [], [], CoachStore> = (set, get) => ({
  ...initialState,
  ...createCoachMessagingOperations(set, get, {} as any),
  ...createCoachToneOperations(set, get, {} as any),
  ...createCoachSessionOperations(set, get, {} as any),
  ...createCoachAnalyticsOperations(set, get, {} as any),
  
  // Reset function
  reset: () => {
    set(initialState);
  },
});

/**
 * Create and export the coach store
 * Using factory pattern for consistent configuration
 */
export const useCoachStore = createStore<CoachStore>(
  coachStoreCreator,
  {
    name: 'coach-store',
    persist: true,
    partialize: (state) => ({
      messages: state.messages.slice(-25), // Keep last 25 messages
      currentTone: state.currentTone,
      messageCount: state.messageCount,
      lastMessageTime: state.lastMessageTime,
    }),
  }
);