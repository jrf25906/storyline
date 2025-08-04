# Storyline Project Structure Documentation

**Version:** 1.0  
**Date:** July 26, 2025  
**Status:** Implementation Ready

---

## Overview

This document defines the comprehensive folder structure for the Storyline AI-powered voice memoir platform. The structure follows monorepo patterns to support parallel development across multiple teams while maintaining clear separation of concerns for a complex system involving React Native mobile apps, backend services, AI integrations, and real-time voice processing.

## Design Principles

### 1. **Monorepo Architecture**
- Single repository containing all project components
- Shared dependencies and consistent tooling
- Simplified CI/CD and deployment coordination
- Enhanced code sharing between frontend and backend

### 2. **Clear Separation of Concerns**
- **Apps**: End-user applications (mobile, future web)
- **Services**: Backend microservices and APIs
- **Packages**: Shared libraries and SDKs
- **Tools**: Development utilities and scripts
- **Tests**: Comprehensive testing suites
- **Infrastructure**: Deployment and monitoring configs

### 3. **Scalability-First Design**
- Supports the technical architecture's microservices approach
- Accommodates team growth from 2-3 developers to 15+ person team
- Enables independent deployment of services
- Facilitates A/B testing and feature flagging

### 4. **AI-Native Organization**
- Dedicated AI service orchestration structure
- Specialized voice processing pipeline organization
- Memory system with privacy-preserving architecture
- Comprehensive testing for AI conversation quality

---

## Top-Level Structure

```
storyline/
├── apps/                    # Applications (mobile, web dashboard)
├── services/                # Backend microservices
├── packages/                # Shared libraries and SDKs
├── tools/                   # Development and operational tools
├── tests/                   # Integration and specialized testing
├── infrastructure/          # Infrastructure as Code
├── docs/                    # All project documentation
├── assets/                  # Static assets (brand, audio, templates)
│   └── dev-fixtures/        # Pre-seeded sample voice fixtures for development
├── config/                  # Configuration files
│   ├── ai-services/         # AI provider configurations and prompt registry
│   │   └── prompt-registry.yaml # Versioned prompt management
│   ├── env/                 # Environment-specific settings
│   ├── feature-flags/       # Feature flag configurations
│   └── compliance/          # Regulatory compliance configurations
└── .github/                 # CI/CD workflows and templates
```

---

## Detailed Structure Specifications

### `/apps` - Applications Layer

**Purpose**: Contains all end-user facing applications

```
apps/
├── mobile/                  # React Native application
│   ├── android/             # Android-specific configuration
│   ├── ios/                 # iOS-specific configuration
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── voice/       # Voice interface components
│   │   │   ├── chat/        # Text chat interface
│   │   │   ├── memory/      # Memory management UI
│   │   │   ├── writing/     # Writing tools and editors
│   │   │   └── common/      # Shared UI components
│   │   ├── screens/         # App screens/pages
│   │   │   ├── auth/        # Authentication screens
│   │   │   ├── recording/   # Voice recording interface
│   │   │   ├── conversation/# AI conversation screens
│   │   │   ├── writing/     # Writing and editing screens
│   │   │   └── settings/    # User settings and preferences
│   │   ├── navigation/      # App navigation configuration
│   │   ├── services/        # Client-side service integrations
│   │   │   ├── voice/       # Voice processing services
│   │   │   ├── ai/          # AI service client wrappers
│   │   │   ├── memory/      # Memory management clients
│   │   │   └── auth/        # Authentication services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Client-side utilities
│   │   ├── types/           # TypeScript type definitions
│   │   └── constants/       # App constants and configuration
│   ├── __tests__/           # Unit and component tests
│   ├── e2e/                 # End-to-end testing suite
│   └── package.json
└── web/                     # Future web dashboard (Phase 4+)
    ├── src/                 # Web application source
    ├── public/              # Static web assets
    └── package.json
```

### `/services` - Backend Services Layer

**Purpose**: Microservices implementing the backend architecture

```
services/
├── api/                     # Main REST API service
│   ├── src/
│   │   ├── routes/          # Express.js route definitions
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── users/       # User management endpoints
│   │   │   ├── projects/    # Writing project endpoints
│   │   │   └── conversations/ # Conversation history endpoints
│   │   ├── middleware/      # Express middleware
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Data models and schemas
│   │   └── utils/           # Service utilities
│   ├── tests/               # Service-specific tests
│   └── package.json
├── ai-orchestrator/         # AI service coordination
│   ├── src/
│   │   ├── providers/       # AI service provider abstractions
│   │   │   ├── openai/      # OpenAI Realtime API integration
│   │   │   ├── claude/      # Claude 3.5 Sonnet integration
│   │   │   ├── assemblyai/  # AssemblyAI Universal-Streaming
│   │   │   └── deepgram/    # Deepgram Aura-2 TTS
│   │   ├── conversation/    # Conversation flow management
│   │   ├── safety/          # Emotional safety protocols
│   │   ├── routing/         # Intelligent AI service routing
│   │   ├── governance/      # AI governance and prompt registry
│   │   │   ├── prompt-registry/ # Versioned prompt management
│   │   │   ├── model-cards/     # AI system documentation
│   │   │   └── compliance/      # EU AI Act compliance
│   │   └── observability/   # AI telemetry and monitoring
│   │       ├── telemetry/   # OpenTelemetry integration
│   │       ├── bias-detection/ # Bias monitoring system
│   │       └── cost-tracking/  # Cost monitoring and alerts
│   └── package.json
├── auth/                    # Authentication and authorization
│   ├── src/
│   │   ├── strategies/      # Auth strategies (JWT, OAuth, etc.)
│   │   ├── middleware/      # Auth middleware
│   │   └── models/          # User and session models
│   └── package.json
├── memory/                  # Memory and context management
│   ├── src/
│   │   ├── chroma/          # Vector database integration
│   │   │   ├── encrypted/   # Encrypted index operations
│   │   │   ├── vpc/         # Private VPC configuration
│   │   │   └── tenant/      # Multi-tenant isolation
│   │   ├── context/         # Context retrieval algorithms
│   │   ├── privacy/         # Privacy-preserving features
│   │   ├── versioning/      # Memory version control
│   │   └── migrations/      # Schema migration system
│   └── package.json
├── voice-processing/        # Real-time voice pipeline
│   ├── src/
│   │   ├── streaming/       # WebRTC streaming management
│   │   ├── transcription/   # Real-time speech-to-text
│   │   │   ├── cloud/       # Cloud-based STT services
│   │   │   └── offline/     # On-device Whisper-tiny
│   │   ├── synthesis/       # Real-time text-to-speech
│   │   ├── quality/         # Audio quality optimization
│   │   └── voice-cloning/   # Voice cloning with consent
│   │       ├── licensing/   # Voice licensing system
│   │       └── signatures/  # Cryptographic signatures
│   └── package.json
├── gateway/                 # API Gateway with cost controls
│   ├── src/
│   │   ├── rate-limiting/   # Token and minute quotas
│   │   ├── cost-monitoring/ # Real-time cost tracking
│   │   ├── feature-flags/   # Feature flag integration
│   │   └── analytics/       # Usage analytics
│   └── package.json
├── data-residency/          # Multi-region data management
│   ├── src/
│   │   ├── region-router/   # Per-project region selection
│   │   ├── replication/     # Encrypted chunk replication
│   │   └── compliance/      # Regional compliance validation
│   └── package.json
└── sustainability/          # Carbon footprint tracking
    ├── src/
    │   ├── carbon-tracking/ # CO₂ per token monitoring
    │   ├── green-inference/ # Optimized inference routing
    │   └── reporting/       # Sustainability reporting
    └── package.json
```

### `/packages` - Shared Libraries

**Purpose**: Reusable code shared across applications and services

```
packages/
├── design-system/           # UI components and design tokens
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── tokens/          # Design tokens (colors, typography)
│   │   │   └── accessibility/ # WCAG 2.2 AA contrast tokens
│   │   ├── themes/          # Theme definitions
│   │   └── icons/           # Icon components
│   └── package.json
├── voice-sdk/               # Voice processing SDK
│   ├── src/
│   │   ├── capture/         # Audio capture utilities
│   │   ├── streaming/       # Real-time audio streaming
│   │   ├── processing/      # Audio processing algorithms
│   │   ├── formats/         # Audio format handling
│   │   ├── offline/         # On-device processing (Whisper-tiny)
│   │   └── accessibility/   # Real-time captions and accessibility
│   └── package.json
├── ai-client/               # AI service client library
│   ├── src/
│   │   ├── providers/       # AI provider abstractions
│   │   ├── types/           # Shared AI service types
│   │   ├── utils/           # AI utility functions
│   │   ├── safety/          # Safety validation utilities
│   │   ├── feature-flags/   # LaunchDarkly/OpenFeature wrapper
│   │   ├── governance/      # Prompt registry and compliance
│   │   └── bias-detection/  # Bias testing utilities
│   └── package.json
├── memory-client/           # Memory system client
│   ├── src/
│   │   ├── api/             # Memory API client
│   │   ├── cache/           # Local caching strategies
│   │   ├── types/           # Memory-related types
│   │   ├── encryption/      # Client-side encryption utilities
│   │   └── privacy/         # Privacy-preserving operations
│   └── package.json
├── shared-types/            # Shared TypeScript definitions
│   ├── src/
│   │   ├── api/             # API contract types
│   │   ├── voice/           # Voice processing types
│   │   ├── memory/          # Memory system types
│   │   ├── user/            # User and auth types
│   │   ├── governance/      # AI governance types
│   │   └── compliance/      # Regulatory compliance types
│   └── package.json
├── performance-monitor/     # Mobile performance monitoring
│   ├── src/
│   │   ├── battery/         # Battery usage tracking
│   │   ├── cpu/             # CPU monitoring utilities
│   │   ├── memory/          # Memory usage tracking
│   │   └── adaptive/        # Adaptive optimization
│   └── package.json
└── sustainability/          # Carbon footprint utilities
    ├── src/
    │   ├── tracking/        # CO₂ tracking utilities
    │   ├── optimization/    # Green inference routing
    │   └── reporting/       # Sustainability metrics
    └── package.json
```

### `/tools` - Development Tools

**Purpose**: Development utilities, testing tools, and operational scripts

```
tools/
├── testing/                 # Testing utilities and frameworks
│   ├── voice-simulation/    # Voice testing and simulation tools
│   ├── ai-mocking/         # AI service mocking utilities
│   ├── safety-testing/     # Emotional safety testing tools
│   └── performance/        # Performance testing utilities
├── deployment/             # Deployment automation scripts
│   ├── scripts/            # Deployment scripts
│   ├── migrations/         # Database migrations
│   └── rollback/           # Rollback utilities
├── monitoring/             # Monitoring and observability setup
│   ├── dashboards/         # Grafana dashboard configs
│   ├── alerts/             # Alert rule configurations
│   └── logs/               # Log processing utilities
└── scripts/                # Development scripts
    ├── setup/              # Environment setup scripts
    ├── build/              # Build automation
    └── data/               # Data management scripts
```

### `/tests` - Comprehensive Testing Suite

**Purpose**: Integration tests and specialized testing scenarios

```
tests/
├── integration/            # Cross-service integration tests
│   ├── voice-to-ai/       # Voice → AI pipeline tests
│   ├── memory-retrieval/  # Memory system integration tests
│   └── full-conversation/ # End-to-end conversation tests
├── voice-accuracy/        # Voice recognition accuracy validation
│   ├── demographics/      # Multi-demographic testing
│   ├── environments/      # Environmental condition tests
│   └── devices/           # Multi-device testing
├── ai-quality/            # AI conversation quality assurance
│   ├── empathy/           # Empathy response validation
│   ├── coherence/         # Conversation coherence tests
│   ├── personas/          # Voice persona testing
│   └── bias-detection/    # Comprehensive bias testing suite
│       ├── counterfactual/ # Counterfactual prompt testing
│       ├── demographics/   # Cross-demographic bias analysis
│       └── reporting/      # Quarterly bias reporting
├── emotional-safety/      # Emotional safety protocol testing
│   ├── crisis-detection/  # Crisis detection scenarios
│   ├── trauma-responses/  # Trauma-informed response tests
│   └── boundary-respect/  # Boundary respect validation
├── performance/           # Performance and load testing
│   ├── voice-latency/     # Voice processing latency tests
│   ├── memory-speed/      # Memory retrieval speed tests
│   ├── concurrent-users/  # Multi-user load testing
│   └── mobile-budgets/    # Mobile performance budget testing
│       ├── battery-drain/ # Battery consumption benchmarks
│       ├── cpu-usage/     # CPU utilization monitoring
│       └── memory-usage/  # Memory consumption tracking
├── security/              # Security and privacy testing
│   ├── data-protection/   # Data protection validation
│   ├── encryption/        # Encryption verification
│   ├── privacy/           # Privacy compliance testing
│   └── penetration/       # Quarterly penetration testing
├── accessibility/         # Accessibility testing framework
│   ├── wcag-compliance/   # WCAG 2.2 AA compliance testing
│   ├── assistive-tech/    # Screen reader and assistive technology
│   ├── keyboard-nav/      # Full keyboard navigation testing
│   └── captions/          # Real-time caption accuracy
├── compliance/            # Regulatory compliance testing
│   ├── eu-ai-act/         # EU AI Act compliance validation
│   ├── algorithmic-accountability/ # US algorithmic accountability
│   └── transparency/      # AI disclosure and transparency
└── documentation/         # Documentation testing and validation
    ├── doctests/          # Markdown code snippet testing
    ├── link-validation/   # Internal and external link checking
    └── api-examples/      # OpenAPI example validation
```

### `/infrastructure` - Infrastructure as Code

**Purpose**: Deployment, scaling, and monitoring infrastructure

```
infrastructure/
├── kubernetes/             # Kubernetes deployment configurations
│   ├── base/              # Base Kubernetes manifests
│   ├── overlays/          # Environment-specific overlays
│   └── helm/              # Helm charts
├── terraform/             # Terraform infrastructure definitions
│   ├── environments/      # Environment-specific configs
│   ├── modules/           # Reusable Terraform modules
│   ├── providers/         # Cloud provider configurations
│   └── multi-region/      # Multi-region deployment configs
├── docker/                # Docker configurations
│   ├── services/          # Service-specific Dockerfiles
│   ├── compose/           # Docker Compose files
│   └── devcontainer/      # Development container setup
├── monitoring/            # Monitoring and observability
│   ├── prometheus/        # Prometheus configurations
│   ├── grafana/           # Grafana dashboards
│   ├── alertmanager/      # Alert manager configs
│   ├── opentelemetry/     # OpenTelemetry configurations
│   └── cost-monitoring/   # FinOps dashboards and alerts
├── security/              # Security infrastructure
│   ├── vpc/               # Private VPC configurations
│   ├── encryption/        # Encryption key management
│   └── compliance/        # Compliance monitoring
└── ci-cd/                 # CI/CD pipeline configurations
    ├── github-actions/    # GitHub Actions workflows
    ├── testing/           # Automated testing pipelines
    └── deployment/        # Deployment automation
```

### `/docs` - Documentation Hub

**Purpose**: Centralized documentation for all project aspects

```
docs/
├── product/               # Product documentation
│   ├── prd.md            # Product Requirements Document
│   ├── vision.md         # Product vision and strategy
│   ├── business-model.md # Business model canvas
│   └── go-to-market.md   # Go-to-market strategy
├── technical/            # Technical documentation
│   ├── architecture.md   # System architecture overview
│   ├── api/              # API documentation
│   │   ├── rest/         # REST API documentation
│   │   ├── websocket/    # WebSocket API documentation
│   │   └── webhooks/     # Webhook documentation
│   ├── voice-processing.md # Voice pipeline documentation
│   ├── memory-system.md  # Memory architecture documentation
│   └── integrations/     # Third-party integration guides
├── design/               # Design and UX documentation
│   ├── brand-guide.md    # Brand guidelines
│   ├── ux-ui-spec.md     # UX/UI specifications
│   ├── voice-personas.md # Voice persona specifications
│   └── design-system/    # Design system documentation
├── security/             # Security documentation
│   ├── privacy-spec.md   # Privacy and security specifications
│   ├── content-moderation.md # Content moderation policies
│   └── compliance/       # Compliance documentation
├── testing/              # Testing documentation
│   ├── strategy.md       # Testing strategy
│   ├── procedures/       # Testing procedures
│   └── reports/          # Test reports and results
├── competitive/          # Competitive analysis
│   ├── analysis.md       # Competitive analysis
│   └── monitoring/       # Competitive monitoring
└── project-management/   # Project management documentation
    ├── timeline.md       # Implementation timeline
    ├── milestones/       # Milestone documentation
    └── retrospectives/   # Sprint retrospectives
```

---

## Improvement Proposal Implementation Updates

### AI Governance & Observability Framework
The project structure now incorporates comprehensive AI governance capabilities based on improvement proposals:

**Prompt Registry Management**
- `/config/ai-services/prompt-registry.yaml` - Centralized prompt versioning
- `/services/ai-orchestrator/src/governance/` - Governance implementation
- `/packages/ai-client/src/governance/` - Client-side governance utilities

**Observability & Monitoring**
- `/services/ai-orchestrator/src/observability/` - AI telemetry and monitoring
- `/infrastructure/monitoring/opentelemetry/` - OpenTelemetry configurations
- `/infrastructure/monitoring/cost-monitoring/` - FinOps dashboards

**Compliance & Regulatory Framework**  
- `/services/ai-orchestrator/src/compliance/` - EU AI Act compliance
- `/tests/compliance/` - Regulatory compliance testing
- `/config/compliance/` - Compliance configurations

### Enhanced Security & Privacy
Privacy hardening and security improvements reflected in structure:

**Vector Database Security**
- `/services/memory/src/chroma/encrypted/` - Encrypted index operations
- `/services/memory/src/chroma/vpc/` - Private VPC configuration
- `/services/memory/src/chroma/tenant/` - Multi-tenant isolation

**Voice Privacy & Consent**
- `/services/voice-processing/src/voice-cloning/` - Voice cloning with consent
- `/packages/voice-sdk/src/accessibility/` - Accessibility features

### Performance & Accessibility Enhancements
Mobile performance and accessibility features integrated:

**Performance Monitoring**
- `/packages/performance-monitor/` - Mobile performance monitoring
- `/tests/performance/mobile-budgets/` - Performance budget testing
- `/infrastructure/docker/devcontainer/` - Development environment

**Accessibility Framework**
- `/packages/design-system/src/tokens/accessibility/` - WCAG 2.2 AA tokens
- `/tests/accessibility/` - Comprehensive accessibility testing
- `/packages/voice-sdk/src/accessibility/` - Voice accessibility features

### Multi-Region & Sustainability
Data residency and environmental considerations:

**Multi-Region Architecture**
- `/services/data-residency/` - Multi-region data management
- `/infrastructure/terraform/multi-region/` - Multi-region deployments

**Sustainability Framework**
- `/packages/sustainability/` - Carbon footprint utilities
- `/services/sustainability/` - Carbon tracking service

---

## Implementation Guidelines

### Phase 1: Foundation Setup (Weeks 1-2)
1. Create root folder structure
2. Set up monorepo tooling (Lerna/Nx)
3. Initialize React Native app structure
4. Set up basic backend service structure
5. Configure CI/CD pipeline foundation

### Phase 2: Core Development (Weeks 3-8)
1. Implement voice processing pipeline structure
2. Set up AI service integration framework
3. Create memory system architecture
4. Establish comprehensive testing framework
5. Implement security and privacy foundations

### Phase 3: Advanced Features (Weeks 9-16)
1. Complete AI orchestration system
2. Implement emotional safety protocols
3. Set up performance monitoring
4. Create deployment automation
5. Establish documentation workflows

### Phase 4: Production Readiness (Weeks 17-24)
1. Complete infrastructure automation
2. Implement comprehensive monitoring
3. Finalize security hardening
4. Complete testing automation
5. Prepare for production deployment

---

## Development Workflow

### 1. **Branch Strategy**
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature development
- `hotfix/*`: Critical production fixes

### 2. **Package Management**
- Root-level package.json for shared dependencies
- Individual package.json files for each service/app
- Workspaces configuration for monorepo management

### 3. **Testing Strategy**
- Unit tests within each package/service
- Integration tests in `/tests` directory
- Automated testing in CI/CD pipeline
- Manual testing procedures documented

### 4. **Documentation Maintenance**
- Living documentation updated with code changes
- Automated API documentation generation
- Regular documentation reviews and updates

---

## Technology Stack Alignment

### Frontend (React Native)
- TypeScript for type safety
- React Native 0.72+ for mobile development
- WebRTC for real-time audio streaming
- Redux Toolkit for state management

### Backend (Microservices)
- Node.js with Express.js for API services
- TypeScript for consistent typing
- WebSocket support for real-time features
- Microservices architecture for scalability

### AI Integration
- OpenAI Realtime API for conversational AI
- Claude 3.5 Sonnet for writing assistance
- AssemblyAI for speech-to-text processing
- Deepgram Aura-2 for text-to-speech

### Infrastructure
- Kubernetes for container orchestration
- Docker for containerization
- Terraform for infrastructure as code
- Prometheus/Grafana for monitoring

---

## Success Metrics

### Development Efficiency
- Reduced setup time for new developers (< 30 minutes)
- Clear separation enabling parallel development
- Simplified dependency management
- Consistent tooling across all components

### Code Quality
- Shared type definitions reducing integration errors
- Comprehensive testing coverage (>90%)
- Consistent code style and formatting
- Clear documentation for all components

### Deployment Reliability
- Infrastructure as code for consistent deployments
- Automated testing preventing regression
- Clear rollback procedures
- Monitoring and alerting for production issues

---

*This structure supports the complete Storyline development lifecycle from initial MVP through production scaling, ensuring the platform can handle the complex AI integrations and real-time voice processing requirements while maintaining developer productivity and code quality.*