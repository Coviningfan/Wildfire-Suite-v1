# Wildfire Suite - Replit Configuration

## Project Overview
Expo React Native app (web) for Wildfire Lighting professionals. Features UV lighting calculations, fixture catalog, AI insights, room simulation, and educational resources. All data stored locally via AsyncStorage.

## Architecture
- **Framework**: Expo SDK 54 + Expo Router v6 (file-based routing)
- **Language**: TypeScript (~5.7.2)
- **Package Manager**: Bun
- **Renderer**: React Native Web (web platform)
- **Bundler**: Metro (configured in app.json)
- **State Management**: Zustand with AsyncStorage persistence
- **Authentication**: Local auth with demo accounts (email/password hashed via expo-crypto)
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
  - Drag clamped to fixture marker position (0.1m inset), not beam edge
  - Drag uses `onFixturePositionChange(id, x, z)` for atomic position updates
  - State managed by `stores/simulation-store.ts` (persisted via AsyncStorage)
  - `updateFixture` restricted from xPos/zPos fields; use `updateFixturePosition` for positions
  - New fixtures default to room center position
  - Heatmap uses beam cone check (beam_h_deg) — only illuminated cells receive irradiance
  - People readouts also use beam cone check for accurate exposure readings
  - Reset positions notifies parent via `onFixturePositionChange` for all fixtures
  - Coverage metric shows actual percentage (no artificial cap)
  - ISO view shows labels for all fixtures (not limited to first 3)
- **Tutorials System**: Two categories:
  - App Tutorials: Step-by-step guides tied to app features (7 tutorials)
  - Knowledge Base: Educational articles about UV science (7 articles)
  - All irradiance values in mW/m² (consistent with app calculator units)
- **Auto App Tour**: First-time users see the app walkthrough automatically
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

## Authentication
- **Provider**: Local (AsyncStorage-based with SHA-256 hashed passwords)
- **Demo accounts**: `demo@example.com` / `password123`, `admin@example.com` / `admin123`
- **Apple Sign In**: Available on iOS devices
- **Biometric Login**: Requires successful authentication challenge before enabling
- **Route Protection**: Tab layout redirects to auth if not authenticated; auth layout redirects to home if authenticated
- **Zustand persists**: user, isAuthenticated, isAdmin, biometricEnabled

## Theme System
- Auth screens and FixtureDetailModal use `useThemeColors()` for dynamic light/dark support
- FixtureCard DMX badge colors use `colors.accentLight` / `colors.success` from theme
- Dark mode `warning` color (`#EAB308`) distinct from `secondary` (`#F5A623`) for safety visibility
- Settings store defaults to OS theme on first launch via `Appearance.getColorScheme()`
- UB series color uses theme `focus` (`#3B82F6`) instead of hardcoded hex

## Safety Thresholds (Single Source of Truth)
All safety threshold logic imports from `types/lighting.ts`:
- `SAFETY_THRESHOLDS`: `{ danger: 25000, warning: 10000, caution: 2500 }` (mW/m²)
- `SAFETY_LABELS`: Human-readable descriptions for each level
- Used by: `lighting-store`, `file-helpers`, `RoomSimulation`, `FixtureCoverageCard`

## ResultCard
- `formatLabel` regex uses case-insensitive patterns to handle title-cased unit suffixes (MWm2 → mW/m²)
- Large numbers (≥1000) show as rounded integers with locale separators; smaller values use 2 decimal places

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
- Displays user name/email from local auth store
- Fixture count stat card dynamically reads from `LightingCalculator.getFixtureModels().length`
- Sign Out clears auth state and navigates to welcome screen

## App Configuration
- **Bundle ID (iOS)**: `com.wildfirelighting.suite`
- **Package (Android)**: `com.wildfirelighting.suite`
- **URL Scheme**: `wildfire-suite`
- **Expo Router Origin**: `https://wildfirelighting.com/`
- **Plugins**: expo-router, expo-font, expo-web-browser, expo-camera, expo-local-authentication

## Running the App
```
bun run dev
# Starts Expo dev server on port 5000 with ngrok tunnel for Expo Go
```

## Workflow
- **Start application**: `bun run dev` — Starts Expo dev server on port 5000 with tunnel mode

## Deployment
- Target: static
- Build command: `bun run build:web` (runs `expo export --platform web`)
- Public directory: `dist`
