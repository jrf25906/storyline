# Narrative Analysis Service

This service is responsible for analyzing the narrative structure and character development within a user's story. It integrates with the Memory Service to retrieve story content and provide insights.

## Getting Started

### Prerequisites

-   Node.js 18+
-   Docker and Docker Compose

### Running Locally

1.  Make sure you have a `.env` file in the root of the project with the necessary environment variables, including `MEMORY_SERVICE_URL`.
2.  From the root of the project, run:
    ```bash
    docker-compose -f docker-compose.dev.yml up narrative-analysis
    ```

## API

The API is documented using the OpenAPI specification. You can find the specification in `openapi.yaml`.

### Endpoints

-   `GET /analysis/story/{storyId}`: Analyzes a story and returns both character and structure analysis.
-   `GET /analysis/story/{storyId}/characters`: Returns character analysis for a given story.
-   `GET /analysis/story/{storyId}/structure`: Returns story structure analysis for a given story.
-   `POST /analysis/craft/readability`: Analyzes text for readability scores (e.g., Flesch-Kincaid, Gunning Fog).
-   `POST /analysis/craft/style-tone`: Analyzes text for writing style and emotional tone.
