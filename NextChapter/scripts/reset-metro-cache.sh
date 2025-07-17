#!/bin/bash

echo "🧹 Resetting Metro bundler and React Native caches..."

# Kill any running Metro processes
echo "1. Killing Metro processes..."
pkill -f "metro" || true

# Clear watchman watches
echo "2. Clearing watchman..."
watchman watch-del-all 2>/dev/null || true

# Clear Metro cache
echo "3. Clearing Metro cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true

# Clear React Native cache
echo "4. Clearing React Native cache..."
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

# Clear Expo cache
echo "5. Clearing Expo cache..."
rm -rf ~/.expo/cache 2>/dev/null || true

# Clear node modules cache
echo "6. Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# Clear iOS build cache (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "7. Clearing iOS build cache..."
    rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null || true
fi

echo "✅ All caches cleared!"
echo ""
echo "Next steps:"
echo "1. Run: npx expo start -c"
echo "2. If issues persist, try: rm -rf node_modules && npm install"