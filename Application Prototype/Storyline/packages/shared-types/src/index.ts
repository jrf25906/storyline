// Common types shared across all services

export * from './user';
export * from './document';
export * from './voice';
export * from './ai';
export * from './auth';
export * from './api';
export * from './export';
// Persona type for AI orchestrator
export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  voiceSettings?: {
    tone: string;
    speed: number;
    pitch: number;
  };
}
