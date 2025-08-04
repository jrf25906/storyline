/**
 * Configuration for narrative analysis settings
 */

import { StoryFramework, CulturalStoryType, AnalysisDepth } from '../types';

export interface AnalysisConfiguration {
  performance: PerformanceConfig;
  frameworks: FrameworkConfig;
  cultural: CulturalConfig;
  traumaInformed: TraumaConfig;
  ai: AIConfig;
  thresholds: ThresholdConfig;
}

export interface PerformanceConfig {
  realTimeLatency: number; // max ms for real-time analysis
  batchTimeout: number; // max ms for batch analysis
  maxContentLength: number; // max characters to analyze
  cacheExpiry: number; // cache expiry in seconds
  maxConcurrent: number; // max concurrent analyses
}

export interface FrameworkConfig {
  default: StoryFramework;
  supported: StoryFramework[];
  autoDetection: boolean;
  confidenceThreshold: number; // 0-100
}

export interface CulturalConfig {
  default: CulturalStoryType;
  supported: CulturalStoryType[];
  sensitivityChecking: boolean;
  expertValidation: boolean;
}

export interface TraumaConfig {
  enabled: boolean;
  crisisKeywords: string[];
  gentleResponseThreshold: number; // 0-100
  professionalResourceThreshold: number; // 0-100
  crisisResponseThreshold: number; // 0-100
}

export interface AIConfig {
  defaultProvider: string;
  providers: {
    [key: string]: {
      enabled: boolean;
      apiKey?: string;
      model: string;
      maxTokens: number;
      temperature: number;
    };
  };
  fallbackEnabled: boolean;
}

export interface ThresholdConfig {
  coherence: {
    excellent: number; // 90+
    good: number; // 75+
    needsWork: number; // 50+
    poor: number; // <50
  };
  characterDevelopment: {
    excellent: number; // 85+
    good: number; // 70+
    needsWork: number; // 50+
    poor: number; // <50
  };
  pacing: {
    tooSlow: number; // <30
    slow: number; // 30-50
    balanced: number; // 50-70
    fast: number; // 70-90
    tooFast: number; // >90
  };
  structure: {
    adherent: number; // 80+
    mostlyAdherent: number; // 60+
    someDeviations: number; // 40+
    significantDeviations: number; // <40
  };
}

// Default configuration
export const defaultAnalysisConfig: AnalysisConfiguration = {
  performance: {
    realTimeLatency: 2000, // 2 seconds
    batchTimeout: 30000, // 30 seconds
    maxContentLength: 500000, // 500k characters
    cacheExpiry: 3600, // 1 hour
    maxConcurrent: 10,
  },
  frameworks: {
    default: StoryFramework.THREE_ACT,
    supported: [
      StoryFramework.THREE_ACT,
      StoryFramework.HEROS_JOURNEY,
      StoryFramework.SAVE_THE_CAT,
      StoryFramework.KISHOTENKETSU,
      StoryFramework.FREYTAGS_PYRAMID,
      StoryFramework.SEVEN_POINT,
      StoryFramework.FICHTEAN_CURVE,
    ],
    autoDetection: true,
    confidenceThreshold: 70,
  },
  cultural: {
    default: CulturalStoryType.WESTERN_LINEAR,
    supported: [
      CulturalStoryType.WESTERN_LINEAR,
      CulturalStoryType.KISHOTEN_KETSU,
      CulturalStoryType.CIRCULAR_NARRATIVE,
      CulturalStoryType.EPISODIC,
      CulturalStoryType.ORAL_TRADITION,
      CulturalStoryType.MYTHOLOGICAL,
      CulturalStoryType.INDIGENOUS,
      CulturalStoryType.EASTERN_PHILOSOPHICAL,
    ],
    sensitivityChecking: true,
    expertValidation: true,
  },
  traumaInformed: {
    enabled: true,
    crisisKeywords: [
      'suicide', 'self-harm', 'want to die', 'end it all',
      'hopeless', 'worthless', 'better off dead',
      'hurt myself', 'kill myself', 'no point',
    ],
    gentleResponseThreshold: 30,
    professionalResourceThreshold: 60,
    crisisResponseThreshold: 80,
  },
  ai: {
    defaultProvider: 'openai',
    providers: {
      openai: {
        enabled: true,
        model: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.1,
      },
      anthropic: {
        enabled: true,
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4000,
        temperature: 0.1,
      },
    },
    fallbackEnabled: true,
  },
  thresholds: {
    coherence: {
      excellent: 90,
      good: 75,
      needsWork: 50,
      poor: 0,
    },
    characterDevelopment: {
      excellent: 85,
      good: 70,
      needsWork: 50,
      poor: 0,
    },
    pacing: {
      tooSlow: 30,
      slow: 50,
      balanced: 70,
      fast: 90,
      tooFast: 100,
    },
    structure: {
      adherent: 80,
      mostlyAdherent: 60,
      someDeviations: 40,
      significantDeviations: 0,
    },
  },
};

// Environment-based configuration overrides
export const getAnalysisConfig = (): AnalysisConfiguration => {
  const config = { ...defaultAnalysisConfig };
  
  // Override with environment variables if present
  if (process.env.ANALYSIS_REALTIME_LATENCY) {
    config.performance.realTimeLatency = parseInt(process.env.ANALYSIS_REALTIME_LATENCY);
  }
  
  if (process.env.ANALYSIS_BATCH_TIMEOUT) {
    config.performance.batchTimeout = parseInt(process.env.ANALYSIS_BATCH_TIMEOUT);
  }
  
  if (process.env.ANALYSIS_MAX_CONTENT_LENGTH) {
    config.performance.maxContentLength = parseInt(process.env.ANALYSIS_MAX_CONTENT_LENGTH);
  }
  
  if (process.env.ANALYSIS_DEFAULT_FRAMEWORK) {
    config.frameworks.default = process.env.ANALYSIS_DEFAULT_FRAMEWORK as StoryFramework;
  }
  
  if (process.env.TRAUMA_INFORMED_ENABLED) {
    config.traumaInformed.enabled = process.env.TRAUMA_INFORMED_ENABLED === 'true';
  }
  
  if (process.env.CULTURAL_SENSITIVITY_ENABLED) {
    config.cultural.sensitivityChecking = process.env.CULTURAL_SENSITIVITY_ENABLED === 'true';
  }
  
  // AI provider configuration
  if (process.env.OPENAI_API_KEY) {
    config.ai.providers.openai.apiKey = process.env.OPENAI_API_KEY;
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    config.ai.providers.anthropic.apiKey = process.env.ANTHROPIC_API_KEY;
  }
  
  return config;
};

// Framework-specific configurations
export const frameworkConfigs = {
  [StoryFramework.THREE_ACT]: {
    acts: [
      { name: 'Setup', percentage: 25, keyBeats: ['Hook', 'Inciting Incident', 'Plot Point 1'] },
      { name: 'Confrontation', percentage: 50, keyBeats: ['Midpoint', 'Plot Point 2'] },
      { name: 'Resolution', percentage: 25, keyBeats: ['Climax', 'Resolution'] },
    ],
    requiredBeats: ['Inciting Incident', 'Plot Point 1', 'Midpoint', 'Plot Point 2', 'Climax'],
  },
  [StoryFramework.HEROS_JOURNEY]: {
    stages: [
      'Ordinary World', 'Call to Adventure', 'Refusal of Call', 'Meeting Mentor',
      'Crossing Threshold', 'Tests and Allies', 'Approach to Inmost Cave',
      'Ordeal', 'Reward', 'Road Back', 'Resurrection', 'Return with Elixir',
    ],
    requiredStages: ['Call to Adventure', 'Crossing Threshold', 'Ordeal', 'Return with Elixir'],
  },
  [StoryFramework.KISHOTENKETSU]: {
    parts: [
      { name: 'Ki (Introduction)', percentage: 25 },
      { name: 'Sho (Development)', percentage: 25 },
      { name: 'Ten (Twist)', percentage: 25 },
      { name: 'Ketsu (Conclusion)', percentage: 25 },
    ],
    noConflictRequired: true,
    focusOnHarmony: true,
  },
  [StoryFramework.SAVE_THE_CAT]: {
    beats: [
      'Opening Image', 'Theme Stated', 'Set-Up', 'Catalyst', 'Debate',
      'Break into Two', 'B Story', 'Fun and Games', 'Midpoint',
      'Bad Guys Close In', 'All Is Lost', 'Dark Night of the Soul',
      'Break into Three', 'Finale', 'Final Image',
    ],
    pageTargets: true, // includes specific page targets for screenplay
  },
};

// Cultural sensitivity guidelines
export const culturalGuidelines = {
  [CulturalStoryType.INDIGENOUS]: {
    considerations: [
      'Respect for oral tradition',
      'Community-centered narratives',
      'Spiritual elements',
      'Connection to land and nature',
      'Intergenerational wisdom',
    ],
    sensitivityChecks: [
      'Avoid appropriation',
      'Respect sacred elements',
      'Consider community impact',
      'Honor authentic voices',
    ],
  },
  [CulturalStoryType.EASTERN_PHILOSOPHICAL]: {
    considerations: [
      'Cyclical rather than linear progression',
      'Balance and harmony themes',
      'Collective vs individual focus',
      'Philosophical depth',
      'Metaphorical storytelling',
    ],
    sensitivityChecks: [
      'Avoid oversimplification',
      'Respect philosophical traditions',
      'Consider cultural context',
      'Honor complexity',
    ],
  },
  [CulturalStoryType.ORAL_TRADITION]: {
    considerations: [
      'Repetition for memory',
      'Rhythmic language patterns',
      'Community teaching function',
      'Moral or practical lessons',
      'Audience participation',
    ],
    sensitivityChecks: [
      'Preserve teaching function',
      'Respect cultural origins',
      'Consider community ownership',
      'Honor tradition holders',
    ],
  },
};

// Trauma-informed response templates
export const traumaInformedResponses = {
  gentle: {
    acknowledgment: "I notice you're exploring some challenging emotional territory in your writing.",
    support: "This is a safe space to process these experiences through your story.",
    guidance: "Would you like some gentle guidance on how to approach this sensitively?",
  },
  moderate: {
    acknowledgment: "I can see this content might be bringing up some difficult feelings.",
    support: "Writing can be a powerful way to process experiences, and I'm here to help you do that safely.",
    guidance: "Consider taking breaks if you need them, and remember that professional support is available.",
  },
  professional: {
    acknowledgment: "I notice themes in your writing that suggest you might be processing some significant experiences.",
    support: "While writing can be therapeutic, professional support can provide additional guidance.",
    resources: "Here are some resources that might be helpful: [Crisis Text Line: Text HOME to 741741]",
  },
  crisis: {
    acknowledgment: "I'm concerned about some of the content you're sharing.",
    immediate: "Your safety is the most important thing right now.",
    resources: "Please reach out for immediate support: National Suicide Prevention Lifeline: 988",
    professional: "A mental health professional can provide the support you need.",
  },
};