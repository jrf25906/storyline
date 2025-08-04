# Memory Service

This service is responsible for managing the memory and context of the Storyline application. It uses a Dual RAG (Retrieval-Augmented Generation) architecture to provide both semantic and narrative context to the AI orchestrator.

## Getting Started

### Prerequisites

-   Node.js 18+
-   Docker and Docker Compose

### Running Locally

1.  Make sure you have a `.env` file in the root of the project with the necessary environment variables.
2.  From the root of the project, run:
    ```bash
    docker-compose -f docker-compose.dev.yml up memory
    ```

## API

The API is documented using the OpenAPI specification. You can find the specification in `openapi.yaml`.

### Endpoints

-   `POST /memory/semantic`: Adds a piece of content to the semantic memory.
-   `GET /memory/semantic`: Retrieves content from the semantic memory based on a query.
-   `POST /memory/graph`: Adds a conversation to the graph memory, extracting entities and relationships.
-   `GET /memory/graph`: Retrieves entities related to a given entity from the graph memory.
-   `GET /memory/query`: Retrieves content from memory using a hybrid query that intelligently routes to either the semantic or graph memory.
