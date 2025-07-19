import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoachConversation, CoachTone } from '@types/database';
import { supabase } from '@services/api/supabase';

interface CoachMessage {
  id: string;
  message: string;
  role: 'user' | 'assistant';
  tone?: CoachTone;
  timestamp: Date;
  isOffline?: boolean;
}

interface CoachStore {
  // State
  conversations: CoachConversation[];
  localMessages: CoachMessage[];
  currentTone: CoachTone;
  preferredTone: CoachTone | null;
  isLoading: boolean;
  isSending: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  messageCount: number;
  dailyMessageCount: number;
  lastMessageDate: string | null;

  // Computed values
  getAllMessages: () => CoachMessage[];
  getConversationHistory: (limit?: number) => CoachMessage[];
  canSendMessage: () => boolean;
  getMessageCountToday: () => number;

  // Actions
  loadConversations: (userId: string) => Promise<void>;
  sendMessage: (userId: string, message: string) => Promise<CoachMessage | null>;
  detectTone: (message: string) => CoachTone;
  setPreferredTone: (tone: CoachTone | null) => void;
  setCurrentTone: (tone: CoachTone) => void;
  
  // Sync actions
  syncOfflineMessages: (userId: string) => Promise<void>;
  saveOfflineMessage: (message: CoachMessage) => void;
  
  // Utility actions
  clearConversations: () => void;
  clearConversation: () => void; // Alias for clearConversations
  cloudSyncEnabled?: boolean; // Optional cloud sync flag
  deleteConversation: (userId: string, messageId: string) => Promise<void>;
  reset: () => void;
}

// Emotional triggers for tone detection
const HYPE_TRIGGERS = ['hopeless', 'lost', 'worthless', 'failure', 'burnt out', 'give up', 'defeated', 'exhausted'];
const TOUGH_LOVE_TRIGGERS = ['lazy', 'they screwed me', 'no one will hire me', 'this is rigged', "it's not fair", 'excuses'];

const initialState = {
  conversations: [],
  localMessages: [],
  currentTone: 'pragmatist' as CoachTone,
  preferredTone: null,
  isLoading: false,
  isSending: false,
  isSyncing: false,
  error: null,
  lastSyncTime: null,
  messageCount: 0,
  dailyMessageCount: 0,
  lastMessageDate: null,
};

export const useCoachStore = create<CoachStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        getAllMessages: () => {
          const conversations = get().conversations;
          const localMessages = get().localMessages;
          
          // Convert conversations to messages
          const dbMessages: CoachMessage[] = conversations.map(conv => ({
            id: conv.id,
            message: conv.message,
            role: conv.role,
            tone: conv.tone,
            timestamp: new Date(conv.created_at),
            isOffline: false,
          }));
          
          // Combine and sort by timestamp
          const allMessages = [...dbMessages, ...localMessages];
          allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          return allMessages;
        },

        getConversationHistory: (limit = 25) => {
          const messages = get().getAllMessages();
          return messages.slice(-limit);
        },

        canSendMessage: () => {
          const dailyCount = get().getMessageCountToday();
          // Free tier: 10 messages/day
          return dailyCount < 10;
        },

        getMessageCountToday: () => {
          const today = new Date().toDateString();
          const lastMessageDate = get().lastMessageDate;
          
          if (lastMessageDate !== today) {
            // Reset daily count
            set({ dailyMessageCount: 0, lastMessageDate: today });
            return 0;
          }
          
          return get().dailyMessageCount;
        },

        loadConversations: async (userId) => {
          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase
              .from('coach_conversations')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: true });

            if (error) throw error;

            set({ 
              conversations: data || [],
              messageCount: data?.length || 0,
              isLoading: false 
            });
          } catch (error) {
            console.error('Error loading conversations:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load conversations',
              isLoading: false 
            });
          }
        },

        sendMessage: async (userId, message) => {
          if (!get().canSendMessage()) {
            set({ error: 'Daily message limit reached' });
            return null;
          }

          set({ isSending: true, error: null });
          
          const timestamp = new Date();
          const detectedTone = get().detectTone(message);
          const tone = get().preferredTone || detectedTone;
          
          // Create message object
          const newMessage: CoachMessage = {
            id: `local_${Date.now()}`,
            message,
            role: 'user',
            tone,
            timestamp,
            isOffline: true,
          };

          try {
            // Try to save to database
            const { data, error } = await supabase
              .from('coach_conversations')
              .insert({
                user_id: userId,
                message,
                role: 'user',
                tone,
              })
              .select()
              .single();

            if (error) throw error;

            // Update with real ID
            newMessage.id = data.id;
            newMessage.isOffline = false;

            set((state) => ({
              conversations: [...state.conversations, data],
              messageCount: state.messageCount + 1,
              dailyMessageCount: state.dailyMessageCount + 1,
              isSending: false,
            }));

            return newMessage;
          } catch (error) {
            console.error('Error sending message:', error);
            
            // Save offline
            get().saveOfflineMessage(newMessage);
            
            set({ 
              error: error instanceof Error ? error.message : 'Failed to send message',
              isSending: false 
            });
            
            return newMessage;
          }
        },

        detectTone: (message) => {
          const lowerMessage = message.toLowerCase();
          
          // Check for hype triggers
          const needsHype = HYPE_TRIGGERS.some(trigger => lowerMessage.includes(trigger));
          if (needsHype) return 'hype';
          
          // Check for tough love triggers
          const needsToughLove = TOUGH_LOVE_TRIGGERS.some(trigger => lowerMessage.includes(trigger));
          if (needsToughLove) return 'tough-love';
          
          // Default to pragmatist
          return 'pragmatist';
        },

        setPreferredTone: (tone) => {
          set({ preferredTone: tone });
        },

        setCurrentTone: (tone) => {
          set({ currentTone: tone });
        },

        syncOfflineMessages: async (userId) => {
          set({ isSyncing: true, error: null });
          try {
            const localMessages = get().localMessages.filter(msg => msg.isOffline);
            
            for (const message of localMessages) {
              try {
                const { data, error } = await supabase
                  .from('coach_conversations')
                  .insert({
                    user_id: userId,
                    message: message.message,
                    role: message.role,
                    tone: message.tone,
                  })
                  .select()
                  .single();

                if (error) throw error;

                // Remove from local messages and add to conversations
                set((state) => ({
                  localMessages: state.localMessages.filter(msg => msg.id !== message.id),
                  conversations: [...state.conversations, data],
                }));
              } catch (error) {
                console.error(`Error syncing message ${message.id}:`, error);
              }
            }
            
            set({ 
              lastSyncTime: new Date(),
              isSyncing: false 
            });
          } catch (error) {
            console.error('Error syncing offline messages:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to sync messages',
              isSyncing: false 
            });
          }
        },

        saveOfflineMessage: (message) => {
          set((state) => ({
            localMessages: [...state.localMessages, message],
            messageCount: state.messageCount + 1,
            dailyMessageCount: state.dailyMessageCount + 1,
          }));
        },

        clearConversations: () => {
          set({ 
            conversations: [],
            localMessages: [],
            messageCount: 0,
            dailyMessageCount: 0,
          });
        },

        clearConversation: () => {
          // Alias for clearConversations
          get().clearConversations();
        },

        cloudSyncEnabled: false,

        deleteConversation: async (userId, messageId) => {
          set({ isLoading: true, error: null });
          try {
            // Check if it's a local message
            if (messageId.startsWith('local_')) {
              set((state) => ({
                localMessages: state.localMessages.filter(msg => msg.id !== messageId),
                messageCount: state.messageCount - 1,
                isLoading: false,
              }));
              return;
            }

            // Delete from database
            const { error } = await supabase
              .from('coach_conversations')
              .delete()
              .eq('id', messageId)
              .eq('user_id', userId);

            if (error) throw error;

            set((state) => ({
              conversations: state.conversations.filter(conv => conv.id !== messageId),
              messageCount: state.messageCount - 1,
              isLoading: false,
            }));
          } catch (error) {
            console.error('Error deleting conversation:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete conversation',
              isLoading: false 
            });
            throw error;
          }
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'coach-store',
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          localMessages: state.localMessages,
          preferredTone: state.preferredTone,
          dailyMessageCount: state.dailyMessageCount,
          lastMessageDate: state.lastMessageDate,
          lastSyncTime: state.lastSyncTime,
        }),
      }
    ),
    {
      name: 'CoachStore',
    }
  )
);