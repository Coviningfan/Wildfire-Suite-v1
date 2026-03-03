# Wildfire Suite - Replit Configuration

## Project Overview
Expo React Native app (web) for Wildfire Lighting. Features calculations, fixtures, AI tools, and resources for lighting professionals.

## Architecture
- **Framework**: Expo SDK 54 + Expo Router v6 (file-based routing)
- **Language**: TypeScript
- **Package Manager**: Bun
- **Renderer**: React Native Web (web platform)
- **Bundler**: Metro (configured in app.json)

## Directory Structure
```
app/           - Expo Router pages (auth, tabs)
components/    - Reusable UI components
constants/     - App constants (colors, theme, tutorials)
hooks/         - Custom React hooks
assets/        - Images and static assets
```

## Running the App
The app runs as a web application on port 5000:
```
bun run dev
# Runs: expo start --web --port 5000 --host lan
```

## Workflow
- **Start application**: `bun run dev` — Expo web server on port 5000

## Deployment
- Target: autoscale
- Run command: `bun run dev`
