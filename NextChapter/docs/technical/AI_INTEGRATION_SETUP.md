# AI Coach Integration Setup

## Overview
This document describes the setup of the OpenAI integration for the AI Coach feature in the Next Chapter app.

## Installation

To complete the AI integration setup, you need to install the OpenAI SDK:

```bash
npm install openai
```

## Configuration

### API Key Management
The AI Coach uses secure storage for the OpenAI API key. Users will need to:

1. Obtain an OpenAI API key from https://platform.openai.com/api-keys
2. Configure it in the app's settings screen
3. The key is stored securely using `react-native-keychain`

### Environment Setup
No environment variables are needed - the app manages API keys through secure storage.

## Architecture

### Service Structure
```
src/services/ai/
├── openai.ts          # OpenAI client initialization
├── coachPrompts.ts    # Tone-specific prompts and triggers
├── coachService.ts    # Main coach logic and tone detection
├── apiKeyManager.ts   # Secure API key management
├── config.ts          # Configuration constants
└── index.ts           # Exports
```

### Key Features

1. **Tone Detection**
   - Hype: For users feeling hopeless, lost, worthless
   - Tough-Love: For users making excuses or blaming others
   - Pragmatist: Default tone for practical guidance

2. **Safety Features**
   - Crisis intervention detection and response
   - Professional boundary enforcement
   - Content moderation using OpenAI's moderation API
   - Financial data protection (never sent to AI)

3. **Rate Limiting**
   - Free tier: 10 messages per day
   - Pro tier: Unlimited messages
   - Tracked using AsyncStorage

4. **Offline Support**
   - Fallback responses for common scenarios
   - Graceful degradation when offline

## Usage

### In Components
```typescript
import { useCoach } from '@hooks/useCoach';

function CoachChatScreen() {
  const { sendMessage, isLoading, error, conversation } = useCoach();
  
  const handleSend = async (message: string) => {
    await sendMessage(message);
  };
  
  // Render UI...
}
```

### Testing
Run the AI integration tests:
```bash
npm test src/services/ai/__tests__
```

## Security Considerations

1. **API Key Storage**: Keys are stored in the device's secure keychain
2. **Data Privacy**: No financial data is ever sent to OpenAI
3. **Content Moderation**: All inputs and outputs are moderated
4. **Rate Limiting**: Prevents abuse and manages costs

## Performance

- Target response time: <5 seconds (P90)
- Token limit: 4000 tokens per exchange
- Context window: Last 10 messages

## Next Steps

1. Install the OpenAI package: `npm install openai`
2. Configure API key in app settings
3. Test the coach functionality
4. Monitor usage and adjust rate limits as needed