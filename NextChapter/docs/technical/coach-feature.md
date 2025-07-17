# AI Coach Feature Documentation

## Overview
The AI Coach feature provides emotional support and practical guidance to users during their job search journey. It uses OpenAI's GPT-4o-mini model with adaptive tone switching based on the user's emotional state.

## Key Features

### 1. Adaptive Tone System
The coach automatically detects the user's emotional state and switches between three tones:

- **Hype Mode**: Encouraging and energetic responses for users feeling hopeless or burnt out
- **Pragmatist Mode**: Practical, step-by-step guidance (default)
- **Tough-Love Mode**: Direct and challenging responses for users stuck in blame patterns

### 2. Crisis Intervention
- Detects crisis keywords and immediately provides mental health resources
- Shows 988 Suicide & Crisis Lifeline information
- Prevents harmful content from being processed by the AI

### 3. Rate Limiting
- Free tier: 10 messages per day
- Resets at midnight local time
- Visual indicators show remaining messages
- Pro upgrade prompts when limit is reached

### 4. Privacy & Security
- Messages stored locally by default
- Optional encrypted cloud sync
- Financial data never sent to AI
- SSN and credit card patterns automatically masked
- Professional boundaries enforced (no medical/financial advice)

### 5. Accessibility
- Full VoiceOver/TalkBack support
- High-contrast mode compatible
- Minimum 48x48dp touch targets
- Screen reader announcements for all state changes
- WCAG 2.1 AA compliant

## Implementation Details

### Component Structure
```
src/
├── screens/main/
│   └── CoachScreen.tsx          # Main chat interface
├── components/coach/
│   ├── MessageBubble.tsx        # Individual message display
│   ├── MessageInput.tsx         # Text input with send button
│   ├── CoachHeader.tsx          # Header with settings/clear
│   └── CoachSettings.tsx        # Settings modal
├── stores/
│   └── coachStore.ts            # Zustand store for state
├── services/
│   ├── api/
│   │   └── openai.ts           # OpenAI integration
│   └── database/
│       └── coachService.ts      # Supabase sync
└── types/
    └── coach.ts                 # TypeScript types
```

### Tone Detection Logic
```typescript
// Emotional triggers defined in types/coach.ts
EMOTIONAL_TRIGGERS = {
  hype: ['hopeless', 'lost', 'worthless', 'failure', 'burnt out'],
  'tough-love': ['lazy', 'they screwed me', 'no one will hire me'],
  crisis: ['suicide', 'kill myself', 'end it all']
}
```

### Storage Strategy
1. **Local Storage** (AsyncStorage)
   - Last 25 messages cached
   - Daily message count
   - Cloud sync preference

2. **Cloud Storage** (Supabase)
   - Optional sync for cross-device access
   - Row-level security enabled
   - Encrypted at rest

### API Integration
- Model: gpt-4o-mini (cost-efficient)
- Max tokens: 500 per response
- Temperature: 0.7
- Context: Last 10 messages sent to API

## Usage Guidelines

### For Users
1. Start conversations with how you're feeling
2. Be specific about challenges you're facing
3. Use crisis resources if feeling overwhelmed
4. Enable cloud sync for multi-device access

### For Developers
1. Test all three tone modes thoroughly
2. Verify crisis detection is working
3. Check accessibility with screen readers
4. Monitor token usage for cost control
5. Test offline behavior

## Testing

### Unit Tests
- `openai.test.ts`: Tone detection, crisis handling, moderation
- `coachStore.test.ts`: State management, rate limiting

### Manual Testing Checklist
- [ ] Send message triggering each tone
- [ ] Test crisis keyword detection
- [ ] Verify rate limiting at 10 messages
- [ ] Test message persistence after app restart
- [ ] Check accessibility with VoiceOver/TalkBack
- [ ] Test cloud sync on/off
- [ ] Verify sensitive data masking

## Performance Considerations
- Lazy load coach screen components
- Limit conversation history to 25 messages
- Use React.memo for message bubbles
- Debounce typing indicators
- Cache common responses offline

## Future Enhancements
1. Voice input/output
2. Suggested quick responses
3. Daily check-in reminders
4. Export conversation history
5. Custom tone preferences
6. Integration with job tracker

## Compliance
- GDPR: One-tap data deletion
- CCPA: Clear privacy policy
- HIPAA: Not medical advice disclaimer
- SOC 2: Encrypted data transmission