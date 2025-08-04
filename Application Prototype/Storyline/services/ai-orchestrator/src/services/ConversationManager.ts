import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { AIMessage, CompletionOptions } from '../providers/types';
import { getProvider, getDefaultProvider } from '../providers';
import { PersonaManager } from './PersonaManager';
import { logger } from '../utils/logger';
import { ConversationContext, ConversationTurn } from '@storyline/shared-types';
import { queryMemory } from '@storyline/memory-client';
import { analyzeTextCraft } from './narrativeAnalysisClient';

export class ConversationManager {
  private static instance: ConversationManager;
  private redis: Redis;
  private conversations: Map<string, ConversationContext> = new Map();
  
  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
  }
  
  static getInstance(): ConversationManager {
    if (!ConversationManager.instance) {
      ConversationManager.instance = new ConversationManager();
    }
    return ConversationManager.instance;
  }
  
  async initialize() {
    // Load active conversations from Redis
    const keys = await this.redis.keys('conversation:*');
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const conversation = JSON.parse(data);
        this.conversations.set(conversation.id, conversation);
      }
    }
    logger.info(`Loaded ${this.conversations.size} active conversations`);
  }
  
  async createConversation(
    userId: string,
    personaId: string,
    metadata?: Record<string, any>
  ): Promise<ConversationContext> {
    const conversation: ConversationContext = {
      id: uuidv4(),
      userId,
      personaId,
      turns: [],
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.conversations.set(conversation.id, conversation);
    await this.saveConversation(conversation);
    
    logger.info(`Created conversation ${conversation.id} for user ${userId}`);
    return conversation;
  }
  
  private sanitize(input: string): string {
    // A basic sanitization to remove common prompt injection keywords.
    // This should be expanded with a more robust library in a production environment.
    const injectionKeywords = ['ignore previous instructions', 'act as', 'roleplay as'];
    let sanitized = input;
    for (const keyword of injectionKeywords) {
      sanitized = sanitized.replace(new RegExp(keyword, 'gi'), '');
    }
    return sanitized;
  }

  async addTurn(
    conversationId: string,
    userMessage: string,
    provider?: string
  ): Promise<ConversationTurn> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    const persona = await PersonaManager.getInstance().getPersona(conversation.personaId);
    if (!persona) {
      throw new Error('Persona not found');
    }
    
    // Sanitize user input
    const sanitizedUserMessage = this.sanitize(userMessage);

    // Get context from memory service
    const context = await queryMemory(sanitizedUserMessage);

    // Analyze text craft
    const { readability, styleTone } = await analyzeTextCraft(sanitizedUserMessage);

    // Build message history
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `${persona.systemPrompt}\n\n${context}\n\nUser message readability: ${JSON.stringify(readability)}\nUser message style/tone: ${JSON.stringify(styleTone)}`
      }
    ];
    
    // Add conversation history
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
    
    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    // Get AI response
    const aiProvider = provider ? getProvider(provider) : getDefaultProvider();
    if (!aiProvider) {
      throw new Error('No AI provider available');
    }
    
    const options: CompletionOptions = {
      messages,
      temperature: persona.temperature,
      maxTokens: persona.maxTokens,
      userId: conversation.userId,
      metadata: {
        conversationId,
        personaId: persona.id,
        emotional: persona.traits.includes('empathetic'),
        creative: persona.traits.includes('creative')
      }
    };
    
    const response = await aiProvider.complete(options);
    
    // Create turn
    const turn: ConversationTurn = {
      id: uuidv4(),
      userMessage,
      assistantMessage: response.content,
      model: response.model,
      provider: response.provider,
      timestamp: new Date(),
      metadata: {
        usage: response.usage
      }
    };
    
    // Update conversation and save asynchronously
    conversation.turns.push(turn);
    conversation.updatedAt = new Date();
    this.saveConversation(conversation).catch(error => {
      logger.error(`Failed to save conversation ${conversation.id}:`, error);
    });
    
    return turn;
  }
  
  async getConversation(conversationId: string): Promise<ConversationContext | null> {
    // Check memory cache first
    if (this.conversations.has(conversationId)) {
      return this.conversations.get(conversationId)!;
    }
    
    // Load from Redis
    const data = await this.redis.get(`conversation:${conversationId}`);
    if (data) {
      const conversation = JSON.parse(data);
      this.conversations.set(conversationId, conversation);
      return conversation;
    }
    
    return null;
  }
  
  async getUserConversations(userId: string): Promise<ConversationContext[]> {
    const conversations: ConversationContext[] = [];
    
    // Search through all conversations
    for (const conversation of this.conversations.values()) {
      if (conversation.userId === userId) {
        conversations.push(conversation);
      }
    }
    
    // Sort by most recent
    conversations.sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    
    return conversations;
  }
  
  async deleteConversation(conversationId: string): Promise<void> {
    this.conversations.delete(conversationId);
    await this.redis.del(`conversation:${conversationId}`);
    logger.info(`Deleted conversation ${conversationId}`);
  }
  
  async summarizeConversation(conversationId: string): Promise<string> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation || conversation.turns.length === 0) {
      return 'No conversation to summarize';
    }
    
    const aiProvider = getDefaultProvider();
    if (!aiProvider) {
      throw new Error('No AI provider available');
    }
    
    const conversationText = conversation.turns
      .map(turn => `User: ${turn.userMessage}\nAssistant: ${turn.assistantMessage}`)
      .join('\n\n');
    
    const response = await aiProvider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise summaries of conversations. Focus on key topics discussed and any important outcomes or decisions.'
        },
        {
          role: 'user',
          content: `Please summarize this conversation:\n\n${conversationText}`
        }
      ],
      temperature: 0.5,
      maxTokens: 500
    });
    
    return response.content;
  }
  
  private async saveConversation(conversation: ConversationContext): Promise<void> {
    const key = `conversation:${conversation.id}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days
    
    await this.redis.setex(
      key,
      ttl,
      JSON.stringify(conversation)
    );
  }
}

