# CLAUDE.md - Storyline Project Guide

## Project Overview

**Storyline** is an AI-powered, voice-first book writing platform that enables authors, memoirists, and creative professionals to write books through natural conversation. Available as both mobile and web applications, the platform prioritizes emotional safety, trauma-informed AI responses, and seamless voice-to-text-to-book workflows with sophisticated editing capabilities.

### Core Mission
- Enable book writing through voice as the primary interface
- Provide emotionally safe space for processing vulnerable content
- Bridge spontaneous speech and structured narrative writing
- Support fiction, memoirs, non-fiction, and thought leadership

### Key Users
- Aspiring authors who think better out loud
- Memoirists processing emotional or traumatic experiences
- Creative professionals needing low-friction idea capture
- Users who are constantly on the move

## Architecture Overview

### Technology Stack
- **Mobile Frontend**: React Native (iOS/Android) with TypeScript
- **Web Frontend**: React.js with TypeScript, TinyMCE/Quill.js rich text editor
- **Backend**: Node.js microservices architecture
- **AI Services**: OpenAI Realtime API, Claude 3.5 Sonnet, AssemblyAI, Deepgram
- **Memory**: Chroma DB vector storage with contradiction-aware narrative memory
- **Infrastructure**: Kubernetes, Docker, Terraform, Prometheus/Grafana

### Service Architecture
```
├── apps/
│   ├── mobile/                 # React Native app (iOS/Android)
│   └── web/                    # React.js web application
├── services/
│   ├── ai-orchestrator/        # AI routing and conversation logic ✅
│   ├── api/                    # Main REST API Gateway ✅
│   ├── auth/                   # Authentication service ✅
│   ├── memory/                 # Dual RAG context and narrative memory ✅
│   ├── narrative-analysis/     # Story structure and writing craft analysis ✅
│   ├── voice-processing/       # Real-time voice pipeline ✅
│   └── document-export/        # Multi-format export service ✅
├── packages/                   # Shared libraries
│   └── shared-types/           # TypeScript types shared across services ✅
├── tests/                      # Comprehensive testing suite
├── docs/                       # Project documentation
│   ├── narrative-intelligence/ # Narrative intelligence planning docs
│   └── project-management/     # Timeline, to-do list, progress tracking
└── infrastructure/             # K8s, Docker, Terraform
```

### Service Status & Features

#### ✅ Completed Services

**Authentication Service** (`/services/auth/`)
- JWT authentication with refresh tokens
- OAuth2 integration (Google, GitHub)
- Two-factor authentication support
- Email verification and password reset
- Role-based access control

**Voice Processing Service** (`/services/voice-processing/`)
- Multi-provider transcription (AssemblyAI, Deepgram, OpenAI Whisper)
- Real-time streaming via WebSocket
- Text-to-speech synthesis
- Audio processing utilities
- S3/MinIO storage integration

**AI Orchestrator Service** (`/services/ai-orchestrator/`)
- Multi-provider support (OpenAI, Anthropic)
- 4 specialized personas (Empathetic Guide, Creative Muse, Memoir Companion, Analytical Coach)
- Conversation history management
- Real-time streaming responses
- Intelligent model routing

**Memory Service** (`/services/memory/`)
- Dual RAG architecture (Vector + Graph)
- Contradiction-aware memory tracking
- ChromaDB for semantic search
- Neo4j for relationship mapping
- Redis caching layer
- Memory evolution tracking

**Narrative Analysis Service** (`/services/narrative-analysis/`)
- Multi-cultural story structure detection
- Character development tracking
- Theme and symbolism analysis
- Writing craft evaluation
- Trauma-informed feedback
- Real-time analysis (<2 seconds)

**Document Export Service** (`/services/document-export/`)
- 6 export formats (DOCX, PDF, EPUB, Markdown, HTML, TXT)
- Template system with Handlebars
- Async processing with Bull/Redis
- S3/MinIO storage
- Batch export capabilities
- Progress tracking

## Development Commands

### Mobile App
```bash
# iOS development
npm run ios

# Android development  
npm run android

# Metro bundler
npm start
```

### Web App
```bash
# Web development server
npm run web:dev

# Web build for production
npm run web:build

# Web testing
npm run web:test
```

### Backend Services
```bash
# Start all services with Docker
docker-compose up

# Individual services (from service directory)
cd services/auth && npm run dev
cd services/voice-processing && npm run dev
cd services/ai-orchestrator && npm run dev
cd services/memory && npm run dev
cd services/narrative-analysis && npm run dev
cd services/document-export && npm run dev
cd services/api && npm run dev

# Install dependencies for all services
npm run install:all

# Run tests for all services
npm run test:all

# Type check all services
npm run typecheck:all
```

### Testing
```bash
# Run all tests
npm test

# Voice accuracy tests
npm run test:voice-accuracy

# Emotional safety validation
npm run test:emotional-safety

# AI quality tests
npm run test:ai-quality

# Performance tests
npm run test:performance
```

### Linting & Type Checking
```bash
# Lint all services
npm run lint

# TypeScript checking
npm run typecheck

# Format code
npm run format
```

## Project Management & Task Tracking

### Master To-Do List
- **Location**: `/docs/project-management/to-do.md`
- **Purpose**: Single source of truth for all project tasks, milestones, and progress tracking
- **Update Frequency**: Weekly or when completing significant tasks

### AI Assistant Task Management Protocol
When working on Storyline development, AI assistants should:
1. **Check the master to-do list** before starting any development work
2. **Update task status** when completing items (mark with ✅)
3. **Add new tasks** as they emerge from development or user requests
4. **Update KPIs and metrics** when data becomes available
5. **Note blockers** that impact progress or timeline
6. **Cross-reference with timeline.md** to ensure milestone alignment

### Subagent Coordination Protocol
When working with specialized subagents:
1. **Reference coordination documentation**: `/docs/project-management/subagent-coordination-plan.md`
2. **Complete pre-work checklist**: `/docs/project-management/subagent-pre-work-checklist.md`
3. **Use standardized task format**: `/docs/project-management/to-do-template.md`
4. **Follow agent-specific guidance**: `/docs/project-management/subagent-guidance.md`
5. **Coordinate cross-domain dependencies** using standardized tags and communication protocols
6. **Validate against quality gates** before implementation and completion

### Timeline Coordination
- **Primary Timeline**: `/docs/project-management/timeline.md` - High-level phases and milestones
- **Task Breakdown**: `/docs/project-management/to-do.md` - Detailed tasks and progress tracking
- **Sync Requirement**: Both files should remain aligned on milestones and phases

### Progress Reporting
When completing significant work:
1. Update the to-do list with completed tasks
2. Note any new requirements or blockers discovered
3. Update relevant documentation (architecture, PRD, etc.)
4. Ensure timeline remains realistic based on progress

## Storyline-Specific Development Guidelines

### 1. Emotional Safety First
- **Always consider trauma-informed design** when working on conversation features
- Implement crisis detection and appropriate response mechanisms
- Respect user boundaries and consent for sensitive topics
- Test emotional safety scenarios in `/tests/emotional-safety/`

### 2. Voice-First Philosophy
- Prioritize voice interactions over text-based alternatives
- Ensure real-time voice processing performance (<200ms latency)
- Test across diverse demographics, devices, and environments
- Maintain voice persona consistency (see `/docs/design/voice-personas.md`)

### 3. Memory & Context Management
- Maintain conversation continuity across sessions
- Implement contradiction-aware narrative memory for memoir evolution
- Handle context switches gracefully (recording → conversation → editing)
- Test memory retrieval performance and accuracy
- **Narrative Intelligence**: Integrate story structure tracking, character development, and theme analysis
- **Cultural Sensitivity**: Support diverse storytelling traditions beyond Western narrative frameworks

### 4. AI Provider Management
- Implement graceful failover between AI services
- Monitor AI service health and costs
- Ensure consistent personality across different AI providers
- Test AI coherence and empathy responses

### 5. Privacy & Security
- Handle sensitive memoir content with strict data protection
- Implement end-to-end encryption for voice recordings
- Follow HIPAA-level privacy standards for emotional content
- Regular security audits for voice and memory data

## Key File Patterns & Locations

### Core Components
#### Mobile App
- `/apps/mobile/src/components/voice/` - Voice interface components
- `/apps/mobile/src/components/chat/` - Conversation UI
- `/apps/mobile/src/components/writing/` - Text editing and organization
- `/apps/mobile/src/components/memory/` - Memory and context displays
- `/apps/mobile/src/components/narrative/` - Story structure visualization and character tracking

#### Web App
- `/apps/web/src/components/editor/` - Microsoft Word-like rich text editor
- `/apps/web/src/components/voice/` - Web-based voice interface
- `/apps/web/src/components/chat/` - Web conversation UI
- `/apps/web/src/components/toolbar/` - Formatting toolbar and tools
- `/apps/web/src/components/sidebar/` - Document outline and navigation
- `/apps/web/src/components/export/` - Document export functionality

### Services
- `/services/ai-orchestrator/src/conversation/` - AI conversation logic
- `/services/ai-orchestrator/src/providers/` - AI service integrations
- `/services/memory/src/context/` - Context management
- `/services/narrative-analysis/src/` - Story structure analysis and writing craft guidance
- `/services/voice-processing/src/streaming/` - Real-time voice handling

### Configuration
- `/config/ai-services/` - AI provider configurations
- `/config/env/` - Environment-specific settings
- `/docs/design/voice-personas.md` - AI personality guidelines
- `/docs/technical/memory-system.md` - Memory architecture
- `/docs/technical/architecture.md` - Complete system architecture including narrative intelligence
- `/docs/narrative-intelligence/` - Narrative intelligence implementation, content strategy, and research plans

### Testing
- `/tests/voice-accuracy/` - Voice processing validation
- `/tests/emotional-safety/` - Safety boundary testing
- `/tests/ai-quality/` - AI response quality validation
- `/tests/performance/` - Latency and concurrency tests
- `/tests/narrative-intelligence/` - Story structure analysis and writing craft guidance validation

## Common Workflows

### Adding New Voice Features
1. Update voice components in `/apps/mobile/src/components/voice/` and `/apps/web/src/components/voice/`
2. Modify voice processing in `/services/voice-processing/`
3. Test with diverse voice samples in `/tests/voice-accuracy/`
4. Validate emotional safety scenarios
5. Update AI orchestrator if conversation logic changes
6. Ensure cross-platform compatibility between mobile and web

### Modifying AI Behavior
1. Update persona definitions in `/docs/design/voice-personas.md`
2. Modify AI provider logic in `/services/ai-orchestrator/src/providers/`
3. Test across all AI quality scenarios in `/tests/ai-quality/`
4. Validate emotional safety and crisis detection
5. Monitor AI service costs and performance

### Memory System Changes
1. Update memory models in `/services/memory/src/`
2. Test contradiction-aware functionality
3. Validate memory retrieval performance
4. Test across full conversation scenarios
5. Update privacy and encryption as needed

### Adding Narrative Intelligence Features
1. Update narrative analysis models in `/services/narrative-analysis/src/`
2. Enhance story structure detection algorithms
3. Test character development tracking accuracy
4. Validate cultural storytelling frameworks
5. Update narrative intelligence documentation in `/docs/narrative-intelligence/`
6. Test writing craft guidance effectiveness
7. Ensure trauma-informed approaches for memoir content
8. Update web editor to display narrative insights and suggestions

### Adding Web Editor Features
1. Update rich text editor components in `/apps/web/src/components/editor/`
2. Implement new formatting tools in `/apps/web/src/components/toolbar/`
3. Test cross-browser compatibility
4. Ensure accessibility compliance (WCAG 2.2 AA)
5. Validate export functionality to Word/PDF formats
6. Test real-time collaboration features if applicable
7. Integrate with voice-to-text and AI conversation features

## Quality Standards

### Voice Processing
- <200ms latency for real-time transcription
- >95% accuracy across demographic groups
- Graceful handling of background noise and accents
- Consistent audio quality across devices

### AI Responses
- Trauma-informed and emotionally appropriate
- Consistent with selected voice persona
- Coherent across conversation threads
- Respectful of user boundaries and consent

### Memory System - Dual RAG Performance
- **Traditional RAG (Vector Storage)**:
  - Vector similarity queries: <100ms
  - Context retrieval accuracy: >95%
  - Content search performance: <200ms
- **Graph RAG (Relationship Storage)**:
  - Graph traversal queries: <300ms
  - Character relationship accuracy: >90%
  - Story structure detection: >80%
- **Hybrid System**:
  - Query routing decision: <10ms
  - Combined query synthesis: <500ms
  - Privacy-compliant storage and access
  - Consistent narrative thread maintenance

### Narrative Intelligence
- Story structure detection accuracy (>80% target)
- Character development tracking consistency (>90% target)
- Cultural storytelling sensitivity (100% expert validation)
- Writing craft guidance relevance (>85% user satisfaction)
- Real-time narrative analysis speed (<2 seconds)

### Web Editor Quality Standards
- Rich text editing response time: <50ms for typing
- Document load time: <2 seconds for 100+ page documents
- Export functionality: Word/PDF generation <30 seconds
- Cross-browser compatibility: Chrome, Firefox, Safari, Edge
- Accessibility: WCAG 2.2 AA compliance with keyboard navigation
- Real-time sync: <500ms for collaborative editing
- Voice integration: Seamless transition between voice and text editing

### AI Governance & Compliance
- Prompt registry versioning and audit trail (100% coverage)
- Bias testing across demographics (quarterly reporting)
- EU AI Act compliance with system cards and transparency
- Mobile performance budgets (≤8% CPU, ≤150mA sustained)
- Web performance budgets (≤100ms TTI, <2MB initial bundle)
- Accessibility compliance (WCAG 2.2 AA standard)
- Carbon footprint tracking (CO₂ per 10k tokens)

## AI Governance & Observability Framework

### Prompt Registry Management
All AI prompts are versioned and tracked through a centralized registry:
- **Location**: `/config/ai-services/prompt-registry.yaml`
- **Versioning**: Semantic versioning (e.g., memoir_conv_v2.1.0)
- **Audit Trail**: Comprehensive logging of prompt-id, model-version, outputs
- **Compliance Tags**: GDPR compliance, trauma-informed design validation
- **Rollback Capability**: Instant rollback to previous prompt versions

### AI Observability & Monitoring
- **Telemetry Service**: OpenTelemetry + Prometheus + ClickHouse logging
- **PII Redaction**: Automatic redaction with encrypted correlation hashes
- **Cost Monitoring**: Real-time cost tracking with anomaly detection (>20% delta)
- **Bias Detection**: Continuous monitoring with quarterly public reporting
- **Performance Metrics**: AI latency, token usage, safety flag activation

### Feature Flag Governance
- **Provider**: LaunchDarkly or OpenFeature integration
- **AI-Specific Flags**: AI personas, pricing tiers, moderation thresholds
- **Progressive Rollout**: Percentage-based user cohorts with emergency disable
- **A/B Testing**: Integrated experimentation platform (GrowthBook/Optimizely)

## Compliance & Regulatory Framework

### EU AI Act Compliance
- **System Classification**: Limited-risk AI system with emotional AI interaction
- **Risk Assessment**: Documented psychological harm mitigation measures
- **Transparency Obligations**: User-toggleable AI disclosures ("Generated by GPT-4o v2025-07-29")
- **Human Oversight**: Human-in-the-loop for crisis intervention
- **Documentation**: Technical documentation, risk management, bias testing records

### US Algorithmic Accountability
- **Model System Cards**: Comprehensive documentation of AI system capabilities and limitations
- **Bias Auditing**: Quarterly bias assessments with public transparency reports
- **User Rights**: Right to explanation, correction, and human review
- **Audit Trail**: Complete logging of AI decisions and safety interventions

### Privacy & Data Protection Enhanced Framework
- **Vector Privacy**: Private VPC deployment with tenant-level encryption
- **Regional Data Residency**: Per-project region selection (EU, US, APAC)
- **Voice-Cloning Consent**: Comprehensive license agreements with signed hash storage
- **Content Provenance**: C2PA watermarking for manuscript exports
- **Carbon Footprint**: CO₂ tracking per conversation with green inference options

## Enhanced Testing Requirements

### Bias & Fairness Testing
- **Test Suite Location**: `/tests/ai-quality/bias-detection/`
- **Demographics Coverage**: Age, ethnicity, gender, cultural background, socioeconomic status
- **Counterfactual Testing**: 1000+ prompts per demographic group
- **Acceptance Threshold**: <0.05 bias score difference across groups
- **Reporting**: Quarterly public transparency reports

### Documentation Testing
- **Automated Validation**: Code block execution, link validation, API example testing
- **CI Integration**: Documentation tests must pass for deployment
- **Quality Metrics**: 95%+ code execution success, 99%+ link health
- **Version Consistency**: Automated version matching across all documentation

### Mobile Performance Budget Enforcement
- **CPU Usage**: ≤8% sustained, ≤15% peak allowance
- **Battery Consumption**: ≤150mA sustained, ≤300mA during voice processing
- **Memory Usage**: ≤150MB heap, ≤100MB native
- **Adaptive Optimization**: Automatic downsampling when battery <30%
- **CI Testing**: Automated 1-hour battery drain benchmarks

### Web Performance Budget Enforcement
- **Bundle Size**: ≤2MB initial bundle, ≤500KB per lazy-loaded chunk
- **Time to Interactive**: ≤100ms for editor interactions
- **First Contentful Paint**: ≤1.5 seconds
- **Memory Usage**: ≤200MB for large documents (1000+ pages)
- **Export Performance**: Word/PDF generation within 30 seconds
- **Voice Processing**: Same latency requirements as mobile (<200ms)

### Accessibility Testing
- **WCAG 2.2 AA Compliance**: 7:1 contrast ratio, full keyboard navigation
- **Real-Time Captions**: <200ms caption display for TTS responses
- **Assistive Technology**: Screen reader, voice control, switch control compatibility
- **Multi-Modal Support**: Voice, text, and visual interaction methods

## Crisis Detection & Safety

### Implementation Requirements
- Real-time crisis keyword detection
- Graduated response system (gentle → professional resources)
- Clear user consent and boundary respect
- Professional mental health resource integration

### Testing
- Validate crisis detection accuracy
- Test false positive rates
- Ensure appropriate response timing
- Verify professional resource links

## Deployment & Infrastructure

### Development
```bash
# Local development with Docker (includes Neo4j for Graph RAG)
docker-compose -f docker-compose.dev.yml up

# Local Kubernetes (minikube)
kubectl apply -f infrastructure/kubernetes/base/
```

### Production
- Kubernetes cluster deployment via Terraform
- **Dual RAG Infrastructure**:
  - Chroma Cloud for vector operations (Traditional RAG)
  - Neo4j Cloud/Amazon Neptune for graph operations (Graph RAG)
  - Redis for query result caching and hybrid routing
- Monitoring with Prometheus/Grafana
- AI service failover and health checks
- Encrypted voice data storage and transmission
- Multi-database backup and disaster recovery

## Troubleshooting Common Issues

### Voice Processing Issues
- Check AssemblyAI API key and quota
- Verify WebRTC permissions and configuration
- Test audio input device compatibility
- Monitor voice processing service logs

### AI Response Issues
- Verify AI provider API keys and quotas
- Check AI orchestrator routing logic
- Monitor AI service response times
- Validate persona configuration consistency

### Memory Issues
- Check Chroma DB connection and indexing
- Verify vector embedding consistency
- Monitor memory service performance
- Test contradiction detection accuracy

---

*This guide should be updated as the project evolves. Focus on maintaining emotional safety, voice-first principles, and comprehensive testing across all changes.*