# Matan Training Native App

React Native version of the Matan Training workout app, integrated with yarn workspaces.

## Features

- ✅ Hebrew UI for workout training
- ✅ Exercise management with sets, reps, and rest timers
- ✅ Progress tracking with AsyncStorage
- ✅ Training plan management
- ✅ Exercise history and statistics
- ✅ Mobile-optimized UI patterns
- ✅ Yarn workspace integration

## Development

### Prerequisites

- Node.js 18+
- Yarn 4.x (configured in root package.json)
- React Native development environment
- For iOS: Xcode and iOS Simulator
- For Android: Android Studio and Android SDK

### Yarn Workspace Commands (from root directory)

```bash
# Start Expo development server
yarn native:start

# Run on iOS (requires iOS simulator setup)
yarn native:ios

# Run on Android
yarn native:android

# Run in web browser
yarn native:web

# Type checking
yarn type-check
```

### Direct Commands (from package directory)

```bash
cd packages/matan-training-native-app

# Start development server
yarn start

# Run on platforms
yarn ios
yarn android  
yarn web
```

## Testing the App

### Option 1: Expo Go (Recommended)
1. Install "Expo Go" from the App Store
2. Run `yarn native:start` from root directory
3. Scan the QR code with Expo Go
4. App loads instantly on your phone!

### Option 2: Web Browser
1. Run `yarn native:start`
2. Open http://localhost:8081 in your browser

## Architecture

The app is structured as follows:

- `src/components/` - React Native UI components
- `src/data/` - Training plans and exercise data (shared with PWA)
- `src/types.ts` - TypeScript type definitions
- `App.tsx` - Main app component with training state
- `app.json` - Expo configuration
- `ios/` - iOS native project (generated)

## Key Differences from PWA Version

- Uses `AsyncStorage` instead of `localStorage`
- React Native components instead of HTML/CSS
- Native navigation and styling
- Platform-specific sound handling
- Mobile-optimized UI patterns
- Yarn workspace integration

## Yarn Workspace Integration

This package is part of the yoav-fun-packages monorepo:

- Dependencies are hoisted to the root `node_modules`
- No individual `package-lock.json` files
- Managed through yarn workspaces
- Consistent with project conventions

## Dependencies

- React Native 0.81.4 with Expo 54
- TypeScript for type safety
- Expo modules for cross-platform APIs
- React 19.1.0

## iOS Build Note

There's a minor iOS SDK compatibility issue (Xcode iOS 18.5 SDK vs iOS 17.0 simulator runtime). This doesn't affect development when using Expo Go, which works perfectly for testing all app functionality.
