# Fencing Bout Tracker

Mobile-friendly PWA for logging épée sparring bouts. See [DESIGN.md](./DESIGN.md) for architecture, schema, and UX rationale.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
2. **Run the migration**: open the SQL editor in your Supabase project and paste the contents of [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql), then run it.
3. **Turn off email confirmation** (personal single-user app, so this is just friction): Authentication → Providers → Email → toggle off "Confirm email".
4. **Copy env vars**: `cp .env.example .env.local`, then fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project's API settings.
5. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — typecheck + production build (outputs to `dist/`)
- `npm run preview` — serve the production build locally (use this to test PWA install)
- `npm run lint` — oxlint

## Deploy

Connect the repo to Vercel, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as environment variables, build command `npm run build`, output directory `dist`.
