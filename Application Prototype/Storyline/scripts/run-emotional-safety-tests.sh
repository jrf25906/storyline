#!/bin/bash
# run-emotional-safety-tests.sh - Run critical emotional safety tests

echo "🛡️  Running Emotional Safety Tests..."
echo "===================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Run the tests
echo -e "\n${YELLOW}Running crisis detection tests...${NC}"
npx jest tests/emotional-safety/crisis-detection.test.ts --verbose

echo -e "\n${YELLOW}Running trauma-informed response tests...${NC}"
npx jest tests/emotional-safety/trauma-informed-responses.test.ts --verbose

echo -e "\n${YELLOW}Running safety integration tests...${NC}"
npx jest tests/emotional-safety/safety-integration.test.ts --verbose

# Generate coverage report
echo -e "\n${YELLOW}Generating coverage report...${NC}"
npx jest tests/emotional-safety --coverage --coverageDirectory=coverage/emotional-safety

echo -e "\n${GREEN}✅ Emotional safety tests complete!${NC}"
echo "Coverage report available at: coverage/emotional-safety/lcov-report/index.html"
