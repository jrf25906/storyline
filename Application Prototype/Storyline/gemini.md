# Gemini Onboarding Guide for Storyline

**Welcome to the Storyline project!** This guide provides a comprehensive overview to get you up and running as a new developer.

## 1. Project Overview

Storyline is an AI-powered, voice-first book writing application that enables authors to write books through natural conversation. It's designed for creators who prefer to think out loud, need a low-friction way to capture ideas, and want AI assistance in structuring and refining their work. The platform is particularly powerful for memoirists and those working with emotionally sensitive content.

### Key Features

-   **Voice-First Writing**: Record ideas and stories through natural conversation.
-   **AI Writing Partner**: A conversational AI assistant for brainstorming, emotional support, and overcoming writer's block.
-   **Real-Time Transcription**: High-accuracy, real-time speech-to-text with emotional context awareness.
-   **Narrative Intelligence**: The AI understands story structure, character development, and narrative arcs to provide insightful guidance.
-   **Dual RAG Memory System**: A sophisticated memory architecture that combines vector and graph databases to understand narrative context and character relationships.
-   **Emotional Safety**: Trauma-informed AI responses and crisis detection to create a safe space for users.
-   **Multi-Platform**: A React Native application for both iOS and Android.

## 2. Getting Started

### Prerequisites

-   Node.js 18+
-   React Native development environment
-   Docker and Docker Compose

### Development Setup

The recommended way to get started is by using the provided DevContainer, which ensures a consistent development environment.

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd storyline
    ```
2.  **Open in DevContainer**: If you have the "Remote - Containers" extension in VS Code, you'll be prompted to reopen the project in a container. Click "Reopen in Container".
3.  **Start all services**:
    ```bash
    tilt up
    ```
    This command uses Tilt to spin up all the necessary services for local development.

For manual setup instructions, refer to the `README.md` file.

## 3. Technology Stack

Storyline uses a modern, microservices-based architecture. Here are the key technologies:

-   **Frontend**: React Native with TypeScript
-   **Backend**: Node.js with Express.js (Microservices)
-   **AI Services**:
    -   **Conversational AI**: OpenAI Realtime API (GPT-4o)
    -   **Writing Assistance**: Claude 3.5 Sonnet
    -   **Speech-to-Text**: AssemblyAI Universal-Streaming
    -   **Text-to-Speech**: Deepgram Aura-2
-   **Memory/Database**:
    -   **Vector Memory**: Chroma DB
    -   **Graph Memory**: Neo4j
    -   **Primary Database**: PostgreSQL
-   **Infrastructure**:
    -   **Containerization**: Docker
    -   **Orchestration**: Kubernetes
    -   **Infrastructure as Code**: Terraform
-   **Monitoring**: Prometheus, Grafana, and OpenTelemetry

## 4. Project Structure

The project is organized as a monorepo with a clear separation of concerns. Here are the most important directories:

-   `apps/`: Contains the end-user applications (React Native mobile app).
-   `services/`: Houses the backend microservices (API, AI orchestrator, voice processing, etc.).
-   `packages/`: Shared libraries and SDKs used across different parts of the project (design system, AI client, etc.).
-   `docs/`: All project documentation, including technical architecture, product requirements, and design specs.
-   `tests/`: Comprehensive testing suites, including integration, performance, and security tests.
-   `infrastructure/`: Infrastructure-as-Code configurations for Kubernetes and Terraform.
-   `config/`: Project-wide configuration files, including AI service settings and feature flags.

For a detailed breakdown, see the `PROJECT_STRUCTURE.md` file.

## 5. Development Workflow

### Branching Strategy

-   `main`: Production-ready code.
-   `develop`: Integration branch for new features.
-   `feature/*`: For developing new features.
-   `hotfix/*`: For critical production fixes.

### Testing

The project has a comprehensive testing strategy. To run all tests, use:

```bash
npm run test
```

There are also specialized test suites for voice accuracy, AI quality, emotional safety, and more. You can find these in the `tests/` directory and run them using the scripts in `package.json`.

### Documentation

The project maintains living documentation in the `docs/` directory. It's crucial to keep this documentation up-to-date with any changes you make. The project also uses automated documentation testing to prevent drift.

## 6. Key Documentation

To get a deeper understanding of the project, we recommend reading the following documents:

-   **Product Requirements**: `docs/product/prd.md`
-   **Technical Architecture**: `docs/technical/architecture.md`
-   **Implementation Plan**: `STORYLINE_IMPLEMENTATION_PLAN.md`
-   **Design System**: `docs/design/design-system-specification.md`
