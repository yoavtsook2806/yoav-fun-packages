# Yoav Fun Packages

A monorepo containing fun and useful packages.

## Packages

### matan-trainings

A simple training tracker PWA that helps track sets, rest times, and progress through different workout routines.

**Features:**
- Choose between training types A, B, and C
- Customizable rest time between sets
- Timer countdown for rest periods
- Progress tracking through exercises
- PWA support for mobile installation
- Hebrew interface

**Usage:**
```bash
# Run the training app
yarn dev

# Build for production
yarn build
```

## Development

This project uses:
- Yarn workspaces for package management
- React + TypeScript
- Vite for build tooling
- PWA capabilities via vite-plugin-pwa

### Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start development server:
   ```bash
   yarn dev
   ```

3. Build for production:
   ```bash
   yarn build
   ```
