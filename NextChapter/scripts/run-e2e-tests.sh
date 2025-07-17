#!/bin/bash

# E2E Test Runner Script for Next Chapter
# This script provides convenient commands for running Detox E2E tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
PLATFORM="ios"
CONFIGURATION="debug"
TEST_FILE=""
HEADLESS=false
RECORD=false
CLEANUP=false
USE_EAS=false

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platform <ios|android>    Platform to test on (default: ios)"
    echo "  -c, --configuration <debug|release>  Build configuration (default: debug)"
    echo "  -t, --test <test-file>          Specific test file to run"
    echo "  -h, --headless                  Run in headless mode"
    echo "  -r, --record                    Record videos of test runs"
    echo "  --cleanup                       Clean up test artifacts before running"
    echo "  --build-only                    Only build, don't run tests"
    echo "  --use-eas                       Use EAS Build artifacts"
    echo "  --help                          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                              # Run all iOS tests in debug mode"
    echo "  $0 -p android                   # Run all Android tests"
    echo "  $0 -t onboarding                # Run only onboarding tests"
    echo "  $0 -p ios -c release -h -r     # Run iOS release tests headless with recording"
    echo "  $0 --use-eas                    # Run tests using EAS Build artifacts"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -c|--configuration)
            CONFIGURATION="$2"
            shift 2
            ;;
        -t|--test)
            TEST_FILE="$2"
            shift 2
            ;;
        -h|--headless)
            HEADLESS=true
            shift
            ;;
        -r|--record)
            RECORD=true
            shift
            ;;
        --cleanup)
            CLEANUP=true
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --use-eas)
            USE_EAS=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_message $RED "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate platform
if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" ]]; then
    print_message $RED "Invalid platform: $PLATFORM"
    show_usage
    exit 1
fi

# Validate configuration
if [[ "$CONFIGURATION" != "debug" && "$CONFIGURATION" != "release" ]]; then
    print_message $RED "Invalid configuration: $CONFIGURATION"
    show_usage
    exit 1
fi

# Clean up if requested
if [ "$CLEANUP" = true ]; then
    print_message $YELLOW "Cleaning up test artifacts..."
    rm -rf e2e/artifacts
    rm -rf e2e/reports
    
    if [ "$PLATFORM" = "ios" ]; then
        rm -rf ios/build
    else
        cd android && ./gradlew clean && cd ..
    fi
fi

# Check if Detox CLI is installed
if ! command -v detox &> /dev/null; then
    print_message $RED "Detox CLI not found. Installing..."
    npm install -g detox-cli
fi

# Platform-specific setup
if [ "$USE_EAS" = true ]; then
    # EAS Build configuration
    if [ "$PLATFORM" = "ios" ]; then
        CONFIG_NAME="ios.sim.eas"
        
        # Check for EAS build path
        if [ -z "$EAS_BUILD_IOS_PATH" ]; then
            print_message $RED "EAS_BUILD_IOS_PATH not set!"
            print_message $YELLOW "Please set: export EAS_BUILD_IOS_PATH=/path/to/NextChapter.app"
            exit 1
        fi
        
        if [ ! -d "$EAS_BUILD_IOS_PATH" ]; then
            print_message $RED "iOS build not found at: $EAS_BUILD_IOS_PATH"
            exit 1
        fi
    else
        CONFIG_NAME="android.emu.eas"
        
        # Check for EAS build path
        if [ -z "$EAS_BUILD_ANDROID_PATH" ]; then
            print_message $RED "EAS_BUILD_ANDROID_PATH not set!"
            print_message $YELLOW "Please set: export EAS_BUILD_ANDROID_PATH=/path/to/app-release.apk"
            exit 1
        fi
        
        if [ ! -f "$EAS_BUILD_ANDROID_PATH" ]; then
            print_message $RED "Android build not found at: $EAS_BUILD_ANDROID_PATH"
            exit 1
        fi
    fi
else
    # Local build configuration
    if [ "$PLATFORM" = "ios" ]; then
        CONFIG_NAME="ios.sim.$CONFIGURATION"
        
        # Check if simulator is running
        if ! xcrun simctl list | grep -q "Booted"; then
            print_message $YELLOW "Starting iOS Simulator..."
            open -a Simulator
            sleep 5
        fi
    else
        CONFIG_NAME="android.emu.$CONFIGURATION"
        
        # Check if emulator is running
        if ! adb devices | grep -q "emulator"; then
            print_message $YELLOW "No Android emulator detected. Please start an emulator first."
            print_message $YELLOW "You can start one with: emulator -avd Pixel_7_API_33"
            exit 1
        fi
    fi
fi

# Build the app (skip if using EAS)
if [ "$USE_EAS" = false ]; then
    print_message $GREEN "Building app for $PLATFORM ($CONFIGURATION)..."
    if [ "$PLATFORM" = "ios" ]; then
        npm run test:e2e:build:ios
    else
        npm run test:e2e:build:android
    fi
else
    print_message $GREEN "Using EAS Build artifacts..."
fi

# Exit if build-only
if [ "$BUILD_ONLY" = true ]; then
    print_message $GREEN "Build completed successfully!"
    exit 0
fi

# Prepare test command
TEST_CMD="detox test --configuration $CONFIG_NAME"

# Add test file if specified
if [ -n "$TEST_FILE" ]; then
    # Check if it's a full path or just a test name
    if [[ "$TEST_FILE" == *".e2e.ts" ]]; then
        TEST_CMD="$TEST_CMD $TEST_FILE"
    else
        TEST_CMD="$TEST_CMD e2e/tests/${TEST_FILE}.e2e.ts"
    fi
fi

# Add headless flag
if [ "$HEADLESS" = true ]; then
    TEST_CMD="$TEST_CMD --headless"
fi

# Add recording flag
if [ "$RECORD" = true ]; then
    TEST_CMD="$TEST_CMD --record-videos all --record-logs all"
fi

# Add cleanup flag
if [ "$CLEANUP" = true ]; then
    TEST_CMD="$TEST_CMD --cleanup"
fi

# Run tests
print_message $GREEN "Running E2E tests..."
print_message $YELLOW "Command: $TEST_CMD"

# Create reports directory
mkdir -p e2e/reports

# Run the tests and capture exit code
set +e
$TEST_CMD
TEST_EXIT_CODE=$?
set -e

# Generate report
if [ -f "e2e/reports/junit.xml" ]; then
    print_message $GREEN "Test report generated at: e2e/reports/junit.xml"
fi

# Show artifacts location if tests failed
if [ $TEST_EXIT_CODE -ne 0 ]; then
    print_message $RED "Tests failed!"
    
    if [ -d "e2e/artifacts" ]; then
        print_message $YELLOW "Test artifacts (screenshots, videos) saved to: e2e/artifacts/"
        
        # List artifacts
        echo "Artifacts:"
        find e2e/artifacts -type f -name "*.png" -o -name "*.mp4" | head -20
    fi
else
    print_message $GREEN "All tests passed!"
fi

exit $TEST_EXIT_CODE