export type CoachTone = 'hype' | 'pragmatist' | 'tough-love';

export interface CoachMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  tone?: CoachTone;
  timestamp: Date;
  tokenCount?: number;
}

export interface CoachConversation {
  messages: CoachMessage[];
  lastMessageDate: Date;
  messagesUsedToday: number;
}

export interface EmotionalTriggers {
  hype: string[];
  'tough-love': string[];
  crisis: string[];
}

export const EMOTIONAL_TRIGGERS: EmotionalTriggers = {
  hype: ['hopeless', 'lost', 'worthless', 'failure', 'burnt out', 'depressed', 'giving up', 'can\'t do this'],
  'tough-love': ['lazy', 'they screwed me', 'no one will hire me', 'this is rigged', 'it\'s not fair', 'blame', 'everyone else'],
  crisis: ['suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead', 'harm myself', 'self harm']
};

export const TONE_PROMPTS = {
  hype: "You are an encouraging career coach who was recently laid off. Be energetic and optimistic. Use phrases like 'You've got this!' and 'Let's turn the corner—today's win:...'. Focus on opportunities and potential. Keep responses concise (2-3 paragraphs max).",
  pragmatist: "You are a practical career coach helping someone who was recently laid off. Be straightforward and actionable. Provide step-by-step guidance and realistic timelines. Focus on concrete next steps. Keep responses concise (2-3 paragraphs max).",
  'tough-love': "You are a direct career coach helping someone who was recently laid off. Be honest and challenging. Use phrases like 'Let's be real: what you've tried isn't working. Try this next.' Push for action and accountability. Keep responses concise (2-3 paragraphs max)."
};

export const CRISIS_RESOURCES = {
  hotline: '988',
  text: 'Text HOME to 741741',
  url: 'https://988lifeline.org',
  message: 'I\'m concerned about what you\'re sharing. Please reach out to a mental health professional who can provide the support you need.'
};