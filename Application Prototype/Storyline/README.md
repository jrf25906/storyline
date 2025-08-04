# Storyline

> AI-powered voice memoir platform that enables authors to write books through natural conversation

## Overview

Storyline is an audio-first book writing application that leverages advanced AI to help users create compelling memoirs and narratives through voice interaction. The platform combines real-time speech processing, conversational AI, and emotional intelligence to provide a supportive writing experience for personal storytelling.

## Key Features

- **Voice-First Writing**: Record thoughts and stories naturally through conversation
- **AI Writing Partner**: Conversational AI assistant for brainstorming and emotional support
- **Real-Time Transcription**: High-accuracy speech-to-text with emotional context and offline support
- **Smart Organization**: Automatic chapter and scene organization
- **Memory System**: Contradiction-aware narrative memory with privacy-preserving encryption
- **Export Capabilities**: Multiple format support with cryptographic provenance watermarks (C2PA)
- **Emotional Safety**: Trauma-informed AI responses and crisis detection
- **AI Governance**: Comprehensive prompt registry, bias monitoring, and regulatory compliance
- **Accessibility**: WCAG 2.2 AA compliance with real-time captions and keyboard navigation
- **Privacy**: Multi-region data residency and voice-cloning consent management
- **Performance**: Mobile-optimized with battery budgets and adaptive optimization
- **Sustainability**: Carbon footprint tracking with green inference options

## Technology Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **WebRTC** - Real-time audio streaming
- **Redux Toolkit** - State management

### Backend
- **Node.js + Express** - API services
- **Microservices Architecture** - Scalable service design
- **WebSocket** - Real-time communication
- **PostgreSQL** - Primary database

### AI Services
- **OpenAI Realtime API** - Conversational AI
- **Claude 3.5 Sonnet** - Writing assistance
- **AssemblyAI Universal-Streaming** - Speech-to-text
- **Deepgram Aura-2** - Text-to-speech
- **Chroma DB** - Vector memory storage

### Infrastructure
- **Kubernetes** - Container orchestration with multi-region support
- **Docker** - Containerization with devcontainer setup
- **Terraform** - Infrastructure as code with multi-region deployment
- **Prometheus/Grafana** - Monitoring with AI governance dashboards
- **OpenTelemetry** - Distributed tracing and AI observability
- **FinOps Dashboards** - Real-time cost monitoring and anomaly detection

## Project Structure

```
storyline/
├── apps/                    # Applications
│   ├── mobile/             # React Native app
│   └── web/                # Web dashboard (future)
├── services/               # Backend microservices
│   ├── api/                # Main REST API
│   ├── ai-orchestrator/    # AI service coordination with governance
│   ├── auth/               # Authentication service
│   ├── memory/             # Memory management with encryption
│   ├── voice-processing/   # Voice pipeline with consent management
│   ├── gateway/            # API Gateway with cost controls
│   ├── data-residency/     # Multi-region data management
│   └── sustainability/     # Carbon footprint tracking
├── packages/               # Shared libraries
│   ├── design-system/      # UI components with accessibility
│   ├── voice-sdk/          # Voice processing SDK with offline support
│   ├── ai-client/          # AI service client with governance
│   ├── performance-monitor/ # Mobile performance monitoring
│   ├── sustainability/     # Carbon footprint utilities
│   └── shared-types/       # TypeScript definitions
├── tools/                  # Development tools
├── tests/                  # Comprehensive testing
├── infrastructure/         # Infrastructure as code
├── docs/                   # Documentation
├── assets/                 # Static assets
└── config/                 # Configuration files
```

## Quick Start

### Prerequisites
- Node.js 18+
- React Native development environment
- Docker and Docker Compose
- Kubernetes cluster (for production)

### Development Setup

#### Option 1: DevContainer (Recommended)
1. **Clone and start with DevContainer**
   ```bash
   git clone <repository-url>
   cd storyline
   # Use Tiltfile to spin up all services with one command
   tilt up
   ```

#### Option 2: Manual Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd storyline
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp config/env/.env.example config/env/.env.development
   # Edit .env.development with your API keys
   # Set up AI governance configurations
   cp config/ai-services/prompt-registry.yaml.example config/ai-services/prompt-registry.yaml
   ```

4. **Start development services with monitoring**
   ```bash
   docker-compose -f infrastructure/docker/compose/development.yml up -d
   # This includes OpenTelemetry, FinOps dashboards, and governance monitoring
   ```

5. **Run the mobile app**
   ```bash
   cd apps/mobile
   npm run ios    # for iOS
   npm run android # for Android
   ```

## Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `hotfix/*` - Critical fixes

### Testing
```bash
# Run all tests
npm run test

# Voice accuracy testing
npm run test:voice

# AI quality testing
npm run test:ai-quality

# Emotional safety testing
npm run test:safety

# Bias detection testing
npm run test:bias

# Accessibility compliance testing
npm run test:accessibility

# Mobile performance budget testing
npm run test:performance:mobile

# Documentation testing and validation
npm run test:docs
```

### Building
```bash
# Build all packages
npm run build

# Build specific service
npm run build:api
npm run build:mobile
```

## Documentation

- **[Product Requirements](docs/product/prd.md)** - Product specifications and features
- **[Technical Architecture](docs/technical/architecture.md)** - System architecture overview
- **[API Documentation](docs/technical/api/)** - API endpoints and usage
- **[Testing Strategy](docs/testing/strategy.md)** - Comprehensive testing approach
- **[Project Structure](PROJECT_STRUCTURE.md)** - Detailed folder organization

## Key Documentation Files

### Product
- [Product Vision](docs/product/vision.md)
- [Business Model](docs/product/business-model.md)
- [Go-to-Market Strategy](docs/product/go-to-market.md)

### Technical
- [Memory System](docs/technical/memory-system.md)
- [Voice Processing](docs/technical/voice-processing.md)
- [Tech Recommendations](docs/technical/tech-recommendations.md)

### Design
- [Brand Guide](docs/design/brand-guide.md)
- [UX/UI Specifications](docs/design/ux-ui-spec.md)
- [Voice Personas](docs/design/voice-personas.md)

### Security & Privacy
- [Privacy Specifications](docs/security/privacy-spec.md)
- [Content Moderation](docs/security/content-moderation.md)

## Deployment

### Development Environment
```bash
npm run deploy:dev
```

### Staging Environment
```bash
npm run deploy:staging
```

### Production Environment
```bash
npm run deploy:prod
```

## Monitoring & Observability

- **Application Metrics**: Grafana dashboards with AI governance monitoring
- **AI Service Health**: Custom dashboards for AI service performance and bias detection
- **Voice Quality**: Real-time voice processing metrics with accessibility features
- **User Safety**: Emotional safety protocol monitoring and crisis detection
- **Cost Monitoring**: FinOps dashboards with anomaly alerts for >20% cost deltas
- **Performance Budgets**: Mobile battery, CPU, and memory usage tracking
- **Compliance Monitoring**: EU AI Act compliance and transparency reporting
- **Carbon Footprint**: CO₂ tracking per 10k tokens with green inference options
- **Documentation Health**: Automated link validation and code example testing

## Contributing

1. Review the [Project Structure](PROJECT_STRUCTURE.md) documentation
2. Follow the established development workflow
3. Ensure all tests pass before submitting PRs
4. Update documentation for any API changes

## Security & Privacy

This application handles sensitive personal content. Please review:
- [Privacy Specifications](docs/security/privacy-spec.md)
- [Content Moderation Policy](docs/security/content-moderation.md)
- Development security guidelines in `/docs/security/`

## License

[License information to be added]

## Support

For technical support and questions:
- Documentation: `/docs/`
- Issues: [GitHub Issues]
- Technical Architecture: [docs/technical/architecture.md](docs/technical/architecture.md)

---

*Storyline - Empowering authentic storytelling through the power of voice and AI*