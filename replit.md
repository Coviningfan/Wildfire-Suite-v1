# Wildfire Suite - Replit Configuration

## Project Overview
Expo React Native app (web) for Wildfire Lighting. Features UV lighting calculations, fixture catalog, AI insights, room simulation, and educational resources for lighting professionals.

## Architecture
- **Framework**: Expo SDK 54 + Expo Router v6 (file-based routing)
- **Language**: TypeScript
- **Package Manager**: Bun
- **Renderer**: React Native Web (web platform)
- **Bundler**: Metro (configured in app.json)
- **State Management**: Zustand with AsyncStorage persistence

## Directory Structure
```
app/              - Expo Router pages
  (auth)/         - Auth screens (welcome, login, register)
  (tabs)/         - Main app tabs
    (home)/       - Calculator tab (FLAME workflow)
    simulate/     - Room Simulation tab (dedicated screen)
    fixtures/     - Fixture catalog
    ai/           - AI insights
    calculations/ - Saved calculations (hidden tab, accessible from code)
    resources/    - Docs tab (tutorials, knowledge base, PDF resources)
    profile/      - User profile and settings
components/       - Reusable UI components
constants/        - App constants (colors, theme, tutorials, resources)
hooks/            - Custom React hooks
stores/           - Zustand stores (auth, lighting, settings, simulation)
utils/            - Utility functions
assets/           - Images and static assets
```

## Key Features
- **FLAME Calculator**: Fixture-Location-Angle-Material-Effect workflow for UV calculations
- **Room Simulation**: Dedicated tab with 2D/3D room visualization, fixture placement, heatmaps, and auto-layout
  - Layout: Room dims (collapsible) → Simulation viz → Zone summary → Fixture cards (collapsible)
  - Fixture cards have color dots matching simulation colors, expand/collapse with summary line
  - Side view renders fixtures at actual mounting height (not pinned to ceiling)
  - Fixture legend with color-coded irradiance values appears when 2+ fixtures exist
  - Web drag support via pointer events; native drag via PanResponder
  - State managed by `stores/simulation-store.ts` (persisted via AsyncStorage)
  - Calculator "Add to Simulation" CTA pushes fixtures to sim store
- **Tutorials System**: Two categories:
  - App Tutorials: Step-by-step guides tied to app features (7 tutorials)
  - Knowledge Base: Educational articles about UV science (7 articles)
- **Auto App Tour**: First-time users see the app walkthrough automatically
  - Demo accounts: Tour shown every login
  - Registered users: Tour shown once, can restart from Profile or Docs tab
- **QR Scanner**: Scan fixture labels to auto-populate calculator inputs

## Running the App
```
bun run dev
# Runs: expo start --web --port 5000 --host lan
```

## Workflow
- **Start application**: `bun run dev` — Expo web server on port 5000

## Deployment
- Target: autoscale
- Run command: `bun run dev`
