import { AssemblyAIProvider } from '../providers/AssemblyAIProvider';
import { DeepgramProvider } from '../providers/DeepgramProvider';
import { WhisperProvider } from '../providers/WhisperProvider';
import { VoiceProvider, TranscriptionResult, TranscriptionOptions } from '../types';
import { logger } from '../utils/logger';
import { CrisisDetectionService } from '../../../crisis-detection/src/CrisisDetectionService';

export class VoiceTranscriptionService {
  private providers: Map<string, VoiceProvider> = new Map();
  private providerOrder = ['assemblyai', 'deepgram', 'whisper'];
  private crisisDetection: CrisisDetectionService;

  constructor() {
    this.initializeProviders();
    this.crisisDetection = new CrisisDetectionService();
  }

  private initializeProviders() {
    // Initialize providers with API keys from environment
    if (process.env.ASSEMBLYAI_API_KEY) {
      this.providers.set('assemblyai', new AssemblyAIProvider(process.env.ASSEMBLYAI_API_KEY));
    }

    if (process.env.DEEPGRAM_API_KEY) {
      this.providers.set('deepgram', new DeepgramProvider(process.env.DEEPGRAM_API_KEY));
    }

    if (process.env.OPENAI_API_KEY) {
      this.providers.set('whisper', new WhisperProvider(process.env.OPENAI_API_KEY));
    }

    logger.info('Voice providers initialized', {
      available: Array.from(this.providers.keys())
    });
  }

  async transcribe(
    audio: Buffer, 
    options?: TranscriptionOptions & { preferredProvider?: string }
  ): Promise<TranscriptionResult> {
    const providers = this.getProviderOrder(options?.preferredProvider);
    
    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        logger.info(`Attempting transcription with ${providerName}`);
        
        const result = await provider.transcribe(audio, options);
        
        // Always check for crisis content regardless of provider detection
        const crisisCheck = await this.crisisDetection.detectCrisis(result.text);
        
        if (crisisCheck.hasCriticalContent) {
          logger.warn('Critical content detected in transcription', {
            provider: providerName,
            phrases: crisisCheck.detectedPhrases
          });
          
          // Enhance result with crisis detection
          result.metadata = {
            ...result.metadata,
            crisisDetection: {
              hasCriticalContent: true,
              detectedPhrases: crisisCheck.detectedPhrases,
              severity: crisisCheck.severity === 'none' ? 'low' : crisisCheck.severity,
              requiresImmediateAction: crisisCheck.requiresImmediateAction
            }
          };
        }

        // Calculate and log bias metrics if demographic info provided
        if (options?.speakerMetadata) {
          this.logBiasMetrics(result, options.speakerMetadata);
        }

        return result;
      } catch (error) {
        logger.error(`${providerName} transcription failed`, { error });
        
        // If this was the last provider, throw the error
        if (providerName === providers[providers.length - 1]) {
          throw new Error(`All voice providers failed. Last error: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Otherwise, continue to next provider
        continue;
      }
    }

    throw new Error('No voice providers available');
  }

  async transcribeStream(
    audioStream: NodeJS.ReadableStream,
    options?: TranscriptionOptions & { preferredProvider?: string }
  ): Promise<NodeJS.ReadableStream> {
    // Only Deepgram supports true streaming
    const provider = this.providers.get('deepgram');
    if (!provider) {
      throw new Error('Streaming provider (Deepgram) not available');
    }

    return provider.transcribeStream(audioStream);
  }

  async startRealtimeSession(
    options?: TranscriptionOptions & { preferredProvider?: string }
  ): Promise<any> {
    // Try providers that support real-time
    const realtimeProviders = ['assemblyai', 'deepgram'];
    
    for (const providerName of realtimeProviders) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        return await provider.startRealtimeSession(options);
      } catch (error) {
        logger.error(`${providerName} realtime session failed`, { error });
        continue;
      }
    }

    throw new Error('No real-time providers available');
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  isProviderHealthy(providerName: string): boolean {
    const provider = this.providers.get(providerName);
    return provider ? provider.isHealthy() : false;
  }

  private getProviderOrder(preferredProvider?: string): string[] {
    if (preferredProvider && this.providers.has(preferredProvider)) {
      // Put preferred provider first, then follow normal order
      return [
        preferredProvider,
        ...this.providerOrder.filter(p => p !== preferredProvider)
      ];
    }
    
    return this.providerOrder;
  }

  private logBiasMetrics(result: TranscriptionResult, speakerMetadata: any) {
    const metrics = {
      provider: result.provider,
      confidence: result.confidence,
      processingTime: result.processingTime,
      speakerAge: speakerMetadata.age,
      speakerGender: speakerMetadata.gender,
      speakerAccent: speakerMetadata.accent,
      wordErrorRate: this.calculateWER(result, speakerMetadata.expectedText),
      timestamp: new Date().toISOString()
    };

    logger.info('Voice transcription bias metrics', metrics);
    
    // TODO: Send to metrics collection service
  }

  private calculateWER(result: TranscriptionResult, expectedText?: string): number {
    if (!expectedText) return -1;
    
    // Simple WER calculation (could be improved)
    const resultWords = result.text.toLowerCase().split(/\s+/);
    const expectedWords = expectedText.toLowerCase().split(/\s+/);
    
    let errors = 0;
    const maxLength = Math.max(resultWords.length, expectedWords.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (resultWords[i] !== expectedWords[i]) {
        errors++;
      }
    }
    
    return errors / maxLength;
  }
}