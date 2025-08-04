# Storyline Mobile App Setup Guide

## Prerequisites

- Node.js 18+
- React Native development environment
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- AssemblyAI API key (for speech-to-text)

## Quick Start

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `apps/mobile` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# AssemblyAI API Configuration
EXPO_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# OpenAI Configuration (for future use)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Environment
EXPO_PUBLIC_ENV=development
```

### 3. Start the Development Server

```bash
# Start Expo development server
npm start

# Or run directly on specific platform
npm run ios     # For iOS
npm run android # For Android
```

## Features Implemented

✅ **Voice Recording**
- High-quality audio recording with expo-av
- Real-time metering for visualization
- Recording playback functionality

✅ **Audio Visualization**
- Real-time waveform visualization during recording
- Animated bars showing audio levels
- SVG-based smooth waveforms

✅ **Speech-to-Text (AssemblyAI)**
- Automatic transcription after recording
- Sentiment analysis
- Summary generation
- Word-level confidence scores

✅ **UI/UX**
- Light/dark theme support
- Trauma-informed safe space indicators
- Emotional support resources
- Recent recordings history

## API Keys Setup

### AssemblyAI
1. Sign up at [AssemblyAI](https://www.assemblyai.com/)
2. Get your API key from the dashboard
3. Add to `.env` file

### OpenAI (Coming Soon)
- Will be used for conversational AI features
- Real-time voice conversations

## Testing Voice Features

1. **Grant Permissions**: The app will request microphone permissions on first use
2. **Record Audio**: Tap the microphone button to start recording
3. **Stop Recording**: Tap again to stop and automatically transcribe
4. **View Transcription**: See the transcribed text with sentiment analysis
5. **Playback**: Tap any recording in the history to play it back

## Troubleshooting

### iOS Simulator Issues
- Voice recording works in iOS Simulator but quality may vary
- For best testing, use a physical device

### Android Permissions
- Ensure microphone permissions are granted in device settings
- Some Android devices may require additional audio settings

### API Key Issues
- Verify your AssemblyAI API key is correct
- Check API usage limits on your AssemblyAI dashboard
- Ensure the `.env` file is in the correct location

## Development Workflow

### Adding New Features
1. Create components in `src/components/`
2. Add services in `src/services/`
3. Update types in component files or create type definitions
4. Test on both iOS and Android

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Modular service architecture
- Trauma-informed design patterns

## Next Steps

- [ ] Integrate OpenAI Realtime API for conversational AI
- [ ] Add Firebase/Supabase for user authentication
- [ ] Implement memory system with vector storage
- [ ] Add chapter/scene organization
- [ ] Export functionality for completed stories

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [AssemblyAI Docs](https://www.assemblyai.com/docs)
- [React Native Voice](https://github.com/react-native-voice/voice)
- [Project Implementation Plan](../../STORYLINE_IMPLEMENTATION_PLAN.md)