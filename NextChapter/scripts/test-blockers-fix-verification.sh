#!/bin/bash

# Test Blockers Fix Verification Script
# This script tests the fixes for the identified blockers

echo "================================================"
echo "Test Blockers Fix Verification"
echo "================================================"
echo ""

# Set NODE_ENV to test
export NODE_ENV=test

# Run specific tests to verify fixes
echo "1. Testing Zustand store initialization..."
npm test -- src/stores/__tests__/bouncePlanStore.test.ts --verbose 2>&1 | grep -E "(PASS|FAIL|TypeError|store.getState)" | head -20

echo ""
echo "2. Testing OfflineContext (dynamic imports)..."
npm test -- src/context/__tests__/OfflineContext.test.tsx --verbose 2>&1 | grep -E "(PASS|FAIL|dynamic import|experimental-vm-modules)" | head -20

echo ""
echo "3. Testing clearInterval availability..."
npm test -- src/context/__tests__/OfflineContext.test.tsx --testNamePattern="cleanup intervals" --verbose 2>&1 | grep -E "(PASS|FAIL|clearInterval|not defined)" | head -20

echo ""
echo "4. Testing network state updates..."
npm test -- src/context/__tests__/OfflineContext.test.tsx --testNamePattern="network status" --verbose 2>&1 | grep -E "(PASS|FAIL|network|NetInfo)" | head -20

echo ""
echo "5. Testing act warnings..."
npm test -- src/stores/__tests__/bouncePlanStore.test.ts --verbose 2>&1 | grep -E "(act\(\)|Warning:|An update to)" | head -20

echo ""
echo "================================================"
echo "Running full test suite for these files..."
echo "================================================"
echo ""

# Run the full tests for the fixed files
npm test -- src/stores/__tests__/bouncePlanStore.test.ts src/context/__tests__/OfflineContext.test.tsx --coverage --verbose

echo ""
echo "================================================"
echo "Fix Verification Complete"
echo "================================================"