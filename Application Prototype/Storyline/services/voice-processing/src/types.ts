export interface TranscriptionOptions {
  language?: string;
  speakerDiarization?: boolean;
  maxSpeakers?: number;
  vocabularyName?: string;
  customVocabulary?: string[];
  contentFiltering?: boolean;
  speakerMetadata?: {
    age?: number;
    gender?: string;
    accent?: string;
    expectedText?: string;
  };
}

export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

export interface Segment {
  id: number | string;
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
  words?: Word[];
  segments?: Segment[];
  processingTime: number;
  provider: string;
  metadata?: {
    [key: string]: any;
    sentiment?: string;
    entities?: Array<{
      text: string;
      type: string;
      start: number;
      end: number;
    }>;
    contentSafety?: {
      hasCriticalContent: boolean;
      labels?: any[];
    };
    crisisDetection?: {
      hasCriticalContent: boolean;
      detectedPhrases: string[];
      severity: 'low' | 'medium' | 'high' | 'critical';
      requiresImmediateAction: boolean;
    };
  };
}

export interface VoiceProvider {
  transcribe(audio: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  transcribeStream(audioStream: NodeJS.ReadableStream): Promise<NodeJS.ReadableStream>;
  startRealtimeSession(options?: TranscriptionOptions): Promise<any>;
  isHealthy(): boolean;
}

export interface AudioFormat {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  codec: string;
}

export interface StreamingTranscriptionUpdate {
  text: string;
  is_final: boolean;
  confidence: number;
  words?: Word[];
  hasCriticalContent?: boolean;
}