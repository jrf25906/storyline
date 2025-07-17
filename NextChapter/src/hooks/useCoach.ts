import { useState, useCallback, useEffect } from 'react';
import { CoachService } from '@services/ai/coachService';
import { APIKeyManager } from '@services/ai/apiKeyManager';
import { useCoachStore } from '@stores/coachStore';
import { useAuthStore } from '@stores/authStore';
import { CoachMessage, CoachTone } from '@types/coach';

interface UseCoachReturn {
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  hasAPIKey: boolean;
  checkAPIKey: () => Promise<void>;
  conversation: CoachMessage[];
  clearConversation: () => void;
}

/**
 * Hook for interacting with the AI coach
 */
export function useCoach(): UseCoachReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAPIKey, setHasAPIKey] = useState(false);
  
  const { user } = useAuthStore();
  const { messages, addMessage, clearMessages, loadConversation } = useCoachStore();
  
  const coachService = CoachService.getInstance();

  // Check if API key exists on mount
  useEffect(() => {
    checkAPIKey();
    loadConversation();
  }, []);

  const checkAPIKey = useCallback(async () => {
    try {
      const hasKey = await APIKeyManager.hasAPIKey();
      setHasAPIKey(hasKey);
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasAPIKey(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    setError(null);
    setIsLoading(true);

    try {
      // Check API key first
      if (!hasAPIKey) {
        throw new Error('Please configure your OpenAI API key in settings');
      }

      // Add user message to store
      const userMessage: CoachMessage = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // Get coach response
      const response = await coachService.generateResponse(
        content,
        messages,
        user?.id || 'anonymous'
      );

      // Add coach response to store
      const coachMessage: CoachMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: 'coach',
        timestamp: new Date(),
        tone: response.tone,
        flags: response.flags,
      };
      addMessage(coachMessage);

      // Handle special flags
      if (response.flags?.includes('crisis_intervention')) {
        // Could trigger additional UI elements for crisis support
        console.log('Crisis intervention triggered');
      }

      if (response.flags?.includes('rate_limit')) {
        setError('You have reached your daily message limit. Upgrade to Pro for unlimited coaching!');
      }

    } catch (err: any) {
      console.error('Coach error:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Add offline fallback response if network error
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        const offlineResponses = coachService.getOfflineResponses();
        const fallbackMessage: CoachMessage = {
          id: (Date.now() + 1).toString(),
          content: offlineResponses.encouragement,
          sender: 'coach',
          timestamp: new Date(),
          tone: 'pragmatist',
          flags: ['offline'],
        };
        addMessage(fallbackMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasAPIKey, messages, user, addMessage]);

  const clearConversation = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  return {
    sendMessage,
    isLoading,
    error,
    hasAPIKey,
    checkAPIKey,
    conversation: messages,
    clearConversation,
  };
}