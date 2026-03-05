# Wildfire Suite - Replit Configuration

## Project Overview
Expo React Native app (web) for Wildfire Lighting professionals. Features UV lighting calculations, fixture catalog, AI insights, room simulation, and educational resources. Backed by Express API server with PostgreSQL database and Replit Auth (OIDC).

## Architecture
- **Framework**: Expo SDK 54 + Expo Router v6 (file-based routing)
- **Language**: TypeScript (~5.7.2)
- **Package Manager**: Bun
- **Renderer**: React Native Web (web platform)
- **Bundler**: Metro (configured in app.json)
- **State Management**: Zustand with AsyncStorage persistence (local preferences only)
- **Backend**: Express API server (port 5000, proxies to Expo on port 3000)
- **Database**: PostgreSQL (Drizzle ORM)
- **Authentication**: Replit Auth (OIDC) — Google, GitHub, Apple, email/password
- **New Architecture**: Disabled (compatibility concerns with some packages)

## Server Architecture
```
server/start.ts          - Startup orchestrator (starts Expo then Express)
server/index.ts          - Express API server (port 5000)
  - Serves /api/* routes directly
  - Proxies all other requests to Expo dev server (port 3000)
  - WebSocket upgrade support for Metro HMR
server/db.ts             - PostgreSQL connection pool (Drizzle)
server/replit_integrations/auth/  - Replit Auth OIDC module
  - replitAuth.ts        - Passport + OpenID Connect setup
  - storage.ts           - User database operations (getUser, upsertUser)
  - routes.ts            - GET /api/auth/user endpoint
  - index.ts             - Re-exports
shared/schema.ts         - Drizzle schema exports
shared/models/auth.ts    - Users and sessions table definitions
drizzle.config.ts        - Drizzle Kit configuration
```

## Auth Flow
1. User clicks "Sign In" → `window.location.href = '/api/login'`
2. Express redirects to Replit OIDC provider
3. User authenticates with Google/GitHub/Apple/email
4. Callback at `/api/callback` creates session + upserts user in PostgreSQL
5. Redirect to `/` → frontend calls `GET /api/auth/user` → gets user object
6. Zustand auth-store sets `isAuthenticated: true` with server user data
7. Logout: `window.location.href = '/api/logout'` → clears session

## Database Schema
- **users**: id (varchar, PK), email, first_name, last_name, profile_image_url, created_at, updated_at
- **sessions**: sid (varchar, PK), sess (jsonb), expire (timestamp) — used by connect-pg-simple

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
server/           - Express API server + Replit Auth
shared/           - Shared types and database schema
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
- **Provider**: Replit Auth (OIDC) — supports Google, GitHub, Apple, email/password
- **Session Storage**: PostgreSQL via connect-pg-simple (7-day TTL)
- **Frontend Auth Store**: Zustand persists only `biometricEnabled` locally; user session from server
- **Splash Screen**: Waits for `initializeAuth()` (fetches `/api/auth/user`) before hiding
- **Route Protection**: Tab layout redirects to auth if not authenticated; auth layout redirects to home if authenticated
- **Biometric Login**: Requires successful authentication challenge before enabling
- **No custom login forms**: All auth handled by Replit OIDC redirect

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
- Displays user name/email from server session (firstName + lastName)
- Fixture count stat card dynamically reads from `LightingCalculator.getFixtureModels().length`
- Sign Out navigates to `/api/logout`

## App Configuration
- **Bundle ID (iOS)**: `com.wildfirelighting.suite`
- **Package (Android)**: `com.wildfirelighting.suite`
- **URL Scheme**: `wildfire-suite`
- **Expo Router Origin**: `https://wildfirelighting.com/`
- **Plugins**: expo-router, expo-font, expo-web-browser, expo-camera, expo-local-authentication

## Running the App
```
bun run server/start.ts
# Starts Expo dev server on port 3000, then Express API server on port 5000
# Express proxies non-API requests to Expo
```

## Database Commands
```
bun run db:push          # Push schema changes to database
```

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` — Session encryption key (auto-provisioned)
- `REPL_ID` — Replit project ID (auto-set)
- `ISSUER_URL` — OIDC issuer (defaults to https://replit.com/oidc)
- `EXPO_PUBLIC_RORK_API_BASE_URL` — AI toolkit API base
- `EXPO_PUBLIC_TOOLKIT_URL` — AI toolkit URL
- `EXPO_PUBLIC_PROJECT_ID` — Project identifier
- `EXPO_PUBLIC_TEAM_ID` — Team identifier

## Workflow
- **Start application**: `bun run server/start.ts` — Starts both Expo + Express

## Deployment
- Target: autoscale
- Run command: `bun run server/start.ts`
