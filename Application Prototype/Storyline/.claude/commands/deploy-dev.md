Start all Storyline services with docker-compose for development.

!docker-compose -f docker-compose.dev.yml up -d

Services starting:
- API (main REST API)
- AI Orchestrator (conversation logic and AI routing)
- Memory Service (Chroma DB vector storage)
- Voice Processing (real-time voice pipeline)
- Auth Service (authentication)
- Narrative Analysis (story structure analysis)

Wait for services to be healthy, then show status:

!docker-compose -f docker-compose.dev.yml ps

Check service logs if any containers fail to start:
!docker-compose -f docker-compose.dev.yml logs

All services should be running for full Storyline development environment.