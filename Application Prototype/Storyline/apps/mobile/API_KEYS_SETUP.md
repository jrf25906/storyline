# API Keys Setup Guide for Storyline

## Quick Start (Minimum Required)

To get the app working with basic voice transcription, you only need:

### 1. AssemblyAI (Required for Speech-to-Text)
- **Website**: https://www.assemblyai.com/
- **Sign up**: Free tier includes 5 hours of transcription
- **Get Key**: Dashboard → API Keys
- **Add to .env**: `EXPO_PUBLIC_ASSEMBLYAI_API_KEY=your_actual_key_here`

## Full Feature API Keys

### 2. OpenAI (For Conversational AI)
- **Website**: https://platform.openai.com/api-keys
- **Cost**: Pay-per-use (GPT-4 ~$0.03/1K tokens)
- **Features**: Conversational AI, Realtime API
- **Add to .env**: `EXPO_PUBLIC_OPENAI_API_KEY=your_actual_key_here`

### 3. Firebase (For Authentication & Database)
- **Website**: https://console.firebase.google.com/
- **Cost**: Free tier very generous
- **Setup**: Create project → Project Settings → General → Web app
- **Features**: User auth, real-time database, cloud storage
- **Add to .env**: Multiple Firebase config values

### 4. Alternative Options

#### Anthropic Claude (Alternative to OpenAI)
- **Website**: https://console.anthropic.com/
- **Features**: Advanced reasoning, safety-focused

#### Deepgram (Alternative to AssemblyAI)
- **Website**: https://console.deepgram.com/
- **Features**: Low-latency speech-to-text, TTS

#### Supabase (Alternative to Firebase)
- **Website**: https://app.supabase.com/
- **Features**: Open-source backend, PostgreSQL

## Setup Priority

### Phase 1 (Basic Voice Recording)
1. ✅ **AssemblyAI** - Get this first for transcription
2. **Test the app** - Record and transcribe your voice

### Phase 2 (Conversational AI)
3. **OpenAI** - For AI writing assistance
4. **Firebase/Supabase** - For user accounts

### Phase 3 (Advanced Features)
5. **Chroma DB** - For memory/story organization
6. **Analytics** - For usage tracking

## Testing Without API Keys

The app will work without API keys, but with limited functionality:
- ✅ Voice recording and playback
- ✅ Audio visualization
- ❌ Speech-to-text transcription
- ❌ AI conversations

## Cost Estimates (Monthly)

- **AssemblyAI**: $0-15 (5 hours free, then $0.37/hour)
- **OpenAI**: $10-50 (depending on usage)
- **Firebase**: $0-25 (free tier covers most usage)
- **Total**: ~$20-90/month for active development

## Quick Commands

After adding your API keys:

```bash
# Test the app
npm run ios     # or npm run android

# Check if keys are loaded
console.log(process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY)
```

## Security Notes

- ✅ `.env` file is in `.gitignore` (won't be committed)
- ✅ All keys use `EXPO_PUBLIC_` prefix (client-side only)
- ⚠️ These keys will be bundled in the app
- 🔒 For production, use server-side proxy for sensitive operations