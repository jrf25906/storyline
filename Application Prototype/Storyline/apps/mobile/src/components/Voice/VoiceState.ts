// VoiceState.ts - Comprehensive Voice State Management for Storyline
// This file manages all voice recording states, configurations, and emotional safety modes

/**
 * Voice Status Enumeration
 * Represents all possible states of the voice recording system
 */
export type VoiceStatus = 
  | 'idle'          // Not recording, ready to start
  | 'listening'     // Actively listening for voice input
  | 'recording'     // Currently recording audio
  | 'processing'    // Processing/transcribing recorded audio
  | 'thinking'      // AI is processing and generating response
  | 'speaking'      // AI is speaking/playing back response
  | 'paused'        // Recording paused but session active
  | 'error'         // Error state requiring user attention
  | 'offline';      // No network connection available

/**
 * Core Voice State Interface
 * Contains all runtime state information for voice interactions
 */
export interface VoiceState {
  /** Current voice recording status */
  status: VoiceStatus;
  
  /** Current audio input level (0-100) */
  audioLevel: number;
  
  /** Voice recognition confidence score (0-1) */
  confidence: number;
  
  /** Time spent in current processing state (ms) */
  processingTime: number;
  
  /** Current or most recent transcript */
  transcript: string;
  
  /** Error message if status is 'error' */
  error?: string;
  
  /** Current recording duration in seconds */
  recordingDuration: number;
  
  /** Session identifier for context continuity */
  sessionId: string;
  
  /** Whether emotional safety mode is active */
  emotionalSafetyActive: boolean;
  
  /** Detected emotional indicators from voice analysis */
  emotionalIndicators?: EmotionalIndicators;
  
  /** Network connectivity status */
  isOnline: boolean;
  
  /** Available voice service providers */
  availableProviders: VoiceProvider[];
  
  /** Currently active voice service provider */
  activeProvider?: VoiceProvider;
}

/**
 * Recording Configuration Interface
 * Defines technical and safety parameters for voice recording
 */
export interface RecordingConfig {
  /** Audio sample rate in Hz */
  sampleRate: number;
  
  /** Number of audio channels (1 for mono, 2 for stereo) */
  channels: number;
  
  /** Audio encoding format */
  encoding: AudioEncoding;
  
  /** Maximum recording duration in seconds */
  maxDuration?: number;
  
  /** Enable emotional safety monitoring */
  emotionalSafetyMode?: boolean;
  
  /** Audio quality setting */
  quality: AudioQuality;
  
  /** Noise reduction enabled */
  noiseReduction: boolean;
  
  /** Auto-pause on silence detection */
  autoPauseOnSilence: boolean;
  
  /** Silence detection threshold (0-100) */
  silenceThreshold: number;
  
  /** Maximum silence duration before auto-pause (ms) */
  maxSilenceDuration: number;
  
  /** Enable real-time transcription */
  realTimeTranscription: boolean;
  
  /** Voice activity detection sensitivity */
  vadSensitivity: number;
  
  /** Audio buffer size for processing */
  bufferSize: number;
}

/**
 * Voice Configuration Interface
 * High-level configuration for voice interaction system
 */
export interface VoiceConfig {
  /** Recording configuration */
  recording: RecordingConfig;
  
  /** Emotional safety settings */
  emotionalSafety: EmotionalSafetyConfig;
  
  /** AI provider settings */
  aiProvider: AIProviderConfig;
  
  /** User preferences */
  userPreferences: VoiceUserPreferences;
  
  /** Accessibility settings */
  accessibility: AccessibilityConfig;
  
  /** Privacy and security settings */
  privacy: PrivacyConfig;
}

/**
 * Emotional Safety Configuration
 * Settings for trauma-informed voice interaction
 */
export interface EmotionalSafetyConfig {
  /** Enable emotional safety monitoring */
  enabled: boolean;
  
  /** Crisis detection sensitivity (0-1) */
  crisisDetectionSensitivity: number;
  
  /** Keywords that trigger safety checks */
  triggerKeywords: string[];
  
  /** Auto-pause on emotional distress detection */
  autoPauseOnDistress: boolean;
  
  /** Gentle intervention phrases */
  interventionPhrases: string[];
  
  /** Professional resource contacts */
  professionalResources: ProfessionalResource[];
  
  /** Maximum session duration for emotional content (minutes) */
  maxEmotionalSessionDuration: number;
  
  /** Breathing exercise prompts */
  breathingExercises: BreathingExercise[];
  
  /** Grounding technique suggestions */
  groundingTechniques: string[];
}

/**
 * Emotional Indicators from Voice Analysis
 */
export interface EmotionalIndicators {
  /** Detected stress level (0-1) */
  stressLevel: number;
  
  /** Voice tremor detection */
  voiceTremor: boolean;
  
  /** Speaking pace (words per minute) */
  speakingPace: number;
  
  /** Voice pitch variance */
  pitchVariance: number;
  
  /** Emotional tone classification */
  emotionalTone: EmotionalTone;
  
  /** Confidence in emotional analysis */
  confidence: number;
  
  /** Timestamp of analysis */
  timestamp: Date;
}

/**
 * Voice Service Provider Interface
 */
export interface VoiceProvider {
  /** Provider identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Provider type */
  type: 'transcription' | 'synthesis' | 'analysis';
  
  /** Whether provider is currently available */
  available: boolean;
  
  /** Provider capabilities */
  capabilities: ProviderCapability[];
  
  /** Latency in milliseconds */
  latency: number;
  
  /** Accuracy rating (0-1) */
  accuracy: number;
  
  /** Cost per request */
  costPerRequest?: number;
}

/**
 * AI Provider Configuration
 */
export interface AIProviderConfig {
  /** Primary provider for transcription */
  transcriptionProvider: string;
  
  /** Fallback providers in order of preference */
  fallbackProviders: string[];
  
  /** Provider-specific settings */
  providerSettings: Record<string, any>;
  
  /** Automatic failover enabled */
  autoFailover: boolean;
  
  /** Quality threshold for provider switching */
  qualityThreshold: number;
  
  /** Maximum retry attempts */
  maxRetries: number;
}

/**
 * User Preferences for Voice Interaction
 */
export interface VoiceUserPreferences {
  /** Preferred language/locale */
  language: string;
  
  /** Voice feedback enabled */
  voiceFeedback: boolean;
  
  /** Haptic feedback enabled */
  hapticFeedback: boolean;
  
  /** Auto-save recordings */
  autoSave: boolean;
  
  /** Background recording allowed */
  backgroundRecording: boolean;
  
  /** Preferred AI personality */
  aiPersonality: AIPersonality;
  
  /** Voice command shortcuts */
  voiceCommands: VoiceCommand[];
  
  /** Session reminders */
  sessionReminders: boolean;
  
  /** Progress tracking */
  progressTracking: boolean;
}

/**
 * Accessibility Configuration
 */
export interface AccessibilityConfig {
  /** Screen reader support */
  screenReader: boolean;
  
  /** High contrast mode */
  highContrast: boolean;
  
  /** Large text support */
  largeText: boolean;
  
  /** Voice over support */
  voiceOver: boolean;
  
  /** Gesture alternatives */
  gestureAlternatives: boolean;
  
  /** Closed captions for AI speech */
  closedCaptions: boolean;
  
  /** Simplified interface mode */
  simplifiedInterface: boolean;
}

/**
 * Privacy and Security Configuration
 */
export interface PrivacyConfig {
  /** Local storage only (no cloud) */
  localStorageOnly: boolean;
  
  /** Encryption enabled */
  encryptionEnabled: boolean;
  
  /** Auto-delete recordings after processing */
  autoDeleteRecordings: boolean;
  
  /** Anonymize transcripts */
  anonymizeTranscripts: boolean;
  
  /** Data retention period (days) */
  dataRetentionDays: number;
  
  /** Share analytics data */
  shareAnalytics: boolean;
  
  /** Biometric protection required */
  biometricProtection: boolean;
}

/**
 * Supporting Types and Enumerations
 */

export type AudioEncoding = 
  | 'pcm_16'
  | 'pcm_24'
  | 'mp3'
  | 'aac'
  | 'flac'
  | 'opus';

export type AudioQuality = 
  | 'low'      // 16 kHz, compressed
  | 'medium'   // 22 kHz, standard
  | 'high'     // 44 kHz, uncompressed
  | 'studio';  // 48 kHz, professional

export type EmotionalTone = 
  | 'calm'
  | 'excited' 
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'content'
  | 'distressed'
  | 'neutral';

export type ProviderCapability = 
  | 'real_time'
  | 'batch_processing'
  | 'speaker_identification'
  | 'emotion_detection'
  | 'noise_reduction'
  | 'multiple_languages'
  | 'custom_vocabulary';

export interface AIPersonality {
  /** Personality identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Communication style */
  style: 'supportive' | 'professional' | 'casual' | 'empathetic';
  
  /** Response tone */
  tone: 'warm' | 'neutral' | 'encouraging' | 'clinical';
  
  /** Specialized for trauma-informed interactions */
  traumaInformed: boolean;
}

export interface VoiceCommand {
  /** Command phrase */
  phrase: string;
  
  /** Action to perform */
  action: VoiceCommandAction;
  
  /** Command parameters */
  parameters?: Record<string, any>;
  
  /** Whether command is enabled */
  enabled: boolean;
}

export type VoiceCommandAction = 
  | 'start_recording'
  | 'stop_recording'
  | 'pause_recording'
  | 'save_session'
  | 'take_break'
  | 'emergency_stop'
  | 'repeat_last'
  | 'new_chapter'
  | 'navigate_to';

export interface ProfessionalResource {
  /** Resource type */
  type: 'crisis_hotline' | 'therapy' | 'support_group' | 'self_help';
  
  /** Resource name */
  name: string;
  
  /** Contact information */
  contact: string;
  
  /** Available 24/7 */
  available24_7: boolean;
  
  /** Geographic region */
  region?: string;
  
  /** Specialized focus areas */
  specializations: string[];
}

export interface BreathingExercise {
  /** Exercise name */
  name: string;
  
  /** Duration in seconds */
  duration: number;
  
  /** Breathing pattern description */
  pattern: string;
  
  /** Guided audio available */
  hasAudio: boolean;
  
  /** Visual guide available */
  hasVisual: boolean;
}

/**
 * Voice State Transition Functions
 * Pure functions for managing state transitions
 */

export const createInitialVoiceState = (): VoiceState => ({
  status: 'idle',
  audioLevel: 0,
  confidence: 0,
  processingTime: 0,
  transcript: '',
  recordingDuration: 0,
  sessionId: generateSessionId(),
  emotionalSafetyActive: false,
  isOnline: true,
  availableProviders: [],
});

export const createDefaultRecordingConfig = (): RecordingConfig => ({
  sampleRate: 16000,
  channels: 1,
  encoding: 'pcm_16',
  maxDuration: 300, // 5 minutes
  emotionalSafetyMode: true,
  quality: 'medium',
  noiseReduction: true,
  autoPauseOnSilence: false,
  silenceThreshold: 10,
  maxSilenceDuration: 3000,
  realTimeTranscription: true,
  vadSensitivity: 0.5,
  bufferSize: 4096,
});

export const createDefaultEmotionalSafetyConfig = (): EmotionalSafetyConfig => ({
  enabled: true,
  crisisDetectionSensitivity: 0.7,
  triggerKeywords: [
    'hurt myself', 'end it all', 'can\'t go on', 'want to die',
    'suicide', 'kill myself', 'not worth living'
  ],
  autoPauseOnDistress: true,
  interventionPhrases: [
    'I notice this might be difficult to talk about.',
    'Would you like to take a moment to breathe?',
    'Remember, you\'re in a safe space here.',
    'It\'s okay to pause if you need to.'
  ],
  professionalResources: [
    {
      type: 'crisis_hotline',
      name: 'National Suicide Prevention Lifeline',
      contact: '988',
      available24_7: true,
      region: 'US',
      specializations: ['crisis intervention', 'suicide prevention']
    }
  ],
  maxEmotionalSessionDuration: 45,
  breathingExercises: [
    {
      name: '4-7-8 Breathing',
      duration: 60,
      pattern: 'Inhale for 4, hold for 7, exhale for 8',
      hasAudio: true,
      hasVisual: true
    }
  ],
  groundingTechniques: [
    'Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.',
    'Feel your feet on the ground and take three deep breaths.',
    'Hold a cold object and focus on the temperature and texture.'
  ]
});

/**
 * Utility Functions
 */

export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const isRecordingActive = (status: VoiceStatus): boolean => {
  return status === 'recording' || status === 'listening';
};

export const isProcessingState = (status: VoiceStatus): boolean => {
  return status === 'processing' || status === 'thinking';
};

export const canTransitionTo = (
  currentStatus: VoiceStatus, 
  targetStatus: VoiceStatus
): boolean => {
  const validTransitions: Record<VoiceStatus, VoiceStatus[]> = {
    idle: ['listening', 'recording', 'offline'],
    listening: ['recording', 'idle', 'error', 'offline'],
    recording: ['processing', 'paused', 'idle', 'error', 'offline'],
    processing: ['thinking', 'idle', 'error', 'offline'],
    thinking: ['speaking', 'idle', 'error', 'offline'],
    speaking: ['idle', 'listening', 'error', 'offline'],
    paused: ['recording', 'idle', 'error', 'offline'],
    error: ['idle', 'offline'],
    offline: ['idle', 'error']
  };

  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
};

export const getStatusDisplayName = (status: VoiceStatus): string => {
  const displayNames: Record<VoiceStatus, string> = {
    idle: 'Ready',
    listening: 'Listening...',
    recording: 'Recording',
    processing: 'Transcribing...',
    thinking: 'AI is thinking...',
    speaking: 'AI is responding',
    paused: 'Paused',
    error: 'Error',
    offline: 'Offline'
  };

  return displayNames[status] || status;
};

export const getStatusColor = (status: VoiceStatus): string => {
  const statusColors: Record<VoiceStatus, string> = {
    idle: '#8854D0',      // softPlum
    listening: '#A8C090',  // gentleSage
    recording: '#A8C090',  // gentleSage
    processing: '#E4B363', // warmOchre
    thinking: '#E4B363',   // warmOchre
    speaking: '#8854D0',   // softPlum
    paused: '#6E7076',     // slateGray
    error: '#E94B3C',      // error red
    offline: '#6E7076'     // slateGray
  };

  return statusColors[status] || '#6E7076';
};

/**
 * Voice State Validation Functions
 */

export const validateRecordingConfig = (config: Partial<RecordingConfig>): string[] => {
  const errors: string[] = [];

  if (config.sampleRate && (config.sampleRate < 8000 || config.sampleRate > 48000)) {
    errors.push('Sample rate must be between 8000 and 48000 Hz');
  }

  if (config.channels && (config.channels < 1 || config.channels > 2)) {
    errors.push('Channels must be 1 (mono) or 2 (stereo)');
  }

  if (config.maxDuration && config.maxDuration < 1) {
    errors.push('Maximum duration must be at least 1 second');
  }

  if (config.silenceThreshold && (config.silenceThreshold < 0 || config.silenceThreshold > 100)) {
    errors.push('Silence threshold must be between 0 and 100');
  }

  if (config.vadSensitivity && (config.vadSensitivity < 0 || config.vadSensitivity > 1)) {
    errors.push('VAD sensitivity must be between 0 and 1');
  }

  return errors;
};

export const isEmotionalDistressDetected = (indicators?: EmotionalIndicators): boolean => {
  if (!indicators) return false;

  return (
    indicators.stressLevel > 0.7 ||
    indicators.voiceTremor ||
    indicators.emotionalTone === 'distressed' ||
    indicators.emotionalTone === 'anxious'
  );
};

/**
 * Export all types and functions for use throughout the application
 */
export default {
  createInitialVoiceState,
  createDefaultRecordingConfig,
  createDefaultEmotionalSafetyConfig,
  generateSessionId,
  isRecordingActive,
  isProcessingState,
  canTransitionTo,
  getStatusDisplayName,
  getStatusColor,
  validateRecordingConfig,
  isEmotionalDistressDetected,
};