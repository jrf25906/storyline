import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'http';
import { getProvider, getDefaultProvider } from '../providers';
import { PersonaManager } from './PersonaManager';
import { ConversationManager } from './ConversationManager';
import { AIMessage } from '../providers/types';
import { logger } from '../utils/logger';

interface StreamingSession {
  sessionId: string;
  userId: string;
  conversationId?: string;
  personaId: string;
  provider: string;
  startTime: Date;
  messageBuffer: string[];
}

class StreamingService {
  private sessions: Map<string, StreamingSession> = new Map();
  
  async handleConnection(ws: WebSocket, req: IncomingMessage) {
    const sessionId = uuidv4();
    let session: StreamingSession | null = null;
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'start':
            session = await this.startSession(sessionId, message);
            ws.send(JSON.stringify({
              type: 'session_started',
              sessionId,
              conversationId: session.conversationId,
              personaId: session.personaId,
              timestamp: new Date().toISOString()
            }));
            break;
            
          case 'message':
            if (session) {
              await this.streamResponse(session, message.content, ws);
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'No active session'
              }));
            }
            break;
            
          case 'stop':
            if (session) {
              await this.stopSession(sessionId);
              ws.send(JSON.stringify({
                type: 'session_ended',
                sessionId,
                duration: Date.now() - session.startTime.getTime()
              }));
            }
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Unknown message type'
            }));
        }
      } catch (error) {
        logger.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Failed to process message'
        }));
      }
    });
    
    ws.on('close', () => {
      if (session) {
        this.stopSession(sessionId);
      }
      logger.info(`WebSocket closed for session: ${sessionId}`);
    });
    
    ws.on('error', (error) => {
      logger.error(`WebSocket error for session ${sessionId}:`, error);
    });
  }
  
  private async startSession(sessionId: string, config: any): Promise<StreamingSession> {
    const { userId, conversationId, personaId, provider } = config;
    
    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const persona = personaId || 
        await PersonaManager.getInstance().selectPersonaForContext(config.context || {});
      
      const conversation = await ConversationManager.getInstance().createConversation(
        userId,
        persona,
        config.metadata
      );
      convId = conversation.id;
    }
    
    const session: StreamingSession = {
      sessionId,
      userId,
      conversationId: convId,
      personaId: personaId || PersonaManager.getInstance().getDefaultPersonaId(),
      provider: provider || 'default',
      startTime: new Date(),
      messageBuffer: []
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }
  
  private async streamResponse(
    session: StreamingSession,
    userMessage: string,
    ws: WebSocket
  ) {
    try {
      // Get conversation context
      const conversation = session.conversationId ? 
        await ConversationManager.getInstance().getConversation(session.conversationId) : 
        null;
      
      // Get persona
      const persona = await PersonaManager.getInstance().getPersona(session.personaId);
      if (!persona) {
        throw new Error('Persona not found');
      }
      
      // Build messages
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: persona.systemPrompt
        }
      ];
      
      // Add conversation history if available
      if (conversation) {
        for (const turn of conversation.turns) {
          messages.push({
            role: 'user',
            content: turn.userMessage
          });
          messages.push({
            role: 'assistant',
            content: turn.assistantMessage
          });
        }
      }
      
      // Add current message
      messages.push({
        role: 'user',
        content: userMessage
      });
      
      // Get AI provider
      const provider = session.provider === 'default' ? 
        getDefaultProvider() : 
        getProvider(session.provider);
      
      if (!provider) {
        throw new Error('AI provider not available');
      }
      
      // Stream response
      const responseBuffer: string[] = [];
      
      for await (const chunk of provider.stream({
        messages,
        temperature: persona.temperature,
        maxTokens: persona.maxTokens,
        userId: session.userId,
        metadata: {
          sessionId: session.sessionId,
          personaId: persona.id,
          emotional: persona.traits.includes('empathetic'),
          creative: persona.traits.includes('creative')
        }
      })) {
        responseBuffer.push(chunk.content);
        
        ws.send(JSON.stringify({
          type: 'chunk',
          content: chunk.content,
          isComplete: chunk.isComplete,
          model: chunk.model,
          provider: chunk.provider
        }));
        
        if (chunk.isComplete) {
          // Save to conversation if applicable
          if (session.conversationId) {
            const fullResponse = responseBuffer.join('');
            await ConversationManager.getInstance().addTurn(
              session.conversationId,
              userMessage,
              session.provider
            );
          }
        }
      }
    } catch (error) {
      logger.error('Streaming response error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to generate response'
      }));
    }
  }
  
  private async stopSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      logger.info(`Streaming session stopped: ${sessionId}`);
    }
  }
  
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }
  
  getSessionInfo(sessionId: string): StreamingSession | undefined {
    return this.sessions.get(sessionId);
  }
}

// Export singleton instance
const streamingService = new StreamingService();

export function handleStreamingConnection(ws: WebSocket, req: IncomingMessage) {
  streamingService.handleConnection(ws, req);
}

export { streamingService };