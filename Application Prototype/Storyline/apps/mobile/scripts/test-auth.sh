#!/bin/bash

# Authentication Test Runner Script
# Quick way to run authentication-related tests

echo "🧪 Storyline Authentication Test Suite"
echo "======================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the apps/mobile directory"
    exit 1
fi

# Function to run tests with better output
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo ""
    echo "🔍 Running $test_name..."
    echo "----------------------------------------"
    
    if npm test -- "$test_file" --verbose; then
        echo "✅ $test_name passed!"
    else
        echo "❌ $test_name failed!"
        exit 1
    fi
}

# Check if specific test is requested
if [ "$1" != "" ]; then
    case $1 in
        "service"|"auth-service")
            run_test "AuthService Unit Tests" "authService.test.ts"
            ;;
        "signin"|"sign-in")
            run_test "SignIn Screen Tests" "SignInScreen.test.tsx"
            ;;
        "signup"|"sign-up")
            run_test "SignUp Screen Tests" "SignUpScreen.test.tsx"
            ;;
        "e2e"|"flow")
            run_test "Authentication Flow E2E Tests" "authFlow.e2e.test.tsx"
            ;;
        "coverage")
            echo "📊 Running tests with coverage..."
            npm run test:coverage
            ;;
        *)
            echo "❓ Unknown test type: $1"
            echo "Available options: service, signin, signup, e2e, coverage"
            exit 1
            ;;
    esac
else
    # Run all authentication tests
    echo "🚀 Running all authentication tests..."
    
    run_test "AuthService Unit Tests" "authService.test.ts"
    run_test "SignIn Screen Tests" "SignInScreen.test.tsx"
    run_test "SignUp Screen Tests" "SignUpScreen.test.tsx"
    run_test "Authentication Flow E2E Tests" "authFlow.e2e.test.tsx"
    
    echo ""
    echo "🎉 All authentication tests passed!"
    echo ""
    echo "📊 Generate coverage report with: ./scripts/test-auth.sh coverage"
fi

echo ""
echo "✨ Authentication testing complete!"