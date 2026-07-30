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
- Bun (recommended) or npm
- Expo CLI (`npx expo`)
- Supabase CLI (`supabase`) for local backend development

### Setup

```bash
# Clone the repository
git clone https://github.com/SaveEveryKid/DrivenbyFaith.git
cd DrivenbyFaith

# Install dependencies
bun install

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

### Supabase Setup

Migrations, RLS policies, seed data, and Edge Functions live in `/supabase`.

```bash
# Start local Supabase
supabase start

# Apply migrations and seed data
supabase db reset

# Serve Edge Functions locally
supabase functions serve coach --no-verify-jwt
supabase functions serve delete-account --no-verify-jwt

# Deploy Edge Functions to hosted project
supabase functions deploy coach
supabase functions deploy delete-account
```

For a hosted Supabase project:
1. Create a project at [supabase.com](https://supabase.com)
2. Copy the project URL and anon key to your `.env`
3. Run `supabase link --project-ref <your-project-ref>`
4. Push migrations: `supabase db push`
5. Deploy Edge Functions: `supabase functions deploy <name>`

### RevenueCat Setup

1. Create a project at [revenuecat.com](https://www.revenuecat.com)
2. Add your Apple App Store Connect and Google Play Console API keys
3. Configure entitlements (e.g., `premium`) matching the paywall in the app
4. Copy the Apple and Google API keys to `.env`

## Testing

```bash
# TypeScript type checking
npx tsc --noEmit

# Lint
npx eslint .

# Run tests
npx jest
```

## Build & Submission

### iOS (TestFlight)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for internal distribution
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios --profile production
```

Pre-requisites:
- Apple Developer account ($99/year)
- App ID created in App Store Connect
- EAS credentials configured (`eas credentials`)

### Android (Play Console)

```bash
# Build APK for internal testing
eas build --platform android --profile preview

# Build app bundle for production
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android --profile production
```

Pre-requisites:
- Google Play Console account ($25 one-time)
- App created in Play Console
- EAS credentials configured (`eas credentials`)

## External Credentials Needed

| Service | What You Need | Purpose |
|---|---|---|
| **Supabase** | Project URL + anon key | Auth, database, edge functions |
| **RevenueCat** | Apple & Google API keys | Subscription management |
| **Apple Developer** | $99/year account | iOS app signing and App Store distribution |
| **Google Play Console** | $25 one-time account | Android app distribution |

## Project Structure

```
driven-by-faith/
├── src/
│   ├── app/                      # Expo Router routes
│   │   ├── (auth)/               # Auth screens (login, signup, onboarding)
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   ├── signup.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   └── onboarding.tsx
│   │   ├── (tabs)/               # Main tab screens
│   │   │   ├── _layout.tsx
│   │   │   ├── today.tsx         # Home / daily devotional
│   │   │   ├── library.tsx       # Past devotionals
│   │   │   ├── coach.tsx         # AI biblical coach
│   │   │   ├── prayer.tsx        # Prayer community
│   │   │   └── progress.tsx      # Streaks and growth
│   │   ├── devotional/           # Devotional reader
│   │   │   └── [id].tsx
│   │   ├── settings.tsx          # Settings screen
│   │   └── _layout.tsx           # Root layout
│   ├── components/               # Reusable UI components
│   │   ├── AudioMiniPlayer.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   ├── GhostButton.tsx
│   │   ├── OfflineChip.tsx
│   │   ├── Paywall.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── ScriptureBlock.tsx
│   │   └── index.ts
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useDevotional.ts
│   │   ├── useNetwork.ts
│   │   ├── useOfflineDevotional.ts
│   │   ├── useProfile.ts
│   │   ├── useReducedMotion.ts
│   │   ├── useTheme.ts
│   │   └── index.ts
│   ├── lib/                      # Services
│   │   ├── AuthProvider.tsx
│   │   ├── SyncProvider.tsx
│   │   ├── offlineDb.ts
│   │   ├── supabase.ts
│   │   ├── supabaseStorage.ts
│   │   └── syncEngine.ts
│   ├── stores/                   # Zustand stores
│   │   ├── themeStore.ts
│   │   └── index.ts
│   ├── types/                    # TypeScript interfaces
│   │   ├── database.ts
│   │   ├── navigation.ts
│   │   ├── ui.ts
│   │   └── index.ts
│   └── constants/                # Design tokens
│       └── theme.ts              # Palette, typography, motion, spacing
├── supabase/
│   ├── migrations/               # SQL migration files
│   ├── seed.sql                  # Seed data (14 devotionals)
│   └── functions/                # Edge Functions
│       ├── _shared/
│       │   └── cors.ts
│       ├── coach/
│       │   └── index.ts
│       └── delete-account/
│           └── index.ts
├── eas.json                      # EAS Build configuration
├── .env.example                  # Environment variable template
├── app.json                      # Expo configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Brand

- **Colors**: Warm neutrals (clay, sage, brass) on light parchment tones
- **Typography**: Warm serif (Georgia) for Scripture; geometric sans (Inter) for UI
- **Motion**: 200-300ms ease-out; respects reduced-motion
- **Copy**: Plain-spoken, short, respectful. No prosperity-gospel language

## TypeScript

Strict mode enabled. No `any` types. Run checks:

```bash
npx tsc --noEmit
npx eslint .
npx jest
```
