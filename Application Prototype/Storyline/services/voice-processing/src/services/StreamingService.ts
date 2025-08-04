import { WebSocket } from 'ws';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'http';

interface StreamingSession {
  sessionId: string;
  userId: string;
  provider: 'deepgram' | 'assemblyai';
  connection: any;
  startTime: Date;
  transcript: string[];
}

class StreamingService {
  private sessions: Map<string, StreamingSession> = new Map();
  private deepgram: any;

  constructor() {
    if (process.env.DEEPGRAM_API_KEY) {
      this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    }
  }

  async handleConnection(ws: WebSocket, req: IncomingMessage) {
    const sessionId = uuidv4();
    let session: StreamingSession | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'start':
            session = await this.startSession(sessionId, message);
            ws.send(JSON.stringify({
              type: 'session_started',
              sessionId,
              timestamp: new Date().toISOString()
            }));
            break;

          case 'audio':
            if (session) {
              await this.processAudioChunk(session, message.audio, ws);
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'No active session'
              }));
            }
            break;

          case 'stop':
            if (session) {
              await this.stopSession(sessionId);
              ws.send(JSON.stringify({
                type: 'session_ended',
                sessionId,
                transcript: session.transcript.join(' '),
                duration: Date.now() - session.startTime.getTime()
              }));
            }
            break;

          default:
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Unknown message type'
            }));
        }
      } catch (error) {
        logger.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Failed to process message'
        }));
      }
    });

    ws.on('close', () => {
      if (session) {
        this.stopSession(sessionId);
      }
      logger.info(`WebSocket closed for session: ${sessionId}`);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for session ${sessionId}:`, error);
    });
  }

  private async startSession(sessionId: string, config: any): Promise<StreamingSession> {
    const { userId, provider = 'deepgram', language = 'en' } = config;

    if (provider === 'deepgram' && this.deepgram) {
      const connection = this.deepgram.listen.live({
        model: 'nova-2',
        language,
        punctuate: true,
        interim_results: true,
        endpointing: 300,
        vad_events: true
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        logger.info(`Deepgram connection opened for session: ${sessionId}`);
      });

      const session: StreamingSession = {
        sessionId,
        userId,
        provider,
        connection,
        startTime: new Date(),
        transcript: []
      };

      this.sessions.set(sessionId, session);
      return session;
    }

    throw new Error(`Provider ${provider} not configured`);
  }

  private async processAudioChunk(
    session: StreamingSession,
    audioData: string,
    ws: WebSocket
  ) {
    if (session.provider === 'deepgram' && session.connection) {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      // Set up transcript listener
      session.connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        const transcript = data.channel.alternatives[0].transcript;
        
        if (transcript && data.is_final) {
          session.transcript.push(transcript);
          
          ws.send(JSON.stringify({
            type: 'transcript',
            transcript,
            is_final: true,
            timestamp: new Date().toISOString()
          }));
        } else if (transcript) {
          ws.send(JSON.stringify({
            type: 'transcript',
            transcript,
            is_final: false,
            timestamp: new Date().toISOString()
          }));
        }
      });

      // Send audio to Deepgram
      session.connection.send(audioBuffer);
    }
  }

  private async stopSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      if (session.provider === 'deepgram' && session.connection) {
        session.connection.finish();
      }
      
      this.sessions.delete(sessionId);
      logger.info(`Streaming session stopped: ${sessionId}`);
    }
  }

  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  getSessionInfo(sessionId: string): StreamingSession | undefined {
    return this.sessions.get(sessionId);
  }
}

// Export singleton instance
const streamingService = new StreamingService();

export function handleStreamingConnection(ws: WebSocket, req: IncomingMessage) {
  streamingService.handleConnection(ws, req);
}

export { streamingService };