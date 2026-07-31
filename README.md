# Driven by Faith

A vocational discipleship app for automotive sales professionals. Daily devotionals, AI biblical coaching, prayer community, and situation guidance — built with Expo React Native.

## Stack

- **Frontend**: Expo React Native (SDK 57) + TypeScript (strict)
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind v4 (Tailwind)
- **State**: Zustand (local), TanStack Query (server)
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (Auth, Postgres, Edge Functions)
- **Payments**: RevenueCat
- **Offline**: Expo SQLite

## Getting Started

### Prerequisites

- Node.js 22+
- Expo CLI
- Supabase project (local or hosted)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key in .env

# Start the Expo dev server
npx expo start
```

### Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY` | RevenueCat Apple API key |
| `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` | RevenueCat Google API key |

### Supabase Backend

Migrations, RLS policies, seed data, and Edge Functions live in the `/supabase` directory. To apply:

```bash
supabase start          # local dev
supabase db reset       # apply migrations + seed
supabase functions serve coach --no-verify-jwt  # local function dev
```

The `coach` function calls the Anthropic API when an `ANTHROPIC_API_KEY` secret is
set on the function; without it, the coach falls back to a static response so the
app still runs end-to-end:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

## Project Structure

```
src/
  app/               # Expo Router routes
  components/        # Reusable UI components
  hooks/             # Custom hooks
  lib/               # Services (Supabase client)
  stores/            # Zustand stores
  types/             # TypeScript interfaces
  constants/         # Design tokens
supabase/
  migrations/        # SQL migration files
  seed.sql           # Seed data
  functions/         # Edge Functions
```

## Brand

- **Colors**: Warm neutrals (clay, sage, brass) on light parchment tones
- **Typography**: Warm serif (Georgia) for Scripture; geometric sans (Inter) for UI
- **Motion**: 200-300ms ease-out; respects reduced-motion
- **Copy**: Plain-spoken, short, respectful. No prosperity-gospel language

## Status

Auth, devotionals, the situation library, reading plans, AI coaching, prayer
groups, and progress/debrief tracking are wired end-to-end against the Supabase
schema in `/supabase`. Two pieces are intentionally not wired yet, since they
depend on accounts this repo can't provision:

- **RevenueCat purchases**: the `Paywall` component and premium-content gating
  are in place, but `Subscribe` doesn't call a real store purchase flow yet.
- **Offline sync (Expo SQLite)**: the dependency and `client_updated_at`
  columns are there for it, but there's no local write queue yet — the app is
  online-only for now.

## TypeScript

Strict mode enabled. No `any` types. Run checks:

```bash
npm run typecheck
npm run lint
```
