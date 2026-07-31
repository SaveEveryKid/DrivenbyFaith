# Driven by Faith

A vocational discipleship app for automotive sales professionals. Daily devotionals, AI biblical coaching, prayer community, and situation guidance — built with Expo React Native.

## Stack

- **Frontend**: Expo React Native (SDK 57) + TypeScript (strict)
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind v4 (Tailwind CSS v3)
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
- Supabase CLI for local backend development
- EAS CLI for builds (`npm install -g eas-cli`)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/SaveEveryKid/DrivenbyFaith.git
cd DrivenbyFaith

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and RevenueCat keys

# Start the Expo dev server
npx expo start
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://abc123.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY` | RevenueCat Apple API key |
| `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` | RevenueCat Google API key |
| `EXPO_PUBLIC_PROJECT_ID` | Your Expo project ID (for push notifications) |

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note the project URL and anon key from Settings → API
3. Add them to your `.env` file

### 2. Run Migrations

Migrations are in `/supabase/migrations`. Run them in order:

```bash
# Link your local project to the hosted Supabase project
supabase link --project-ref <your-project-ref>

# Push all migrations to the database
supabase db push

# Or, with a local Supabase instance:
supabase start
supabase db reset
```

Migrations (`001` through `006`):
- `001_initial_schema.sql` — Core tables (profiles, devotionals, completions, situations, debriefs, etc.)
- `002_add_prayer_duration.sql` — Prayer duration tracking
- `002_prayer_community_functions.sql` — Prayer group RPC functions
- `003_add_line_updated_at.sql` — Timestamp for "line won't cross" updates
- `004_add_confession_repair.sql` — Confession & repair (28th day practice)
- `005_notifications.sql` — Push notification token storage
- `006_rotating_content.sql` — Rotating content system (get_todays_devotional RPC, date-keyed completions)

### 3. Seed Data

```bash
# Apply seed data (150 devotionals, situations, reading plans)
supabase db reset
# The seed_full.sql file is referenced in supabase/config.toml or run manually:
# psql <connection-string> < supabase/seed_full.sql
```

Alternatively, connect to your Supabase SQL editor and run the contents of `supabase/seed_full.sql`.

### 4. Deploy Edge Functions

```bash
supabase functions deploy coach --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
```

Edge Functions are in `/supabase/functions/`:
- `coach/` — AI biblical coaching (proxies to OpenAI)
- `delete-account/` — GDPR-compliant account deletion

## RevenueCat Setup

1. Create a project at [revenuecat.com](https://www.revenuecat.com)
2. Add your Apple App Store Connect and Google Play Console API keys
3. Create an entitlement called `premium`
4. Create offerings with monthly and annual subscription products
5. Copy the Apple and Google API keys to your `.env` file

## Build & Submission

### Prerequisites

- **Apple Developer Program** ($99/year) for iOS distribution
- **Google Play Console** ($25 one-time) for Android distribution
- EAS CLI: `npm install -g eas-cli`

### iOS (TestFlight)

```bash
# Configure EAS credentials (one-time)
eas credentials

# Build for TestFlight
eas build --platform ios --profile preview

# Submit to App Store
eas submit --platform ios --profile production
```

### Android (Play Console)

```bash
# Build APK for internal testing
eas build --platform android --profile preview

# Build app bundle for production
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android --profile production
```

### Build Profiles

Edit `eas.json` to customize build profiles. The default profiles are:
- `development` — Development client (debuggable)
- `preview` — Internal distribution (TestFlight / APK)
- `production` — Store submission (App Store / Play Console)

## Local Development

```bash
# Start the app
npx expo start

# Type checking
npx tsc --noEmit

# Lint
npx eslint .

# Format
npx prettier --write "src/**/*.{ts,tsx}"
```

## Project Structure

```
driven-by-faith/
├── src/
│   ├── app/                      # Expo Router routes (42 screens)
│   │   ├── (auth)/               # Auth screens (login, signup, onboarding)
│   │   ├── (tabs)/               # Main tab screens (today, library, coach, prayer, progress)
│   │   ├── devotional/           # Devotional reader
│   │   ├── debrief/              # Deal debrief (daily reflection)
│   │   ├── discussions/          # Community discussions
│   │   ├── memory/               # Memory verses with SM-2 spaced repetition
│   │   ├── plans/                # Reading plans
│   │   ├── prayer/               # Prayer groups & requests
│   │   ├── progress/             # Progress dashboard & year in review
│   │   ├── saturday-ready/       # Saturday Ready weekly preparation
│   │   ├── settings/             # Settings, notifications, privacy, security, terms
│   │   └── situation/            # Situation library
│   ├── components/               # Reusable UI components
│   ├── hooks/                    # Custom hooks (20 hooks)
│   ├── lib/                      # Services (11 lib files)
│   ├── stores/                   # Zustand stores
│   ├── types/                    # TypeScript type definitions
│   └── constants/                # Design tokens (palette, typography, motion, spacing)
├── supabase/
│   ├── migrations/               # SQL migration files (001-006)
│   ├── seed_full.sql             # Seed data (150 devotionals)
│   └── functions/                # Edge Functions (coach, delete-account)
├── assets/                       # App icon and splash images
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── tailwind.config.js            # Tailwind / NativeWind config
├── metro.config.js               # Metro bundler config
├── tsconfig.json                 # TypeScript configuration
├── package.json
└── README.md
```

## Brand

- **Colors**: Warm neutrals — clay (#9B7343), sage (#5F6E48), brass (#B08C57) on light parchment tones
- **Typography**: Warm serif (Georgia) for Scripture; geometric sans (Inter) for UI
- **Motion**: 200-300ms ease-out; respects reduced-motion
- **Copy**: Plain-spoken, short, respectful. No prosperity-gospel language.

## External Credentials Needed

| Service | What You Need | Purpose |
|---|---|---|
| **Supabase** | Project URL + anon key | Auth, database, edge functions |
| **RevenueCat** | Apple & Google API keys | Subscription management |
| **Apple Developer** | $99/year account | iOS app signing and App Store distribution |
| **Google Play Console** | $25 one-time account | Android app distribution |

## License

MIT — see [LICENSE](./LICENSE) for details.
