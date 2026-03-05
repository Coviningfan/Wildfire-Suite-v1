# Wildfire Suite - Replit Configuration

## Project Overview
Expo React Native app (web) for Wildfire Lighting professionals. Features UV lighting calculations, fixture catalog, AI insights, room simulation, and educational resources.

## Architecture
- **Framework**: Expo SDK 54 + Expo Router v6 (file-based routing)
- **Language**: TypeScript (~5.7.2)
- **Package Manager**: Bun
- **Renderer**: React Native Web (web platform)
- **Bundler**: Metro (configured in app.json)
- **State Management**: Zustand with AsyncStorage persistence
- **New Architecture**: Disabled (compatibility concerns with some packages)

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
types/            - TypeScript types and shared constants (safety thresholds)
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
  - Drag uses `onFixturePositionChange(id, x, z)` for atomic position updates
  - State managed by `stores/simulation-store.ts` (persisted via AsyncStorage)
  - `updateFixture` restricted from xPos/zPos fields; use `updateFixturePosition` for positions
  - New fixtures default to room center position
- **Tutorials System**: Two categories:
  - App Tutorials: Step-by-step guides tied to app features (7 tutorials)
  - Knowledge Base: Educational articles about UV science (7 articles)
- **Auto App Tour**: First-time users see the app walkthrough automatically
  - Demo accounts: Tour shown once per session (ref-guarded)
  - Registered users: Tour shown once, can restart from Profile or Docs tab
- **Saved Calculations**: History screen accessible via:
  - History button (clock icon with badge) in Calculator top bar
  - Tappable "Calculations" stat card on Profile screen
  - Hidden from tab bar (`href: null`), navigated to via `router.push`
  - Capped at 200 entries with FIFO eviction
  - `loadCalculation` sets `showingPreview: true` and auto-navigates to Calculator tab
  - `lastCalculation` is persisted across app kills
- **QR Scanner**: Scan fixture labels to auto-populate calculator inputs
  - Uses `useThemeColors()` for dynamic theme support
  - Safe area aware (`insets.top + 16`)
  - Proper setTimeout cleanup on unmount
- **Fixture Comparison**: Compare up to 3 fixtures side-by-side
  - Uses active calculator throw distance (from verticalHeight), fallback 3m
  - EM-44V/EM-43E correctly show DMX 512/RDM control type

## Authentication & Security
- **Splash Screen**: Waits for Zustand persist hydration before hiding; prevents login flash
- **Route Protection**: Tab layout redirects to auth if not authenticated; auth layout redirects to home if authenticated
- **Password Storage**: SHA256 hashed via `expo-crypto` (never stored in plaintext)
- **Apple Sign In**: Accounts flagged with `authProvider: 'apple'`, excluded from password login
- **Biometric Login**: Requires successful authentication challenge before enabling
- **User IDs**: Generated via `Crypto.randomUUID()` from `expo-crypto`
- **Calculation IDs**: Generated via `Crypto.randomUUID()` from `expo-crypto`
- **Registration Validation**: Email regex, 8-char minimum password, confirm password toggle
- **Admin**: Client-side only, cosmetic — not meaningful access control

## Theme System
- Auth screens use `useThemeColors()` for dynamic light/dark support
- Dark mode `warning` color (`#EAB308`) distinct from `secondary` (`#F5A623`) for safety visibility
- Settings store defaults to OS theme on first launch via `Appearance.getColorScheme()`
- UB series color uses theme `focus` (`#3B82F6`) instead of hardcoded hex

## Safety Thresholds (Single Source of Truth)
All safety threshold logic imports from `types/lighting.ts`:
- `SAFETY_THRESHOLDS`: `{ danger: 25000, warning: 10000, caution: 2500 }` (mW/m²)
- `SAFETY_LABELS`: Human-readable descriptions for each level
- Used by: `lighting-store`, `file-helpers`, `RoomSimulation`, `FixtureCoverageCard`

## Error Handling
- All tab layouts wrapped in `<ErrorBoundary>` with contextual fallback messages
- AsyncStorage read failures in hooks default to showing onboarding/tour
- File exports properly `await` file creation and writes before sharing
- Resource external links show error alert on failure instead of silent catch

## File Exports
- Text reports and CSV exports include unit-aware labels (metric/imperial)
- Share text uses unit-converted values (not always meters)
- EM-44V and EM-43E correctly listed as DMX 512/RDM control type
- BLB lamp models have correct manual and store URLs

## Profile
- Fixture count stat card dynamically reads from `LightingCalculator.getFixtureModels().length`
- Debug console.log gated behind `__DEV__`
- Demo credentials extracted to constants

## App Configuration
- **Bundle ID (iOS)**: `com.wildfirelighting.suite`
- **Package (Android)**: `com.wildfirelighting.suite`
- **URL Scheme**: `wildfire-suite`
- **Expo Router Origin**: `https://wildfirelighting.com/`
- **Plugins**: expo-router, expo-font, expo-web-browser, expo-camera, expo-local-authentication

## Running the App
```
bun run dev
# Runs: expo start --web --port 5000 --host lan
```

## Environment Variables
See `.env.example` for required variables:
- `EXPO_PUBLIC_RORK_API_BASE_URL` — AI toolkit API base
- `EXPO_PUBLIC_TOOLKIT_URL` — AI toolkit URL
- `EXPO_PUBLIC_PROJECT_ID` — Project identifier
- `EXPO_PUBLIC_TEAM_ID` — Team identifier

## Workflow
- **Start application**: `bun run dev` — Expo web server on port 5000

## Deployment
- Target: autoscale
- Run command: `bun run dev`
