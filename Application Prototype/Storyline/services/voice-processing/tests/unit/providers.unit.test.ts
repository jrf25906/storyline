import { AssemblyAIProvider } from '../../src/providers/AssemblyAIProvider';
import { DeepgramProvider } from '../../src/providers/DeepgramProvider';
import { WhisperProvider } from '../../src/providers/WhisperProvider';
import { AssemblyAI } from 'assemblyai';
import { createClient } from '@deepgram/sdk';
import { OpenAI } from 'openai';
import * as fs from 'fs';

// Mock all external dependencies
jest.mock('assemblyai');
jest.mock('@deepgram/sdk');
jest.mock('openai');
jest.mock('fs');

describe('Voice Provider Unit Tests', () => {
  describe('AssemblyAIProvider', () => {
    let provider: AssemblyAIProvider;
    let mockAssemblyAIClient: any;

    beforeEach(() => {
      mockAssemblyAIClient = {
        files: {
          upload: jest.fn()
        },
        transcripts: {
          create: jest.fn(),
          get: jest.fn()
        },
        realtime: {
          createTemporaryToken: jest.fn()
        }
      };

      (AssemblyAI as jest.Mock).mockImplementation(() => mockAssemblyAIClient);
      provider = new AssemblyAIProvider('test-api-key');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('transcribe', () => {
      it('should successfully transcribe audio', async () => {
        const mockAudio = Buffer.from('test audio data');
        const mockUploadUrl = 'https://cdn.assemblyai.com/upload/test123';
        const mockTranscriptId = 'transcript_123';
        
        mockAssemblyAIClient.files.upload.mockResolvedValue(mockUploadUrl);
        mockAssemblyAIClient.transcripts.create.mockResolvedValue({
          id: mockTranscriptId
        });
        mockAssemblyAIClient.transcripts.get.mockResolvedValue({
          id: mockTranscriptId,
          text: 'This is a test transcription',
          confidence: 0.95,
          language_code: 'en',
          audio_duration: 5.5,
          words: [
            { text: 'This', start: 0, end: 500, confidence: 0.96 },
            { text: 'is', start: 500, end: 700, confidence: 0.95 }
          ],
          sentiment_analysis_results: [
            { text: 'This is a test', sentiment: 'neutral', confidence: 0.85 }
          ],
          entities: [
            { text: 'test', entity_type: 'object', start: 1000, end: 1400 }
          ],
          content_safety_labels: {
            results: []
          }
        });

        const result = await provider.transcribe(mockAudio);

        expect(result.text).toBe('This is a test transcription');
        expect(result.confidence).toBe(0.95);
        expect(result.language).toBe('en');
        expect(result.duration).toBe(5.5);
        expect(result.words).toHaveLength(2);
        expect(result.provider).toBe('AssemblyAI');
        expect(result.metadata?.sentiment).toBe('neutral');
      });

      it('should detect critical content', async () => {
        const mockAudio = Buffer.from('test audio data');
        
        mockAssemblyAIClient.files.upload.mockResolvedValue('https://upload-url');
        mockAssemblyAIClient.transcripts.create.mockResolvedValue({ id: 'test-id' });
        mockAssemblyAIClient.transcripts.get.mockResolvedValue({
          id: 'test-id',
          text: 'I want to end it all',
          confidence: 0.94,
          language_code: 'en',
          audio_duration: 3.0,
          content_safety_labels: {
            results: [
              { label: 'suicide', severity: 'high', confidence: 0.98 },
              { label: 'self_harm', severity: 'high', confidence: 0.95 }
            ]
          }
        });

        const result = await provider.transcribe(mockAudio);

        expect(result.metadata?.contentSafety?.hasCriticalContent).toBe(true);
        expect(result.metadata?.contentSafety?.labels).toHaveLength(2);
      });

      it('should handle API errors gracefully', async () => {
        const mockAudio = Buffer.from('test audio data');
        
        mockAssemblyAIClient.files.upload.mockRejectedValue(
          new Error('API rate limit exceeded')
        );

        await expect(provider.transcribe(mockAudio))
          .rejects.toThrow('AssemblyAI transcription failed: API rate limit exceeded');
      });
    });

    describe('startRealtimeSession', () => {
      it('should create realtime session', async () => {
        const mockToken = 'temp-token-123';
        
        mockAssemblyAIClient.realtime.createTemporaryToken.mockResolvedValue(mockToken);

        // Mock WebSocket
        (global as any).WebSocket = jest.fn().mockImplementation(() => ({
          on: jest.fn(),
          send: jest.fn(),
          close: jest.fn()
        }));

        const ws = await provider.startRealtimeSession();
        
        expect(mockAssemblyAIClient.realtime.createTemporaryToken).toHaveBeenCalledWith({
          expires_in: 3600
        });
        expect((global as any).WebSocket).toHaveBeenCalledWith(
          expect.stringContaining(mockToken)
        );
      });
    });
  });

  describe('DeepgramProvider', () => {
    let provider: DeepgramProvider;
    let mockDeepgramClient: any;

    beforeEach(() => {
      mockDeepgramClient = {
        listen: {
          prerecorded: {
            transcribeFile: jest.fn()
          },
          live: jest.fn()
        }
      };

      (createClient as jest.Mock).mockReturnValue(mockDeepgramClient);
      provider = new DeepgramProvider('test-api-key');
    });

    describe('transcribe', () => {
      it('should successfully transcribe audio', async () => {
        const mockAudio = Buffer.from('test audio data');
        
        mockDeepgramClient.listen.prerecorded.transcribeFile.mockResolvedValue({
          result: {
            results: {
              channels: [{
                alternatives: [{
                  transcript: 'This is a Deepgram test',
                  confidence: 0.93,
                  words: [
                    { word: 'This', start: 0, end: 0.5, confidence: 0.94 }
                  ]
                }]
              }],
              sentiments: [{
                segments: [{
                  sentiment: { positive: 0.7, negative: 0.1, neutral: 0.2 }
                }]
              }],
              topics: {
                segments: [{
                  topics: [{ topic: 'testing', confidence: 0.8 }]
                }]
              }
            },
            metadata: {
              language: 'en',
              duration: 4.5,
              model_info: { name: 'nova-2' }
            }
          }
        });

        const result = await provider.transcribe(mockAudio);

        expect(result.text).toBe('This is a Deepgram test');
        expect(result.confidence).toBe(0.93);
        expect(result.language).toBe('en');
        expect(result.duration).toBe(4.5);
        expect(result.provider).toBe('Deepgram');
        expect(result.metadata?.sentiment).toBe('positive');
      });

      it('should detect critical phrases through search', async () => {
        const mockAudio = Buffer.from('test audio data');
        
        mockDeepgramClient.listen.prerecorded.transcribeFile.mockResolvedValue({
          result: {
            results: {
              channels: [{
                alternatives: [{
                  transcript: 'I want to hurt myself',
                  confidence: 0.92
                }]
              }],
              search: [
                { query: 'hurt myself', hits: [{ start: 10, end: 20 }] }
              ]
            },
            metadata: { language: 'en', duration: 3.0 }
          }
        });

        const result = await provider.transcribe(mockAudio);

        expect(result.metadata?.criticalPhrases?.detected).toBe(true);
        expect(result.metadata?.criticalPhrases?.matches).toHaveLength(1);
      });

      it('should handle options correctly', async () => {
        const mockAudio = Buffer.from('test audio data');
        
        mockDeepgramClient.listen.prerecorded.transcribeFile.mockResolvedValue({
          result: {
            results: {
              channels: [{
                alternatives: [{ transcript: 'Test', confidence: 0.9 }]
              }]
            },
            metadata: { language: 'es', duration: 2.0 }
          }
        });

        await provider.transcribe(mockAudio, {
          language: 'es',
          speakerDiarization: true
        });

        expect(mockDeepgramClient.listen.prerecorded.transcribeFile)
          .toHaveBeenCalledWith(mockAudio, expect.objectContaining({
            language: 'es',
            diarize: true
          }));
      });
    });

    describe('transcribeStream', () => {
      it('should handle streaming transcription', async () => {
        const mockStream = {
          on: jest.fn(),
          pipe: jest.fn()
        };

        const mockLiveClient = {
          on: jest.fn(),
          send: jest.fn(),
          finish: jest.fn()
        };

        mockDeepgramClient.listen.live.mockReturnValue(mockLiveClient);

        const resultStream = await provider.transcribeStream(mockStream as any);

        expect(resultStream).toBeDefined();
        expect(mockDeepgramClient.listen.live).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'nova-2-general',
            punctuate: true,
            interim_results: true
          })
        );
      });
    });
  });

  describe('WhisperProvider', () => {
    let provider: WhisperProvider;
    let mockOpenAIClient: any;

    beforeEach(() => {
      mockOpenAIClient = {
        audio: {
          transcriptions: {
            create: jest.fn()
          },
          translations: {
            create: jest.fn()
          }
        }
      };

      (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIClient);
      
      // Mock fs methods
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
      (fs.createReadStream as jest.Mock).mockReturnValue({});
      
      provider = new WhisperProvider('test-api-key');
    });

    describe('transcribe', () => {
      it('should successfully transcribe audio', async () => {
        const mockAudio = Buffer.from('test audio data');
        
        mockOpenAIClient.audio.transcriptions.create.mockResolvedValue({
          text: 'This is a Whisper test transcription',
          language: 'en',
          duration: 6.5,
          words: [
            { word: 'This', start: 0, end: 0.5 }
          ],
          segments: [
            {
              id: 0,
              text: 'This is a Whisper test transcription',
              start: 0,
              end: 6.5,
              avg_logprob: -0.3
            }
          ]
        });

        const result = await provider.transcribe(mockAudio);

        expect(result.text).toBe('This is a Whisper test transcription');
        expect(result.language).toBe('en');
        expect(result.duration).toBe(6.5);
        expect(result.provider).toBe('Whisper');
        expect(result.confidence).toBeGreaterThan(0.7); // Converted from logprob
      });

      it('should detect critical content', async () => {
        const mockAudio = Buffer.from('test audio data');
        
        mockOpenAIClient.audio.transcriptions.create.mockResolvedValue({
          text: 'I want to end it all and don\'t want to wake up',
          language: 'en',
          duration: 4.0
        });

        const result = await provider.transcribe(mockAudio);

        expect(result.metadata?.hasCriticalContent).toBe(true);
        expect(result.metadata?.criticalPhrases).toContain('end it all');
        expect(result.metadata?.criticalPhrases).toContain('don\'t want to wake up');
      });

      it('should clean up temp files on error', async () => {
        const mockAudio = Buffer.from('test audio data');
        
        mockOpenAIClient.audio.transcriptions.create.mockRejectedValue(
          new Error('API error')
        );

        await expect(provider.transcribe(mockAudio))
          .rejects.toThrow('Whisper transcription failed: API error');

        // Verify cleanup was attempted
        expect(fs.unlinkSync).toHaveBeenCalled();
      });
    });

    describe('translateAudio', () => {
      it('should translate audio to English', async () => {
        const mockAudio = Buffer.from('test audio data');
        
        mockOpenAIClient.audio.translations.create.mockResolvedValue({
          text: 'This is the translated text',
          language: 'es' // Original language
        });

        const result = await provider.translateAudio(mockAudio, 'en');

        expect(result.text).toBe('This is the translated text');
        expect(result.language).toBe('en');
        expect(result.metadata?.originalLanguage).toBe('es');
      });
    });

    describe('unsupported features', () => {
      it('should throw error for streaming', async () => {
        const mockStream = {} as NodeJS.ReadableStream;
        
        await expect(provider.transcribeStream(mockStream))
          .rejects.toThrow('Stream transcription not directly supported by Whisper');
      });

      it('should throw error for realtime session', async () => {
        await expect(provider.startRealtimeSession())
          .rejects.toThrow('Real-time transcription not supported by OpenAI Whisper');
      });
    });
  });
});