# Storyline Mobile App

Voice-first book writing application built with React Native and TypeScript.

## Folder Structure

```
src/
├── assets/                     # Static assets (images, fonts, etc.)
├── components/                 # Reusable UI components
│   ├── UI/                    # Basic UI components
│   │   ├── Button/            # Button variants
│   │   ├── Input/             # Input field components
│   │   ├── Modal/             # Modal components
│   │   ├── Card/              # Card components
│   │   └── Loading/           # Loading indicators
│   ├── Voice/                 # Voice-specific components
│   │   ├── Recorder/          # Voice recording interface
│   │   ├── Visualizer/        # Audio waveform visualization
│   │   ├── Controls/          # Voice control buttons
│   │   └── Transcript/        # Voice transcript display
│   ├── 3D/                    # 3D interface components
│   │   ├── Scene/             # 3D scene setup
│   │   ├── Models/            # 3D models
│   │   └── Animation/         # 3D animations
│   ├── Safety/                # Emotional safety components
│   │   ├── CrisisDetection/   # Crisis detection UI
│   │   ├── EmotionalSupport/  # Emotional support interfaces
│   │   └── Boundaries/        # User boundary controls
│   └── Navigation/            # Navigation components
│       ├── TabBar/            # Bottom tab navigation
│       ├── Header/            # Screen headers
│       └── Drawer/            # Drawer navigation
├── design-system/             # Design system and theming
│   ├── tokens.ts              # Design tokens (colors, spacing, etc.)
│   ├── ThemeProvider.tsx      # Theme context provider
│   ├── index.ts               # Design system exports
│   └── components/            # Design system components
│       ├── Button/            # Base button component
│       ├── Input/             # Base input component
│       ├── Typography/        # Typography components
│       ├── Layout/            # Layout components
│       └── Feedback/          # Feedback components
├── screens/                   # Screen components
│   ├── Auth/                  # Authentication screens
│   ├── Voice/                 # Voice recording/editing screens
│   ├── Writing/               # Text writing/editing screens
│   ├── Memory/                # Memory/context management screens
│   ├── Settings/              # App settings screens
│   └── Onboarding/            # User onboarding screens
├── navigation/                # Navigation configuration
│   ├── navigators/            # Navigation stack definitions
│   └── types/                 # Navigation type definitions
├── hooks/                     # Custom React hooks
│   ├── voice/                 # Voice-related hooks
│   ├── memory/                # Memory/context hooks
│   ├── navigation/            # Navigation hooks
│   ├── theme/                 # Theme hooks
│   └── safety/                # Safety-related hooks
├── services/                  # API and external service integrations
│   ├── api/                   # REST API client
│   ├── voice/                 # Voice processing services
│   ├── memory/                # Memory management services
│   ├── auth/                  # Authentication services
│   └── analytics/             # Analytics services
├── utils/                     # Utility functions
│   ├── voice/                 # Voice processing utilities
│   ├── memory/                # Memory utilities
│   ├── validation/            # Form validation utilities
│   ├── formatting/            # Text formatting utilities
│   └── safety/                # Safety and crisis detection utilities
├── types/                     # TypeScript type definitions
├── constants/                 # App constants and configuration
└── index.ts                   # Main exports

```

## Design Principles

### Voice-First Design
- All interfaces prioritize voice interaction
- Visual components support voice commands
- Real-time audio feedback and visualization
- Accessibility for voice-only usage

### Emotional Safety
- Trauma-informed design patterns
- Crisis detection and support systems
- User boundary respect and consent
- Professional resource integration

### Performance
- Optimized for real-time voice processing
- Efficient memory management for long conversations
- Smooth 3D interface performance
- Minimal latency in voice feedback

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Development Guidelines

1. **Component Organization**: Keep components focused and reusable
2. **Theme Usage**: Always use design tokens from the design system
3. **Voice Integration**: Consider voice interaction in all UI components
4. **Safety First**: Implement emotional safety checks in user-facing features
5. **Performance**: Optimize for real-time voice processing requirements

## Key Features

- **Real-time Voice Recording**: Sub-200ms latency voice processing
- **3D Interface**: Immersive 3D environment for creative writing
- **Emotional Safety**: Crisis detection and trauma-informed responses
- **Memory System**: Context-aware conversation continuity
- **Multi-modal Input**: Voice, text, and gesture support

## Architecture Notes

This mobile app integrates with the Storyline backend services:
- AI Orchestrator for conversation management
- Voice Processing for real-time transcription
- Memory Service for context management
- Narrative Analysis for story structure

See the main project documentation for complete system architecture.