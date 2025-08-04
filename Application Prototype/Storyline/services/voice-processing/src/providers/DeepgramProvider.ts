import { createClient, DeepgramClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { VoiceProvider, TranscriptionResult, TranscriptionOptions } from '../types';
import { logger } from '../utils/logger';
import { Readable } from 'stream';

export class DeepgramProvider implements VoiceProvider {
  private client: DeepgramClient;
  private readonly name = 'Deepgram';

  constructor(apiKey: string) {
    this.client = createClient(apiKey);
  }

  async transcribe(audio: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting Deepgram transcription', { 
        audioSize: audio.length,
        language: options?.language || 'en'
      });

      const { result } = await this.client.listen.prerecorded.transcribeFile(
        audio,
        {
          model: 'nova-2', // Latest and most accurate model
          language: options?.language || 'en',
          smart_format: true,
          punctuate: true,
          profanity_filter: false, // Don't filter for crisis detection
          diarize: options?.speakerDiarization || false,
          detect_language: !options?.language,
          alternatives: 3,
          numerals: true,
          search: this.getCriticalPhrases(), // Search for crisis phrases
          keywords: this.getCriticalPhrases(),
          sentiment: true,
          topics: true,
          entities: true,
          summarize: false
        }
      );

      const processingTime = Date.now() - startTime;
      
      // Extract the best alternative
      const transcript = result?.results?.channels[0]?.alternatives[0];
      
      if (!transcript) {
        throw new Error('No transcription result from Deepgram');
      }

      // Check for critical content
      const hasCriticalContent = this.detectCriticalContent(
        transcript.transcript,
        (result?.results as any)?.search || []
      );

      // Extract sentiment info
      const sentimentInfo = (result?.results as any)?.sentiments?.[0];
      const overallSentiment = this.mapSentiment(sentimentInfo);

      logger.info('Deepgram transcription completed', {
        processingTime,
        wordCount: transcript.words?.length || 0,
        hasCriticalContent,
        confidence: transcript.confidence
      });

      return {
        text: transcript.transcript || '',
        confidence: transcript.confidence || 0.9,
        language: (result?.metadata as any)?.language || options?.language || 'en',
        duration: result?.metadata?.duration || 0,
        words: transcript.words?.map((w: any) => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: w.confidence || transcript.confidence || 0.9,
          speaker: w.speaker
        })),
        processingTime,
        provider: this.name,
        metadata: {
          model: result?.metadata?.model_info?.name,
          sentiment: overallSentiment,
          topics: (result?.results as any)?.topics?.segments?.[0]?.topics,
          entities: (result?.results as any)?.entities?.entities,
          criticalPhrases: {
            detected: hasCriticalContent,
            matches: (result?.results as any)?.search
          }
        }
      };
    } catch (error) {
      logger.error('Deepgram transcription failed', { error });
      throw new Error(`Deepgram transcription failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createStream(options?: TranscriptionOptions): Promise<any> {
    const connection = this.client.listen.live({
      model: 'nova-2-general',
      language: options?.language || 'en',
      punctuate: true,
      interim_results: true,
      endpointing: 300,
      vad_events: true
    });

    const stream = {
      write: (audioData: Buffer) => {
        connection.send(audioData as any);
      },
      end: () => {
        connection.finish();
      },
      on: (event: string, callback: Function) => {
        if (event === 'data' || event === 'partial') {
          connection.on('Results', (data: any) => {
            const result = data.channel?.alternatives?.[0];
            if (result) {
              callback({
                text: result.transcript,
                confidence: result.confidence || 0.9,
                isPartial: data.is_final === false
              });
            }
          });
        } else if (event === 'error') {
          connection.on('error', callback as any);
        } else if (event === 'close') {
          connection.on('close', callback as any);
        }
      }
    };

    return stream;
  }

  async transcribeStream(audioStream: NodeJS.ReadableStream): Promise<NodeJS.ReadableStream> {
    const outputStream = new Readable({
      read() {}
    });

    const live = this.client.listen.live({
      model: 'nova-2-general',
      language: 'en',
      smart_format: true,
      punctuate: true,
      interim_results: true,
      endpointing: 300,
      keywords: this.getCriticalPhrases()
    });

    live.on(LiveTranscriptionEvents.Open, () => {
      logger.info('Deepgram stream opened');
      
      audioStream.on('data', (chunk) => {
        live.send(chunk);
      });

      audioStream.on('end', () => {
        live.finish();
      });
    });

    live.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel?.alternatives[0];
      if (transcript && transcript.transcript) {
        outputStream.push(JSON.stringify({
          text: transcript.transcript,
          is_final: data.is_final,
          confidence: transcript.confidence,
          words: transcript.words,
          hasCriticalContent: this.detectCriticalContent(transcript.transcript, [])
        }) + '\n');
      }
    });

    live.on(LiveTranscriptionEvents.Close, () => {
      logger.info('Deepgram stream closed');
      outputStream.push(null);
    });

    live.on(LiveTranscriptionEvents.Error, (error) => {
      logger.error('Deepgram stream error', { error });
      outputStream.destroy(error);
    });

    return outputStream;
  }

  async startRealtimeSession(options?: TranscriptionOptions): Promise<any> {
    const live = this.client.listen.live({
      model: 'nova-2-general',
      language: options?.language || 'en',
      smart_format: true,
      punctuate: true,
      interim_results: true,
      endpointing: 300,
      keywords: this.getCriticalPhrases()
    });

    return live;
  }

  isHealthy(): boolean {
    return true; // Could implement actual health check
  }

  private getCriticalPhrases(): string[] {
    return [
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
      'cutting'
    ];
  }

  private detectCriticalContent(text: string, searchResults: any[]): boolean {
    const lowerText = text.toLowerCase();
    const criticalPhrases = this.getCriticalPhrases();
    
    // Check direct text match
    const hasDirectMatch = criticalPhrases.some(phrase => 
      lowerText.includes(phrase.toLowerCase())
    );

    // Check search results
    const hasSearchMatch = searchResults.some(result => 
      result.hits && result.hits.length > 0
    );

    return hasDirectMatch || hasSearchMatch;
  }

  private mapSentiment(sentimentInfo: any): string {
    if (!sentimentInfo) return 'neutral';
    
    const segments = sentimentInfo.segments || [];
    if (segments.length === 0) return 'neutral';

    // Average sentiment across segments
    const sentimentScores = segments.reduce((acc: any, seg: any) => {
      const sentiment = seg.sentiment;
      if (sentiment) {
        acc.positive += sentiment.positive || 0;
        acc.negative += sentiment.negative || 0;
        acc.neutral += sentiment.neutral || 0;
        acc.count++;
      }
      return acc;
    }, { positive: 0, negative: 0, neutral: 0, count: 0 });

    if (sentimentScores.count === 0) return 'neutral';

    const avgPositive = sentimentScores.positive / sentimentScores.count;
    const avgNegative = sentimentScores.negative / sentimentScores.count;
    const avgNeutral = sentimentScores.neutral / sentimentScores.count;

    if (avgPositive > avgNegative && avgPositive > avgNeutral) return 'positive';
    if (avgNegative > avgPositive && avgNegative > avgNeutral) return 'negative';
    return 'neutral';
  }
}