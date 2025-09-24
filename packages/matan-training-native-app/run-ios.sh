#!/bin/bash

# Script to run React Native app on iOS simulator
# This script handles iOS version compatibility issues

echo "🚀 Starting React Native iOS app..."

# Start Metro bundler in background if not running
if ! curl -s http://localhost:8081/status > /dev/null 2>&1; then
    echo "📱 Starting Metro bundler..."
    yarn start &
    sleep 3
fi

# Try to run with Expo first (most reliable)
echo "📱 Attempting to run with Expo..."
if yarn ios; then
    echo "✅ App launched successfully!"
    exit 0
fi

echo "⚠️  Expo iOS build failed. This is likely due to iOS SDK version compatibility."
echo "🔧 To fix this, you need to install iOS 18.5 simulator runtime in Xcode."
echo ""
echo "📋 Manual fix steps:"
echo "1. Open Xcode"
echo "2. Go to Xcode → Settings → Platforms"
echo "3. Download and install iOS 18.5 Simulator"
echo "4. Run 'yarn native:ios' again"
echo ""
echo "🎯 Alternative: Use Expo Go for development (recommended):"
echo "1. Install 'Expo Go' app on your iPhone"
echo "2. Run 'yarn native:start'"
echo "3. Scan QR code with Expo Go"
echo "4. App will load instantly on your phone!"
echo ""
echo "📱 The development server is running on http://localhost:8081"
echo "✅ You can test the app in your browser or with Expo Go right now!"
