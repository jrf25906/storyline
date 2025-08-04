#!/bin/bash

# Storyline Development Helper Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_color $YELLOW "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_color $RED "Error: Docker is not installed"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_color $RED "Error: Docker Compose is not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_color $RED "Error: npm is not installed"
        exit 1
    fi
    
    print_color $GREEN "All prerequisites met!"
}

# Copy .env.example to .env if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        print_color $YELLOW "Creating .env file from .env.example..."
        cp .env.example .env
        print_color $GREEN ".env file created. Please update it with your API keys!"
    fi
}

# Install dependencies
install_deps() {
    print_color $YELLOW "Installing dependencies..."
    npm install
    
    # Install dependencies for each service
    for service in services/*; do
        if [ -d "$service" ] && [ -f "$service/package.json" ]; then
            print_color $YELLOW "Installing dependencies for $service..."
            (cd "$service" && npm install)
        fi
    done
    
    # Install dependencies for web app
    if [ -d "apps/web" ] && [ -f "apps/web/package.json" ]; then
        print_color $YELLOW "Installing dependencies for web app..."
        (cd "apps/web" && npm install)
    fi
}

# Start development environment
start_dev() {
    print_color $YELLOW "Starting development environment..."
    
    # Use development compose file
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    print_color $GREEN "Development environment started!"
    print_color $YELLOW "Services:"
    echo "  - API Gateway: http://localhost:3000"
    echo "  - Web App: http://localhost:3000 (run 'npm run dev:web' separately)"
    echo "  - pgAdmin: http://localhost:5050"
    echo "  - Redis Commander: http://localhost:8081"
    echo "  - MinIO Console: http://localhost:9001"
    echo "  - Neo4j Browser: http://localhost:7474"
}

# Stop development environment
stop_dev() {
    print_color $YELLOW "Stopping development environment..."
    docker-compose down
    print_color $GREEN "Development environment stopped!"
}

# View logs
view_logs() {
    service=$1
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Run database migrations
run_migrations() {
    print_color $YELLOW "Running database migrations..."
    docker-compose exec api npm run db:migrate
    print_color $GREEN "Migrations completed!"
}

# Main menu
show_menu() {
    echo ""
    print_color $YELLOW "Storyline Development Helper"
    echo "1. Check prerequisites"
    echo "2. Setup environment"
    echo "3. Install dependencies"
    echo "4. Start development environment"
    echo "5. Stop development environment"
    echo "6. View logs"
    echo "7. Run database migrations"
    echo "8. Rebuild containers"
    echo "9. Clean everything"
    echo "0. Exit"
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Enter choice: " choice
    
    case $choice in
        1) check_prerequisites ;;
        2) setup_env ;;
        3) install_deps ;;
        4) start_dev ;;
        5) stop_dev ;;
        6) 
            read -p "Service name (leave empty for all): " service
            view_logs "$service"
            ;;
        7) run_migrations ;;
        8) 
            print_color $YELLOW "Rebuilding containers..."
            docker-compose build
            print_color $GREEN "Rebuild complete!"
            ;;
        9)
            print_color $RED "This will remove all containers, volumes, and images!"
            read -p "Are you sure? (y/N): " confirm
            if [ "$confirm" = "y" ]; then
                docker-compose down -v --rmi all
                print_color $GREEN "Cleanup complete!"
            fi
            ;;
        0) 
            print_color $GREEN "Goodbye!"
            exit 0
            ;;
        *)
            print_color $RED "Invalid choice!"
            ;;
    esac
done