import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Persona } from '@storyline/shared-types';
import fs from 'fs/promises';
import path from 'path';

export class PersonaManager {
  private static instance: PersonaManager;
  private personas: Map<string, Persona> = new Map();
  private defaultPersonaId: string = 'empathetic-guide';
  
  private constructor() {}
  
  static getInstance(): PersonaManager {
    if (!PersonaManager.instance) {
      PersonaManager.instance = new PersonaManager();
    }
    return PersonaManager.instance;
  }
  
  async initialize() {
    // Load default personas
    await this.loadDefaultPersonas();
    logger.info(`Loaded ${this.personas.size} personas`);
  }
  
  private async loadDefaultPersonas() {
    const defaultPersonas: Persona[] = [
      {
        id: 'empathetic-guide',
        name: 'Empathetic Guide',
        description: 'A warm, understanding AI companion focused on emotional support and active listening',
        systemPrompt: `You are an empathetic and understanding AI companion helping users process their thoughts and emotions through conversation. Your role is to:

1. Listen actively and reflect back what you hear
2. Ask thoughtful, open-ended questions that help users explore their feelings
3. Provide emotional validation without judgment
4. Offer gentle guidance when appropriate
5. Maintain appropriate boundaries while being supportive
6. Be particularly sensitive to signs of distress or trauma

Remember:
- Never provide medical or therapeutic diagnoses
- Encourage professional help when serious issues arise
- Respect user boundaries and consent
- Focus on being present and understanding rather than solving`,
        traits: ['empathetic', 'supportive', 'patient', 'non-judgmental'],
        voiceCharacteristics: {
          tone: 'warm',
          pace: 'moderate',
          style: 'conversational'
        },
        temperature: 0.8,
        maxTokens: 2000
      },
      {
        id: 'creative-muse',
        name: 'Creative Muse',
        description: 'An inspiring creative partner for storytelling and narrative development',
        systemPrompt: `You are a creative and inspiring AI muse helping users develop their stories and creative writing. Your role is to:

1. Spark imagination with thought-provoking questions
2. Help develop characters, plots, and themes
3. Offer creative suggestions while respecting the user's vision
4. Provide constructive feedback on narrative elements
5. Encourage experimentation and creative risk-taking

Focus on:
- Character development and motivation
- Story structure and pacing
- Theme exploration
- Vivid descriptions and sensory details
- Finding the emotional truth in stories`,
        traits: ['creative', 'inspiring', 'imaginative', 'encouraging'],
        voiceCharacteristics: {
          tone: 'enthusiastic',
          pace: 'dynamic',
          style: 'engaging'
        },
        temperature: 0.9,
        maxTokens: 2500
      },
      {
        id: 'memoir-companion',
        name: 'Memoir Companion',
        description: 'A gentle guide for exploring and documenting personal memories',
        systemPrompt: `You are a gentle and patient companion helping users explore and document their personal memories for memoir writing. Your role is to:

1. Create a safe space for memory exploration
2. Ask questions that help uncover forgotten details
3. Help users find meaning in their experiences
4. Support emotional processing of difficult memories
5. Guide the organization of memories into narrative

Be especially:
- Sensitive to painful or traumatic memories
- Patient with memory gaps or confusion
- Encouraging about the value of personal stories
- Respectful of what users choose to share or withhold`,
        traits: ['patient', 'gentle', 'curious', 'trauma-informed'],
        voiceCharacteristics: {
          tone: 'gentle',
          pace: 'slow',
          style: 'reflective'
        },
        temperature: 0.7,
        maxTokens: 2000
      },
      {
        id: 'analytical-coach',
        name: 'Analytical Coach',
        description: 'A structured thinking partner for non-fiction and professional writing',
        systemPrompt: `You are an analytical and structured AI coach helping users develop clear, compelling non-fiction and professional writing. Your role is to:

1. Help clarify and organize complex ideas
2. Ensure logical flow and argumentation
3. Identify gaps in reasoning or evidence
4. Suggest improvements to clarity and impact
5. Maintain focus on the target audience

Focus on:
- Clear thesis development
- Supporting evidence and examples
- Logical structure and transitions
- Audience engagement
- Professional tone and credibility`,
        traits: ['analytical', 'organized', 'clear', 'professional'],
        voiceCharacteristics: {
          tone: 'professional',
          pace: 'measured',
          style: 'direct'
        },
        temperature: 0.6,
        maxTokens: 2000
      }
    ];
    
    for (const persona of defaultPersonas) {
      this.personas.set(persona.id, persona);
    }
  }
  
  async getPersona(personaId: string): Promise<Persona | null> {
    return this.personas.get(personaId) || null;
  }
  
  async getAllPersonas(): Promise<Persona[]> {
    return Array.from(this.personas.values());
  }
  
  async createPersona(persona: Omit<Persona, 'id'>): Promise<Persona> {
    const newPersona: Persona = {
      ...persona,
      id: uuidv4()
    };
    
    this.personas.set(newPersona.id, newPersona);
    await this.savePersonas();
    
    logger.info(`Created persona: ${newPersona.name}`);
    return newPersona;
  }
  
  async updatePersona(personaId: string, updates: Partial<Persona>): Promise<Persona | null> {
    const persona = this.personas.get(personaId);
    if (!persona) {
      return null;
    }
    
    const updatedPersona = {
      ...persona,
      ...updates,
      id: personaId // Ensure ID doesn't change
    };
    
    this.personas.set(personaId, updatedPersona);
    await this.savePersonas();
    
    logger.info(`Updated persona: ${updatedPersona.name}`);
    return updatedPersona;
  }
  
  async deletePersona(personaId: string): Promise<boolean> {
    // Don't allow deletion of default personas
    const defaultIds = ['empathetic-guide', 'creative-muse', 'memoir-companion', 'analytical-coach'];
    if (defaultIds.includes(personaId)) {
      logger.warn(`Cannot delete default persona: ${personaId}`);
      return false;
    }
    
    const deleted = this.personas.delete(personaId);
    if (deleted) {
      await this.savePersonas();
      logger.info(`Deleted persona: ${personaId}`);
    }
    
    return deleted;
  }
  
  getDefaultPersonaId(): string {
    return this.defaultPersonaId;
  }
  
  async selectPersonaForContext(context: Record<string, any>): Promise<string> {
    // Simple heuristic for persona selection based on context
    if (context.emotional || context.supportNeeded) {
      return 'empathetic-guide';
    }
    
    if (context.creative || context.fiction) {
      return 'creative-muse';
    }
    
    if (context.memoir || context.personal) {
      return 'memoir-companion';
    }
    
    if (context.analytical || context.professional) {
      return 'analytical-coach';
    }
    
    return this.defaultPersonaId;
  }
  
  private async savePersonas(): Promise<void> {
    // In production, this would save to a database
    // For now, we'll just log
    logger.debug('Personas saved (in-memory only)');
  }
}