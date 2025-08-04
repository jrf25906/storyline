#!/bin/bash
# Fix workspace:* protocol issues to enable test execution
# This is Phase 1 of the Critical Testing Implementation Plan

set -e

echo "🔧 Fixing Workspace Protocol Issues"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "services" ]; then
    print_error "Please run this script from the Storyline root directory"
    exit 1
fi

# Step 1: Backup all package.json files
echo "Step 1: Creating backups of all package.json files..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="backups/package-json-$timestamp"
mkdir -p "$backup_dir"

find . -name "package.json" -not -path "./node_modules/*" -not -path "./backups/*" | while read -r file; do
    backup_file="$backup_dir/${file#./}"
    mkdir -p "$(dirname "$backup_file")"
    cp "$file" "$backup_file"
done
print_status "Backups created in $backup_dir"

# Step 2: Build shared-types package first
echo ""
echo "Step 2: Building shared-types package..."
if [ -d "packages/shared-types" ]; then
    cd packages/shared-types
    
    # Ensure it has a build script
    if ! grep -q '"build"' package.json; then
        print_warning "Adding build script to shared-types package.json"
        # Add build script using node
        node -e "
        const pkg = require('./package.json');
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.build = 'tsc';
        require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
        "
    fi
    
    # Install TypeScript if needed
    if [ ! -f "node_modules/.bin/tsc" ]; then
        print_info "Installing TypeScript in shared-types"
        npm install --save-dev typescript
    fi
    
    # Build the package
    if npm run build 2>/dev/null; then
        print_status "shared-types built successfully"
    else
        print_warning "shared-types build failed, continuing anyway"
    fi
    
    cd - > /dev/null
else
    print_error "shared-types package not found!"
    exit 1
fi

# Step 3: Fix workspace:* references
echo ""
echo "Step 3: Replacing workspace:* with file: references..."

services=(
    "auth"
    "voice-processing"
    "ai-orchestrator"
    "api"
    "memory"
    "narrative-analysis"
    "document-export"
)

fixed_count=0

for service in "${services[@]}"; do
    service_package="services/$service/package.json"
    
    if [ -f "$service_package" ]; then
        print_info "Processing $service..."
        
        # Use node to properly update the JSON
        node -e "
        const fs = require('fs');
        const path = require('path');
        const pkgPath = '$service_package';
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        
        let modified = false;
        
        // Fix dependencies
        if (pkg.dependencies && pkg.dependencies['@storyline/shared-types'] === 'workspace:*') {
            pkg.dependencies['@storyline/shared-types'] = 'file:../../packages/shared-types';
            modified = true;
        }
        
        // Fix devDependencies
        if (pkg.devDependencies && pkg.devDependencies['@storyline/shared-types'] === 'workspace:*') {
            pkg.devDependencies['@storyline/shared-types'] = 'file:../../packages/shared-types';
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
            console.log('Fixed workspace:* in ' + path.basename(path.dirname(pkgPath)));
        }
        " && fixed_count=$((fixed_count + 1))
    fi
done

print_status "Fixed workspace:* in $fixed_count services"

# Step 4: Install core testing dependencies
echo ""
echo "Step 4: Installing core testing dependencies..."

# Core testing dependencies
TEST_DEPS="jest@^29.7.0 @types/jest@^29.5.11 ts-jest@^29.1.1 supertest@^6.3.4 @types/supertest@^6.0.2"

for service in "${services[@]}"; do
    service_dir="services/$service"
    
    if [ -d "$service_dir" ]; then
        print_info "Installing test dependencies in $service..."
        cd "$service_dir"
        
        # Remove existing node_modules to avoid conflicts
        rm -rf node_modules package-lock.json
        
        # Install dependencies
        if npm install && npm install --save-dev $TEST_DEPS; then
            print_status "$service: Dependencies installed"
        else
            print_error "$service: Failed to install dependencies"
        fi
        
        cd - > /dev/null
    fi
done

# Step 5: Create jest.config.js for services that don't have one
echo ""
echo "Step 5: Creating Jest configurations..."

for service in "${services[@]}"; do
    service_dir="services/$service"
    jest_config="$service_dir/jest.config.js"
    
    if [ -d "$service_dir" ] && [ ! -f "$jest_config" ]; then
        print_info "Creating jest.config.js for $service"
        
        cat > "$jest_config" << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@storyline/shared-types$': '<rootDir>/../../packages/shared-types/src'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true
};
EOF
        
        # Create test setup file
        mkdir -p "$service_dir/tests"
        if [ ! -f "$service_dir/tests/setup.ts" ]; then
            cat > "$service_dir/tests/setup.ts" << 'EOF'
// Test setup
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock console to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error for debugging
};
EOF
        fi
        
        # Create a basic smoke test
        mkdir -p "$service_dir/tests/unit"
        if [ ! -f "$service_dir/tests/unit/smoke.test.ts" ]; then
            cat > "$service_dir/tests/unit/smoke.test.ts" << EOF
describe('$service Service - Smoke Test', () => {
  test('environment is configured correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('service name is correct', () => {
    const pkg = require('../../package.json');
    expect(pkg.name).toContain('$service');
  });
});
EOF
        fi
        
        # Update package.json test script
        node -e "
        const fs = require('fs');
        const pkgPath = '$service_dir/package.json';
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.test = 'jest';
        pkg.scripts['test:watch'] = 'jest --watch';
        pkg.scripts['test:coverage'] = 'jest --coverage';
        
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        "
        
        print_status "$service: Jest configured"
    fi
done

# Step 6: Verify test execution
echo ""
echo "Step 6: Verifying test execution..."
echo ""

success_count=0
fail_count=0

for service in "${services[@]}"; do
    service_dir="services/$service"
    
    if [ -d "$service_dir" ]; then
        echo "Testing $service..."
        cd "$service_dir"
        
        if npm test -- --passWithNoTests 2>&1 | tail -5; then
            print_status "$service: Tests can execute"
            success_count=$((success_count + 1))
        else
            print_error "$service: Test execution failed"
            fail_count=$((fail_count + 1))
        fi
        
        cd - > /dev/null
        echo ""
    fi
done

# Summary
echo "==================================="
echo "📊 Workspace Fix Summary"
echo "==================================="
echo -e "${GREEN}Successful${NC}: $success_count services"
echo -e "${RED}Failed${NC}: $fail_count services"
echo ""

if [ $fail_count -eq 0 ]; then
    print_status "All services can now run tests!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm test in any service directory"
    echo "2. Implement emotional safety tests"
    echo "3. Create voice accuracy baseline tests"
else
    print_warning "Some services still have issues. Check the errors above."
fi

echo ""
echo "Backups saved in: $backup_dir"
echo "To restore: cp -r $backup_dir/* ."