# Fencing Bout Tracker — Design

## Context

A mobile-friendly PWA for a fencer (épée) to track sparring bouts: opponent, score, date, weapon, optional notes — plus win/loss stats. Built for a single user today, with the schema and permission model designed so shared-club support can be added later without a rewrite.

**V1 goal**: bout logging + basic win/loss stats, optimized above all for logging a bout in ~10 seconds right after training. Deeper stats (head-to-head trends, performance-over-time charts) and an in-app calendar view are deferred to a later phase — the schema supports them without migration, but nothing for them is built yet.

## Stack & Hosting

- **Frontend**: Vite + React + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), `react-router-dom`, `vite-plugin-pwa`.
- **Backend**: Supabase (Postgres + Auth + Row Level Security). No custom server, no ORM — `@supabase/supabase-js` called directly from React hooks.
- **Hosting**: Vercel (free tier) for the static frontend; Supabase free tier for DB/Auth.
- **State/data**: plain React hooks wrapping `supabase-js` calls — no Redux/Zustand/TanStack Query for v1.

**Why this stack**: cost and simplicity mattered more than "zero external dependency" or staying Python-only (the developer's primary language). A fully local-only, no-backend option was considered and rejected — it would defer the hardest problem (multi-device sync/conflict resolution) to a painful rewrite later, whereas Supabase makes future multi-user/shared-club support an additive schema + RLS change.

## Architecture Overview

```
┌─────────────────────────┐        ┌──────────────────────────────────┐
│   React PWA (Vercel)    │◄──────►│         Supabase (managed)        │
│                          │  HTTPS  │  ┌──────────┐  ┌───────────────┐ │
│  hooks/ (data-access)    │  REST/  │  │ Postgres │  │  Auth (GoTrue)│ │
│  pages/ + components/    │  Realtime│  │ + RLS    │  │  JWT sessions │ │
│  service worker (PWA)    │        │  └──────────┘  └───────────────┘ │
└─────────────────────────┘        └──────────────────────────────────┘
```

There is no custom server tier and no server we operate — Postgres and its RLS engine *are* the authorization layer (every query is scoped by `auth.uid()` at the database level, not by app code), and the "API" is Supabase's auto-generated REST layer over Postgres. Neither Vercel (static hosting, CDN-served) nor Supabase (managed Postgres) is something we scale — they scale themselves within their tiers. There is no app server process, no request queue, no cache layer, no sharding to design for at any size this app will realistically reach.

**What "scalable" means for this project, concretely**: not "handle more traffic" (irrelevant at this scale) but "add capability without rework" — specifically, going from one private user to a club of fencers who see each other's shared history.

## Scalability & Multi-Tenancy Design

**Ownership model today**: every row in `opponents` and `bouts` carries a `user_id`, and RLS policies grant access only to `auth.uid() = user_id`. This is a single-tenant-per-row model — it is also exactly the primitive Postgres RLS is built to extend: a second policy can be layered on with `OR` conditions without touching the first.

**The key design fork for shared clubs**: when two club members both fence each other, should a bout be (a) one shared row both can see, or (b) two independent rows, one logged by each fencer from their own perspective? The recommended extension path is **(b) — each fencer logs their own row**, because:
- It requires no confirmation/dispute workflow (fencer A logs 15-12, fencer B doesn't have to agree or be notified before it "counts").
- It matches how the app already works (opponents are just names, not necessarily linked accounts).
- Storage duplication is irrelevant at this scale.

**Future schema sketch (not built now — documented extension path for when that phase starts)**:

```sql
-- club support, added later, purely additive:
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  primary key (club_id, user_id)
);

-- opponents optionally link to a real registered user once clubs exist:
alter table public.opponents add column linked_user_id uuid references auth.users(id);

-- an additional, layered RLS policy alongside the existing personal-ownership one:
create policy "bouts_select_club_shared" on public.bouts
  for select using (
    exists (
      select 1 from public.club_members cm_self
      join public.club_members cm_owner on cm_owner.club_id = cm_self.club_id
      where cm_self.user_id = auth.uid() and cm_owner.user_id = bouts.user_id
    )
  );
```

This is additive: no existing table is restructured, no existing policy removed, no existing data migrated — a club member simply gains an additional `select` path into bouts logged by other members of the same club. The v1 schema (UUID PKs, `user_id` FK on every table) already satisfies every precondition this extension needs.

**Data-model choices made now specifically to keep analytics scalable later**: raw `fencer_score`/`opponent_score` are stored (not a derived win/loss boolean), so future features — point-differential trends, "how close were my losses," strength-of-opponent weighting — are queries against existing columns, not new data collection. `bout_date` as a plain date (not timestamptz) means a future calendar/heatmap view groups correctly with zero timezone-conversion bugs.

**Frontend scalability**: plain hooks are correct at 4 tables/5 screens. The upgrade trigger for TanStack Query (or similar) is when the number of screens that need to stay in sync after a mutation grows past what manual refetch-on-save can handle cleanly — a symptom threshold, not a size threshold.

## Database Schema

Design principles: UUID PKs, `user_id` FK on every user-owned table (so a future `club_id` + membership policy is additive), RLS on from day one, `weapon` constrained to `epee | foil | sabre` (UI only exposes épée now, so adding weapons later is UI-only), `bout_date` as a plain `date` so a future calendar/heatmap view groups by day with no timezone issues.

Full DDL: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), plus [`0002_add_bout_format.sql`](supabase/migrations/0002_add_bout_format.sql) (`bout_format`: `free | timed`), [`0003_add_target_score.sql`](supabase/migrations/0003_add_target_score.sql) (`target_score`: `5 | 10 | 15`), and [`0004_add_opponent_handedness.sql`](supabase/migrations/0004_add_opponent_handedness.sql) (`opponents.handedness`: `left | right | null` — nullable since we don't want to assume a handedness for opponents it's never been set for).

Opponents can now be edited (name, handedness) and deleted. Deleting is still backstopped by `opponent_id ... on delete restrict` on `bouts` — if an opponent has logged bouts, deletion is rejected and the UI surfaces a friendly message asking you to delete those bouts first, rather than silently cascading away bout history.

Tables: `profiles` (1:1 with `auth.users`, auto-created via trigger on signup), `opponents` (user-owned), `bouts` (user-owned, FK to `opponents`). A `bout_stats` view (`security_invoker = true`) exists in the migration history for a simple DB-side aggregate, but the app itself now computes all stats client-side (`src/lib/boutStats.ts`) over the already-fetched `bouts` array, since that's what makes the filtered analytics (by opponent/format/target score) possible without a parameterized view.

This schema already supports the deferred features with no migration needed: head-to-head = `group by opponent_id`, trends = `order by bout_date`, calendar = `group by bout_date`.

## Auth Flow

- Single `/login` route with a Sign in/Sign up toggle (one form, one state flag).
- `src/lib/supabaseClient.ts` creates the client from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`.
- `useAuth` hook/context wraps `supabase.auth.getSession()` + `onAuthStateChange()`, exposing `{ session, loading }`. Session persistence to `localStorage` is automatic via supabase-js.
- `<ProtectedRoute>` wrapper redirects to `/login` when there's no session; wraps every route except `/login`.
- **Note**: "Confirm email" should be turned off in Supabase Auth settings for v1 — this is a personal single-user app, so email confirmation is just friction with no real security benefit here. Easy to re-enable later if the app opens up to others.
- Logout button in the shared nav bar calling `supabase.auth.signOut()`.

## Screens / Routes

| Route | Screen | Purpose |
|---|---|---|
| `/login` | Login/Signup | Unprotected entry point |
| `/` | **Quick Log Bout (home)** | Speed-optimized bout entry — opens first after login |
| `/history` | Bout History | Reverse-chronological list, tap to edit a mistake |
| `/opponents` | Opponents | Add (collapsed behind a button)/edit/delete opponents (name, handedness); each row shows head-to-head record + recent-form dots, tap to expand the last 5 bouts against them |
| `/stats` | Stats & Profile | Filterable record (by opponent, match format, target score, opponent handedness), touches scored/conceded/margin, and display-name edit |

Bottom tab bar nav (Log / History / Opponents / Stats), thumb-reachable, hidden on `/login`.

## Quick-Log-Bout UX (`/`, the home screen)

Target: one-handed, ~10 seconds, right after a bout at the strip.

1. **Opponent** at top — a plain dropdown (`<select>`) of existing opponents. Opponent management (adding new ones, setting handedness) now lives entirely on the Opponents tab; quick-log only picks from who's already there.
2. **Score entry** — two large side-by-side steppers ("You" / "Opponent"), `inputmode="numeric"`, big ≥44px +/− targets, default 0–0.
3. **Date** — defaults to today, shown small/collapsed; tap opens a native date input only when backdating is needed.
4. **Weapon** — single-option segmented control pre-selected to "Épée," present but requiring zero interaction normally.
5. **Notes** — optional, behind a "+ Add note" disclosure toggle.
6. **Save** — sticky full-width button pinned to the bottom of the viewport.

**Post-save**: toast confirmation ("Bout logged: 5–3 vs. Alex"), form resets scores/notes but **keeps the opponent selected** (sparring is usually several bouts vs. the same partner in a row) — next bout is 2 taps away. Stays on `/`, no navigation.

## Folder Structure

```
fencingApp/
├── public/icons/                 # 192/512 PWA icons
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # <Routes>
│   ├── index.css                 # @import "tailwindcss";
│   ├── lib/supabaseClient.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOpponents.ts
│   │   └── useBouts.ts
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   ├── NavBar.tsx
│   │   ├── ScoreStepper.tsx
│   │   └── SegmentedToggle.tsx
│   │   (plus a few small pure helpers under lib/: boutStats, boutOptions,
│   │   opponentOptions, formatDate — see those files for the current list)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── QuickLogPage.tsx      # home "/"
│   │   ├── HistoryPage.tsx
│   │   ├── OpponentsPage.tsx
│   │   └── StatsPage.tsx
│   └── types/database.ts         # via `npx supabase gen types typescript`
├── supabase/migrations/0001_init.sql
├── .env.example
├── .env.local                    # gitignored
└── vite.config.ts                # registers @tailwindcss/vite + vite-plugin-pwa
```

Deliberately flat — no `features/` folders, no barrel files, no extra service layer beyond the 4 hooks. Right-sized for 4 tables, 5 screens, 1 developer.

## Verification Plan

1. **Auth**: sign up via the UI; confirm a row in Supabase Auth → Users and a matching `public.profiles` row (via the trigger).
2. **Opponents**: add one via `/opponents`; confirm the row and its `user_id` in the table editor.
3. **Log a bout end-to-end**: from `/`, log a bout by feel; confirm it appears at the top of `/history` and the raw row (`fencer_score`, `opponent_score`, `bout_date`, `weapon`) is correct.
4. **RLS isolation**: create a second throwaway account, log a bout as that user, confirm the first account never sees it and vice versa.
5. **Stats correctness**: manually tally a handful of bouts (overall and filtered by a specific opponent/format/target score) and compare against `/stats`.
6. **PWA install**: `npm run build && npm run preview`, open on a phone, confirm "Add to Home Screen," install, relaunch standalone (no browser chrome).
7. **Deploy**: connect repo to Vercel, set env vars, build command `npm run build`, output `dist`; re-run steps 1–6 against the deployed URL.
