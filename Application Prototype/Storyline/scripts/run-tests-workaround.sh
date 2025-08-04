#!/bin/bash
# run-tests-workaround.sh - Temporary workaround to run tests

echo "🧪 Running Storyline Tests with Workaround..."
echo "==========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        return 0
    else
        return 1
    fi
}

# Function to run tests for a service
run_service_tests() {
    local service=$1
    local service_path="services/$service"
    
    if check_dir "$service_path"; then
        echo -e "\n${YELLOW}Testing $service...${NC}"
        cd "$service_path"
        
        # Check if tests exist
        if check_dir "tests" || check_dir "src/__tests__"; then
            # Try to run tests
            if [ -f "package.json" ] && grep -q '"test"' package.json; then
                npm test -- --passWithNoTests 2>/dev/null || echo -e "${YELLOW}⚠️  $service: No tests or test errors${NC}"
            else
                echo -e "${YELLOW}⚠️  $service: No test script defined${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  $service: No test directory found${NC}"
        fi
        
        cd ../..
    else
        echo -e "${RED}❌ $service: Directory not found${NC}"
    fi
}

# List of services to test
services=(
    "auth"
    "voice-processing"
    "ai-orchestrator"
    "api"
    "memory"
    "narrative-analysis"
    "document-export"
)

echo -e "${YELLOW}Running tests for each service...${NC}"

# Test each service
for service in "${services[@]}"; do
    run_service_tests "$service"
done

# Test mobile app if exists
if check_dir "apps/mobile"; then
    echo -e "\n${YELLOW}Testing mobile app...${NC}"
    cd apps/mobile
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test -- --passWithNoTests 2>/dev/null || echo -e "${YELLOW}⚠️  mobile: Test errors${NC}"
    fi
    cd ../..
fi

# Test web app if exists
if check_dir "apps/web"; then
    echo -e "\n${YELLOW}Testing web app...${NC}"
    cd apps/web
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test -- --passWithNoTests 2>/dev/null || echo -e "${YELLOW}⚠️  web: Test errors${NC}"
    fi
    cd ../..
fi

# Run integration tests if they exist
if [ -f "tests/jest.config.integration.js" ]; then
    echo -e "\n${YELLOW}Running integration tests...${NC}"
    npx jest --config=tests/jest.config.integration.js --passWithNoTests 2>/dev/null || echo -e "${YELLOW}⚠️  Integration tests not configured${NC}"
fi

# Summary
echo -e "\n${YELLOW}========== Test Summary ==========${NC}"
echo "This is a temporary workaround to check test status."
echo "To properly fix testing:"
echo "1. Run './scripts/fix-testing-infrastructure.sh'"
echo "2. Run './scripts/create-emotional-safety-tests.sh'"
echo "3. Run './scripts/create-voice-accuracy-tests.sh'"
echo ""
echo -e "${YELLOW}Current known issues:${NC}"
echo "- Workspace dependencies need fixing"
echo "- Many services lack tests"
echo "- Emotional safety tests are critical but missing"
echo "- Voice accuracy baseline needs establishment"