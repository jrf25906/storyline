/**
 * AssemblyAI Speech-to-Text Service
 * Handles transcription of audio recordings
 */

import axios from 'axios';

// Configuration
const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY || '';
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2';

interface TranscriptionResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  error?: string;
  confidence?: number;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  sentiment?: {
    text: string;
    confidence: number;
  };
  summary?: string;
}

export class AssemblyAIService {
  private apiKey: string;
  private axiosInstance: any;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ASSEMBLYAI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('AssemblyAI API key not configured');
    }

    this.axiosInstance = axios.create({
      baseURL: ASSEMBLYAI_BASE_URL,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Upload audio file to AssemblyAI
   */
  async uploadAudio(audioUri: string): Promise<string> {
    try {
      // Convert local file URI to blob
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      // Upload to AssemblyAI
      const uploadResponse = await this.axiosInstance.post('/upload', blob, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      return uploadResponse.data.upload_url;
    } catch (error) {
      console.error('Failed to upload audio:', error);
      throw new Error('Audio upload failed');
    }
  }

  /**
   * Start transcription job
   */
  async startTranscription(
    audioUrl: string,
    options: {
      sentiment_analysis?: boolean;
      auto_highlights?: boolean;
      summary?: boolean;
      entity_detection?: boolean;
      speaker_labels?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/transcript', {
        audio_url: audioUrl,
        sentiment_analysis: options.sentiment_analysis || true,
        auto_highlights: options.auto_highlights || true,
        summarization: options.summary || true,
        entity_detection: options.entity_detection || true,
        speaker_labels: options.speaker_labels || false,
      });

      return response.data.id;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw new Error('Transcription initialization failed');
    }
  }

  /**
   * Poll transcription status
   */
  async getTranscriptionStatus(transcriptId: string): Promise<TranscriptionResult> {
    try {
      const response = await this.axiosInstance.get(`/transcript/${transcriptId}`);
      const data = response.data;

      return {
        id: data.id,
        status: data.status,
        text: data.text,
        error: data.error,
        confidence: data.confidence,
        words: data.words,
        sentiment: data.sentiment_analysis_results?.[0],
        summary: data.summary,
      };
    } catch (error) {
      console.error('Failed to get transcription status:', error);
      throw new Error('Failed to retrieve transcription status');
    }
  }

  /**
   * Transcribe audio file with polling
   */
  async transcribeAudio(
    audioUri: string,
    options?: {
      sentiment_analysis?: boolean;
      auto_highlights?: boolean;
      summary?: boolean;
      onProgress?: (status: string) => void;
    }
  ): Promise<TranscriptionResult> {
    try {
      // Step 1: Upload audio
      options?.onProgress?.('Uploading audio...');
      const audioUrl = await this.uploadAudio(audioUri);

      // Step 2: Start transcription
      options?.onProgress?.('Starting transcription...');
      const transcriptId = await this.startTranscription(audioUrl, options);

      // Step 3: Poll for results
      options?.onProgress?.('Processing...');
      let result: TranscriptionResult;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
        
        result = await this.getTranscriptionStatus(transcriptId);
        
        if (result.status === 'completed' || result.status === 'error') {
          break;
        }
        
        attempts++;
        options?.onProgress?.(`Processing... (${attempts * 5}s)`);
      }

      if (result!.status === 'error') {
        throw new Error(result!.error || 'Transcription failed');
      }

      if (result!.status !== 'completed') {
        throw new Error('Transcription timeout');
      }

      return result!;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Real-time transcription (WebSocket)
   * Note: This requires additional setup for React Native WebSocket
   */
  async startRealtimeTranscription(
    onTranscript: (text: string) => void,
    onError: (error: Error) => void
  ): Promise<() => void> {
    // This would require WebSocket implementation
    // For now, returning a placeholder
    console.warn('Real-time transcription not yet implemented for React Native');
    return () => {};
  }
}

// Export singleton instance
export const assemblyAI = new AssemblyAIService();