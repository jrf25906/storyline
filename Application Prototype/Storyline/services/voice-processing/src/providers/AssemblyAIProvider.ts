import { AssemblyAI } from 'assemblyai';
import { VoiceProvider, TranscriptionResult, TranscriptionOptions } from '../types';
import { logger } from '../utils/logger';

export class AssemblyAIProvider implements VoiceProvider {
  private client: AssemblyAI;
  private readonly name = 'AssemblyAI';

  constructor(apiKey: string) {
    this.client = new AssemblyAI({
      apiKey
    });
  }

  async transcribe(audio: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting AssemblyAI transcription', { 
        audioSize: audio.length,
        language: options?.language || 'en'
      });

      // Upload the audio buffer
      const uploadUrl = await this.client.files.upload(audio);
      
      // Create transcription job
      const transcript = await this.client.transcripts.create({
        audio_url: uploadUrl,
        language_code: options?.language || 'en',
        speaker_labels: options?.speakerDiarization || false,
        auto_highlights: true,
        sentiment_analysis: true,
        entity_detection: true,
        content_safety: true, // Important for crisis detection
        iab_categories: true,
        summarization: false,
        auto_chapters: false
      });

      // Wait for transcription to complete  
      const result = await this.client.transcripts.get(transcript.id) as any;

      const processingTime = Date.now() - startTime;
      
      // Check for content safety issues (crisis detection)
      const hasCriticalContent = result.content_safety_labels?.results?.some(
        (label: any) => label.severity === 'high' && 
        (label.label === 'suicide' || label.label === 'self_harm')
      );

      // Extract sentiment
      const sentimentScores = result.sentiment_analysis_results?.map((s: any) => ({
        text: s.text,
        sentiment: s.sentiment,
        confidence: s.confidence
      }));

      const overallSentiment = this.calculateOverallSentiment(sentimentScores);

      logger.info('AssemblyAI transcription completed', {
        transcriptId: result.id,
        processingTime,
        wordCount: result.words?.length || 0,
        hasCriticalContent
      });

      return {
        text: result.text || '',
        confidence: result.confidence || 0.9,
        language: result.language_code || 'en',
        duration: result.audio_duration || 0,
        words: result.words?.map((w: any) => ({
          word: w.text,
          start: w.start / 1000, // Convert to seconds
          end: w.end / 1000,
          confidence: w.confidence
        })),
        processingTime,
        provider: this.name,
        metadata: {
          transcriptId: result.id,
          sentiment: overallSentiment,
          entities: result.entities?.map((e: any) => ({
            text: e.text,
            type: e.entity_type,
            start: e.start,
            end: e.end
          })),
          contentSafety: {
            hasCriticalContent,
            labels: result.content_safety_labels?.results
          }
        }
      };
    } catch (error) {
      logger.error('AssemblyAI transcription failed', { error });
      throw new Error(`AssemblyAI transcription failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async transcribeStream(audioStream: NodeJS.ReadableStream): Promise<NodeJS.ReadableStream> {
    // AssemblyAI doesn't support direct streaming, but we can use their real-time API
    throw new Error('Stream transcription not implemented for AssemblyAI. Use real-time WebSocket instead.');
  }

  async createStream(options?: TranscriptionOptions): Promise<any> {
    const ws = await this.startRealtimeSession(options);
    
    // Create a stream-like interface
    const stream = {
      write: (audioData: Buffer) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(audioData);
        }
      },
      end: () => {
        if (ws.readyState === 1) {
          ws.close();
        }
      },
      on: (event: string, callback: Function) => {
        if (event === 'data' || event === 'partial') {
          ws.on('message', (data: any) => {
            const parsed = JSON.parse(data.toString());
            if (parsed.message_type === 'PartialTranscript') {
              callback({
                text: parsed.text,
                confidence: parsed.confidence || 0.9,
                isPartial: true
              });
            } else if (parsed.message_type === 'FinalTranscript') {
              callback({
                text: parsed.text,
                confidence: parsed.confidence || 0.95,
                isPartial: false
              });
            }
          });
        } else if (event === 'error') {
          ws.on('error', callback);
        } else if (event === 'close') {
          ws.on('close', callback);
        }
      }
    };
    
    return stream;
  }

  async startRealtimeSession(options?: TranscriptionOptions): Promise<any> {
    const token = await this.client.realtime.createTemporaryToken({
      expires_in: 3600 // 1 hour
    });

    const ws = new (global as any).WebSocket(
      `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
    );

    return ws;
  }

  isHealthy(): boolean {
    return true; // Could implement actual health check
  }

  private calculateOverallSentiment(sentiments?: Array<{sentiment: string, confidence: number}>): string {
    if (!sentiments || sentiments.length === 0) return 'neutral';
    
    const sentimentCounts = sentiments.reduce((acc, s) => {
      acc[s.sentiment] = (acc[s.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(sentimentCounts).reduce((a, b) => 
      sentimentCounts[a] > sentimentCounts[b] ? a : b
    );
  }
}