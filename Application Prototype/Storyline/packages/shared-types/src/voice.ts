export interface VoiceRecording {
  id: string;
  userId: string;
  documentId?: string;
  duration: number; // in seconds
  fileUrl: string;
  transcript?: Transcript;
  status: VoiceRecordingStatus;
  metadata: VoiceMetadata;
  createdAt: Date;
  processedAt?: Date;
}

export type VoiceRecordingStatus = 
  | 'uploading' 
  | 'processing' 
  | 'transcribing' 
  | 'completed' 
  | 'failed';

export interface Transcript {
  id: string;
  recordingId: string;
  text: string;
  words: TranscriptWord[];
  language: string;
  confidence: number;
  provider: 'assemblyai' | 'deepgram' | 'whisper';
  createdAt: Date;
}

export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface VoiceMetadata {
  sampleRate: number;
  channels: number;
  bitrate: number;
  format: string;
  environment?: 'quiet' | 'moderate' | 'noisy';
  device?: string;
}

export interface RealtimeVoiceSession {
  id: string;
  userId: string;
  documentId?: string;
  status: 'connecting' | 'active' | 'paused' | 'ended';
  startTime: Date;
  endTime?: Date;
  provider: 'openai-realtime' | 'assemblyai-streaming' | 'deepgram-streaming';
  metrics: VoiceSessionMetrics;
}

export interface VoiceSessionMetrics {
  totalDuration: number;
  speechDuration: number;
  silenceDuration: number;
  wordsTranscribed: number;
  averageConfidence: number;
  latency: number[]; // array of latency measurements
}