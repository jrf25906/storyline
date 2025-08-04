import { OpenAI } from 'openai';
import { VoiceProvider, TranscriptionResult, TranscriptionOptions } from '../types';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class WhisperProvider implements VoiceProvider {
  private client: OpenAI;
  private readonly name = 'Whisper';
  private readonly tempDir = '/tmp/whisper-uploads';

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async transcribe(audio: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult> {
    const startTime = Date.now();
    let tempFilePath: string | null = null;
    
    try {
      logger.info('Starting Whisper transcription', { 
        audioSize: audio.length,
        language: options?.language || 'en'
      });

      // Whisper requires a file, so we need to write the buffer temporarily
      tempFilePath = path.join(this.tempDir, `${uuidv4()}.wav`);
      fs.writeFileSync(tempFilePath, audio);

      // Create a readable stream from the file
      const audioFile = fs.createReadStream(tempFilePath) as any;

      // Transcribe with Whisper
      const transcription = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: options?.language || 'en',
        response_format: 'verbose_json',
        timestamp_granularities: ['word', 'segment']
      });

      const processingTime = Date.now() - startTime;

      // Check for critical content
      const hasCriticalContent = this.detectCriticalContent(transcription.text);

      // Calculate confidence (Whisper doesn't provide confidence scores, so we estimate)
      const estimatedConfidence = this.estimateConfidence(transcription);

      logger.info('Whisper transcription completed', {
        processingTime,
        textLength: transcription.text.length,
        hasCriticalContent
      });

      return {
        text: transcription.text,
        confidence: estimatedConfidence,
        language: transcription.language || options?.language || 'en',
        duration: transcription.duration || 0,
        words: transcription.words?.map(w => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: estimatedConfidence // Whisper doesn't provide per-word confidence
        })),
        segments: transcription.segments?.map(s => ({
          id: s.id,
          text: s.text,
          start: s.start,
          end: s.end,
          confidence: s.avg_logprob ? this.logprobToConfidence(s.avg_logprob) : estimatedConfidence
        })),
        processingTime,
        provider: this.name,
        metadata: {
          model: 'whisper-1',
          task: (transcription as any).task || 'transcribe',
          hasCriticalContent,
          criticalPhrases: hasCriticalContent ? this.findCriticalPhrases(transcription.text) : []
        }
      };
    } catch (error) {
      logger.error('Whisper transcription failed', { error });
      throw new Error(`Whisper transcription failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  async createStream(options?: TranscriptionOptions): Promise<any> {
    // Whisper doesn't support real streaming, but we can simulate it
    const chunks: Buffer[] = [];
    let isProcessing = false;
    const callbacks = {
      data: [] as Function[],
      error: [] as Function[],
      close: [] as Function[]
    };

    const stream = {
      write: (audioData: Buffer) => {
        chunks.push(audioData);
        // Process in batches every 5 seconds of audio
        if (!isProcessing && chunks.length > 5) {
          isProcessing = true;
          this.processBatch(chunks.splice(0, 5), callbacks.data, callbacks.error)
            .finally(() => { isProcessing = false; });
        }
      },
      end: () => {
        // Process any remaining chunks
        if (chunks.length > 0) {
          this.processBatch(chunks, callbacks.data, callbacks.error)
            .finally(() => {
              callbacks.close.forEach(cb => cb());
            });
        } else {
          callbacks.close.forEach(cb => cb());
        }
      },
      on: (event: string, callback: Function) => {
        if (event === 'data' || event === 'partial') {
          callbacks.data.push(callback);
        } else if (event === 'error') {
          callbacks.error.push(callback);
        } else if (event === 'close') {
          callbacks.close.push(callback);
        }
      }
    };

    return stream;
  }

  private async processBatch(chunks: Buffer[], dataCallbacks: Function[], errorCallbacks: Function[]) {
    try {
      const combinedBuffer = Buffer.concat(chunks);
      const result = await this.transcribe(combinedBuffer);
      dataCallbacks.forEach(cb => cb({
        text: result.text,
        confidence: result.confidence,
        isPartial: false
      }));
    } catch (error) {
      errorCallbacks.forEach(cb => cb(error));
    }
  }

  async transcribeStream(audioStream: NodeJS.ReadableStream): Promise<NodeJS.ReadableStream> {
    // Whisper doesn't support streaming, so we need to collect the stream first
    throw new Error('Stream transcription not directly supported by Whisper. Use batch transcription instead.');
  }

  async startRealtimeSession(options?: TranscriptionOptions): Promise<any> {
    // OpenAI doesn't provide real-time transcription yet
    throw new Error('Real-time transcription not supported by OpenAI Whisper');
  }

  isHealthy(): boolean {
    return true; // Could implement actual health check
  }

  private detectCriticalContent(text: string): boolean {
    const lowerText = text.toLowerCase();
    const criticalPhrases = [
      'end it all',
      'ending everything',
      'can\'t go on',
      'no point in living',
      'ending my life',
      'hurt myself',
      'hurting myself',
      'wish i wasn\'t here',
      'better off without me',
      'don\'t want to wake up',
      'suicide',
      'kill myself',
      'self harm',
      'cutting',
      'want to die',
      'better off dead'
    ];

    return criticalPhrases.some(phrase => lowerText.includes(phrase));
  }

  private findCriticalPhrases(text: string): string[] {
    const lowerText = text.toLowerCase();
    const criticalPhrases = [
      'end it all',
      'ending everything',
      'can\'t go on',
      'no point in living',
      'ending my life',
      'hurt myself',
      'hurting myself',
      'wish i wasn\'t here',
      'better off without me',
      'don\'t want to wake up',
      'suicide',
      'kill myself',
      'self harm',
      'cutting',
      'want to die',
      'better off dead'
    ];

    return criticalPhrases.filter(phrase => lowerText.includes(phrase));
  }

  private estimateConfidence(transcription: any): number {
    // If we have segment-level logprobs, use them to estimate confidence
    if (transcription.segments && transcription.segments.length > 0) {
      const avgLogprob = transcription.segments.reduce((sum: number, seg: any) => 
        sum + (seg.avg_logprob || 0), 0
      ) / transcription.segments.length;
      
      return this.logprobToConfidence(avgLogprob);
    }
    
    // Default confidence for Whisper (it's generally very accurate)
    return 0.92;
  }

  private logprobToConfidence(logprob: number): number {
    // Convert log probability to confidence score (0-1)
    // Whisper logprobs are typically negative, closer to 0 = more confident
    // Typical range is -2 to 0
    const confidence = Math.exp(logprob);
    return Math.max(0, Math.min(1, confidence));
  }

  async translateAudio(audio: Buffer, targetLanguage: string): Promise<TranscriptionResult> {
    const startTime = Date.now();
    let tempFilePath: string | null = null;
    
    try {
      logger.info('Starting Whisper translation', { 
        audioSize: audio.length,
        targetLanguage
      });

      // Whisper requires a file
      tempFilePath = path.join(this.tempDir, `${uuidv4()}.wav`);
      fs.writeFileSync(tempFilePath, audio);

      const audioFile = fs.createReadStream(tempFilePath) as any;

      // Translate with Whisper (always translates to English)
      const translation = await this.client.audio.translations.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json'
      });

      const processingTime = Date.now() - startTime;

      return {
        text: translation.text,
        confidence: 0.9, // Estimated
        language: 'en', // Whisper always translates to English
        duration: 0,
        processingTime,
        provider: this.name,
        metadata: {
          model: 'whisper-1',
          task: 'translate',
          originalLanguage: (translation as any).language || 'unknown'
        }
      };
    } catch (error) {
      logger.error('Whisper translation failed', { error });
      throw new Error(`Whisper translation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
}