Health check all Storyline microservices and report status.

!docker-compose ps
!curl -f http://localhost:3001/health || echo "API service down"
!curl -f http://localhost:3002/health || echo "AI Orchestrator down" 
!curl -f http://localhost:3003/health || echo "Memory service down"
!curl -f http://localhost:3004/health || echo "Voice processing down"
!curl -f http://localhost:3005/health || echo "Auth service down"
!curl -f http://localhost:3006/health || echo "Narrative analysis down"

Check service logs for any errors:
!docker-compose logs --tail=50

Reports health status for:
- API (Main REST API)
- AI Orchestrator (Conversation logic)
- Memory Service (Chroma DB)
- Voice Processing (Real-time pipeline)
- Auth Service (Authentication)
- Narrative Analysis (Story structure)

Provide recommendations if any services are unhealthy.