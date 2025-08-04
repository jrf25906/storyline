# AI Orchestrator Service

Core AI service that manages conversations, personas, and multi-provider AI interactions for Storyline.

## Features

- **Multi-Provider Support**: Seamless switching between OpenAI and Anthropic
- **Persona Management**: Pre-configured AI personas for different writing contexts
- **Conversation Management**: Stateful conversation tracking with history
- **Real-time Streaming**: WebSocket-based streaming responses
- **Intelligent Routing**: Automatic provider and model selection based on context
- **Token Management**: Token counting and usage tracking

## Personas

### Default Personas

1. **Empathetic Guide**: Emotional support and active listening
2. **Creative Muse**: Story development and creative writing
3. **Memoir Companion**: Personal memory exploration
4. **Analytical Coach**: Non-fiction and professional writing

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

### Conversation Routes
- `POST /conversation` - Create new conversation
- `GET /conversation/:id` - Get conversation by ID
- `GET /conversation` - List user conversations
- `POST /conversation/:id/turn` - Add message to conversation
- `POST /conversation/:id/summarize` - Summarize conversation
- `DELETE /conversation/:id` - Delete conversation

### Persona Routes
- `GET /persona` - List all personas
- `GET /persona/:id` - Get persona by ID
- `POST /persona/select` - Select persona for context
- `GET /persona/default` - Get default persona

### Completion Routes
- `POST /completion` - One-off AI completion
- `POST /completion/tokens` - Count tokens in text
- `GET /completion/providers` - List available providers
- `GET /completion/health` - Provider health check

### Streaming Routes
- `GET /streaming/info` - WebSocket connection info
- `GET /streaming/session/:id` - Get session info
- `GET /streaming/sessions/count` - Active sessions count

## WebSocket Protocol

Connect to WebSocket endpoint for real-time streaming:

```javascript
const ws = new WebSocket('ws://localhost:3004');

// Start session
ws.send(JSON.stringify({
  type: 'start',
  userId: 'user123',
  personaId: 'empathetic-guide',
  provider: 'anthropic' // optional
}));

// Send message
ws.send(JSON.stringify({
  type: 'message',
  content: 'Tell me about your day'
}));

// Receive chunks
ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'chunk') {
    console.log(message.content);
  }
});
```

## Provider Selection Logic

### Model Selection
- **OpenAI GPT-4o**: Complex emotional conversations, high creativity
- **OpenAI GPT-4o-mini**: Simple tasks, fast responses
- **Claude 3.5 Sonnet**: Emotional intelligence, creative writing
- **Claude 3 Opus**: Complex reasoning, analytical tasks
- **Claude 3 Haiku**: Fast, simple responses

### Automatic Routing
- Emotional content → Claude (preferred) or GPT-4o
- Creative writing → Claude Sonnet or GPT-4o
- Analytical tasks → Claude Opus or GPT-4o
- Simple queries → Claude Haiku or GPT-4o-mini

## Environment Variables

- `PORT`: Service port (default: 3004)
- `REDIS_HOST/PORT`: Redis connection for conversation storage
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `ALLOWED_ORIGINS`: CORS allowed origins
- `LOG_LEVEL`: Logging level (info, debug, error)