# Voice Processing Service

Microservice for handling voice recording uploads, transcription, streaming, and text-to-speech functionality.

## Features

- **Audio Upload**: Handle voice recording uploads with S3/MinIO storage
- **Transcription**: Multi-provider support (AssemblyAI, Deepgram, OpenAI Whisper)
- **Real-time Streaming**: WebSocket-based real-time voice transcription
- **Text-to-Speech**: Convert text to natural-sounding speech
- **Audio Processing**: Format conversion, normalization, noise reduction
- **Job Queue**: Asynchronous processing with Bull/Redis

## Setup

1. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development:
   ```bash
   npm run dev
   ```

## API Endpoints

### Upload Routes
- `POST /upload` - Upload single audio file
- `POST /upload/chunk` - Upload audio chunks for streaming
- `GET /upload/status/:recordingId` - Check upload status

### Transcription Routes
- `POST /transcription/start` - Start async transcription job
- `GET /transcription/status/:jobId` - Check job status
- `GET /transcription/result/:recordingId` - Get transcription result
- `POST /transcription/direct` - Direct synchronous transcription
- `DELETE /transcription/cancel/:jobId` - Cancel transcription job

### Streaming Routes
- `POST /streaming/session/start` - Initialize streaming session
- `POST /streaming/session/end` - End streaming session
- `GET /streaming/session/:sessionId` - Get session status

### TTS Routes
- `POST /tts/synthesize` - Convert text to speech
- `GET /tts/voices` - List available voices
- `POST /tts/preview` - Generate preview (max 100 chars)

## WebSocket Protocol

Connect to WebSocket endpoint for real-time streaming:

```javascript
const ws = new WebSocket('ws://localhost:3003');

// Start session
ws.send(JSON.stringify({
  type: 'start',
  userId: 'user123',
  provider: 'deepgram',
  language: 'en'
}));

// Send audio chunks
ws.send(JSON.stringify({
  type: 'audio',
  audio: 'base64_encoded_audio_data'
}));

// Stop session
ws.send(JSON.stringify({
  type: 'stop'
}));
```

## Audio Processing Utilities

The service includes utilities for:
- Format conversion (MP3, WAV, AAC, etc.)
- Audio normalization
- Noise reduction
- Chunk splitting for long recordings
- Audio merging

## Environment Variables

- `PORT`: Service port (default: 3003)
- `REDIS_HOST/PORT`: Redis connection for job queues
- `S3_ENDPOINT`: S3/MinIO endpoint
- `OPENAI_API_KEY`: For Whisper and TTS
- `ASSEMBLYAI_API_KEY`: For AssemblyAI transcription
- `DEEPGRAM_API_KEY`: For Deepgram transcription