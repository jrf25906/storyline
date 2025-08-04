# Storyline Backend Services

This directory contains all the microservices that power the Storyline platform.

## Architecture

The backend follows a microservices architecture with the following services:

### Core Services

1. **API Gateway** (`/api`) - Port 3000
   - Main entry point for all client requests
   - Request routing and load balancing
   - Authentication middleware
   - Rate limiting and security
   - WebSocket support for real-time features

2. **Authentication Service** (`/auth`) - Port 3001
   - User registration and login
   - JWT token management
   - OAuth integration (Google, Apple)
   - Password reset and email verification
   - Biometric authentication support

3. **AI Orchestrator** (`/ai-orchestrator`) - Port 3002
   - Manages AI conversations
   - Routes between AI providers (OpenAI, Anthropic)
   - Handles context and memory integration
   - Emotional safety monitoring
   - Narrative intelligence features

4. **Voice Processing** (`/voice-processing`) - Port 3003
   - Real-time voice streaming
   - Speech-to-text processing (AssemblyAI, Deepgram)
   - Audio file upload and storage
   - Text-to-speech generation
   - Voice session management

5. **Memory Service** (`/memory`) - Port 3004
   - Dual RAG system (Vector + Graph)
   - ChromaDB for vector storage
   - Neo4j for relationship graphs
   - Contradiction detection
   - Context retrieval

6. **Narrative Analysis** (`/narrative-analysis`) - Port 3005
   - Story structure detection
   - Character development tracking
   - Theme analysis
   - Writing craft suggestions
   - Cultural sensitivity checks

7. **Document Export** (`/document-export`) - Port 3006
   - Export to Word, PDF, ePub
   - Formatting preservation
   - Batch export support
   - Template management

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Quick Start

1. **Clone and setup:**
   ```bash
   # Copy environment variables
   cp .env.example .env
   # Update .env with your API keys
   ```

2. **Start services:**
   ```bash
   # Using the helper script
   ./scripts/dev.sh
   
   # Or manually with Docker Compose
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

3. **Run migrations:**
   ```bash
   docker-compose exec api npm run db:migrate
   ```

### Development

Each service can be developed independently:

```bash
# Work on a specific service
cd services/api
npm install
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific service
cd services/api && npm test
```

## API Documentation

The API Gateway exposes the following endpoints:

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Documents
- `GET /api/documents`
- `POST /api/documents`
- `GET /api/documents/:id`
- `PUT /api/documents/:id`
- `DELETE /api/documents/:id`

### Voice
- `POST /api/voice/upload`
- `POST /api/voice/session/start`
- `GET /api/voice/recordings/:id`
- `GET /api/voice/recordings/:id/transcript`

### AI Conversations
- `POST /api/ai/conversations`
- `GET /api/ai/conversations/:id`
- `POST /api/ai/conversations/:id/messages`
- `POST /api/ai/assist/continue`

### WebSocket Events
- `voice:start` - Start voice streaming
- `voice:data` - Voice data chunk
- `transcript:partial` - Partial transcription
- `transcript:final` - Final transcription
- `ai:response` - AI response

## Configuration

### Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `NODE_ENV` - development/production
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT signing secret
- AI service API keys
- Voice service API keys

### Ports

Default development ports:
- API Gateway: 3000
- Auth Service: 3001
- AI Orchestrator: 3002
- Voice Processing: 3003
- Memory Service: 3004

## Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
```

### Kubernetes

Kubernetes manifests are in `/infrastructure/kubernetes/`

```bash
kubectl apply -f infrastructure/kubernetes/
```

## Monitoring

- Health checks: `GET /health` on each service
- Metrics: Prometheus-compatible `/metrics` endpoint
- Logs: Structured JSON logging with Winston
- Tracing: OpenTelemetry support

## Security

- JWT-based authentication
- Rate limiting on all endpoints
- Input validation with express-validator
- SQL injection protection
- XSS protection with helmet
- CORS configuration
- File upload restrictions