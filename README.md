# ProdeFC

A mobile-first sports prediction web app for friend groups. Users join a group, pay the entry fee via Mercado Pago, and compete by predicting football match scores. The leaderboard updates in real time as predictions are scored by a Postgres trigger.

Built for Champions League 2024/25 as the first competition.

---

## What It Does

1. **Auth** — Sign in with Google via Supabase Auth.
2. **Groups** — Create a group with an entry amount, or join one with a 6-character invite code.
3. **Payments** — Entry fee processed through Mercado Pago Checkout Pro. A Supabase Edge Function creates the preference, another verifies the webhook and activates the member.
4. **Predictions** — Pick a home/away score for each scheduled match before it kicks off.
5. **Scoring** — Postgres trigger auto-scores all predictions when a match finishes (3 pts exact, 2 pts correct winner + goal diff, 1 pt correct winner, 0 pts wrong).
6. **Ranking** — Live leaderboard via Supabase Realtime.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Backend | Supabase (Auth, Postgres, Realtime, Edge Functions) |
| Payments | Mercado Pago Checkout Pro |
| State | Zustand (UI/session) + React Query (server state) |
| Deploy | Vercel (frontend) + Supabase (Edge Functions) |

---

## Folder Structure

```
prodefc/
├── src/
│   ├── config.ts              # All constants: scoring points, limits, status values, locale
│   ├── main.jsx               # App entry point, React Query provider
│   ├── App.jsx                # Auth listener, session hydration
│   ├── router.jsx             # React Router v6 route definitions
│   │
│   ├── pages/                 # One file per screen
│   │   ├── Home.jsx           # Matches + ranking preview
│   │   ├── Fixture.jsx        # Full fixture grouped by round
│   │   ├── Ranking.jsx        # Full leaderboard (Realtime)
│   │   ├── Predict.jsx        # Score input for a single match
│   │   ├── Profile.jsx        # User info + group switcher + sign out
│   │   ├── Login.jsx          # Google OAuth sign-in
│   │   ├── JoinGroup.jsx      # Join via invite code or create a new group
│   │   └── Payment.jsx        # Mercado Pago entry fee payment
│   │
│   ├── components/
│   │   ├── match/
│   │   │   ├── MatchCard.jsx  # Compact match row (teams, score, prediction badge)
│   │   │   └── PredictForm.jsx# +/- score input with upsert
│   │   ├── ranking/
│   │   │   ├── RankingTable.jsx
│   │   │   └── RankRow.jsx
│   │   ├── layout/
│   │   │   ├── AppShell.jsx   # Outlet wrapper
│   │   │   ├── TopBar.jsx     # Logo + active group pill + avatar
│   │   │   └── BottomNav.jsx  # 4-tab navigation
│   │   └── ui/
│   │       ├── Avatar.jsx     # Circular user avatar with fallback initials
│   │       └── Badge.jsx      # Status badge (success / pending / error / default)
│   │
│   ├── hooks/                 # React Query wrappers — all Supabase queries live here
│   │   ├── useAuth.js         # signInWithGoogle, signOut
│   │   ├── useGroup.js        # useGroup, useMyGroups, useCreateGroup, useJoinGroup
│   │   ├── useMatches.js      # useMatches (list), useMatch (single)
│   │   ├── usePredictions.js  # usePredictions (list), usePrediction, useUpsertPrediction
│   │   └── useRanking.js      # useRanking (calculates from predictions client-side)
│   │
│   ├── lib/
│   │   ├── supabase.js        # Supabase singleton client
│   │   ├── scoring.js         # Pure functions: calculatePoints, calculateRanking
│   │   └── dates.js           # formatMatchDate, isMatchLocked, matchStatusLabel
│   │
│   ├── store/
│   │   ├── authStore.js       # Zustand: current user + loading state
│   │   └── groupStore.js      # Zustand + persist: activeGroupId
│   │
│   └── styles/
│       ├── globals.css        # CSS reset + base styles
│       └── tokens.css         # Design token CSS variables (colors, radius, spacing)
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20240101000000_initial_schema.sql   # All tables + RLS policies + indexes
│   │   └── 20240101000001_scoring_function.sql # Trigger + PL/pgSQL scoring function
│   └── functions/
│       ├── create-preference/index.ts   # Creates Mercado Pago checkout preference
│       └── mp-webhook/index.ts          # Verifies MP webhook + activates group member
│
├── .env.example
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `VITE_APP_URL` | Your app URL, e.g. `http://localhost:5173` |

Edge Function secrets (set once via CLI, not in `.env`):

| Variable | Where to get it |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `MP_ACCESS_TOKEN` | Mercado Pago → Credentials |
| `MP_WEBHOOK_SECRET` | Mercado Pago → Webhooks → Secret key |
| `APP_URL` | Your production URL for MP redirect |

### 3. Start Supabase locally

```bash
supabase start
supabase db push           # applies both migration files
```

Or paste the two migration SQL files manually into the Supabase cloud SQL editor.

### 4. Configure Google Auth

In Supabase → Authentication → Providers → Google:
- Enable Google provider
- Add your Google Cloud Console Client ID and Client Secret
- Set redirect URI to `https://<your-project>.supabase.co/auth/v1/callback`

### 5. Start Edge Functions locally

```bash
supabase functions serve

# Inject secrets
supabase secrets set MP_ACCESS_TOKEN=...
supabase secrets set MP_WEBHOOK_SECRET=...
supabase secrets set APP_URL=http://localhost:5173
```

### 6. Configure Mercado Pago webhook (production only)

In Mercado Pago → Webhooks:
- URL: `https://<your-project>.supabase.co/functions/v1/mp-webhook`
- Events: `payment`

### 7. Run the dev server

```bash
npm run dev
```

---

## Available Scripts

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build locally
```

---

## Routes

| Path | Page |
|---|---|
| `/login` | Google sign-in |
| `/` | Home — recent matches + ranking preview |
| `/fixture` | Full fixture grouped by round |
| `/ranking` | Full leaderboard (live via Realtime) |
| `/predict/:matchId` | Submit a score prediction |
| `/profile` | User info, group switcher, sign out |
| `/join/:inviteCode` | Join via invite code or create a group |
| `/payment/:groupId` | Pay group entry fee via Mercado Pago |

---

## Scoring Rules

| Outcome | Points |
|---|---|
| Exact score | 3 pts |
| Correct winner + goal difference | 2 pts |
| Correct winner only | 1 pt |
| Wrong prediction | 0 pts |

Scoring runs automatically via a Postgres trigger (`match_finished_scoring`) when a match's `status` is set to `'finished'`.

---

## Payment Flow

1. User enters invite code → sees entry amount
2. Confirms → frontend calls Edge Function `create-preference`
3. Edge Function hits `POST /checkout/preferences` on Mercado Pago → returns `init_point`
4. Frontend redirects to Mercado Pago external checkout
5. User pays → Mercado Pago fires webhook to Edge Function `mp-webhook`
6. Edge Function verifies HMAC-SHA256 signature, fetches payment via `GET /v1/payments/:id`, validates amount
7. If approved → sets `group_members.payment_status = 'approved'` and inserts into `payments`
8. Supabase Realtime detects the update → frontend auto-navigates to Home

---

## Deploying

**Frontend → Vercel:**
```bash
vercel
```
Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_URL` in Vercel → Settings → Environment Variables.

**Edge Functions → Supabase:**
```bash
supabase functions deploy create-preference
supabase functions deploy mp-webhook
```

---

## Test Data

Uncomment the insert/update block at the bottom of `supabase/migrations/20240101000000_initial_schema.sql` to seed sample matches.
