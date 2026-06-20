<div align="center">
  <img src="apps/mobile/assets/brand/logo.svg" width="84" alt="sobr logo" />
  <h1>sobr</h1>
  <p><em>Clear days, counted.</em></p>
</div>

A calm, private companion for a steadier relationship with alcohol — a daily
win/slip streak, a freeze-token safety net, and a growing tree that reflects
long-term progress. Built mobile-first (Expo) with a web companion view.

> New here? Read **[PROJECT.md](./PROJECT.md)** for the what/why, **[PLAN.md](./PLAN.md)**
> for architecture, **[TODO.md](./TODO.md)** for the task list, and
> **[PROGRESS.md](./PROGRESS.md)** for what's built so far.

## Monorepo layout

```
apps/mobile     Expo Router app (iOS + Android + Web)
packages/core   schemas + pure, tested domain logic (units, streak, freeze, growth)
packages/config design tokens, drink presets, currencies, growth metadata
packages/db     Drizzle schema, RLS migration, account-purge routine
```

## Prerequisites

- Node ≥ 20, **pnpm** (`corepack enable pnpm`)
- A free **Supabase** project (for auth + data)

## Setup

```bash
pnpm install

# 1) Database: in the Supabase SQL editor, run:
#      packages/db/migrations/0000_init.sql
#    (or: DATABASE_URL=... pnpm --filter @sobr/db migrate)

# 2) Auth: in Supabase → Authentication, enable Email OTP / magic-link sign-in.

# 3) Env:
cp .env.example .env       # then fill in EXPO_PUBLIC_SUPABASE_URL + ANON key
```

## Run

```bash
pnpm web        # the app in a browser
pnpm app        # Expo dev server (scan QR with Expo Go on a device)
pnpm test:core  # run the domain-logic test suite (71 tests)
```

Until your Supabase env vars are set, the app shows a friendly setup screen.

## Privacy

This is sensitive personal data. Every table is protected by Postgres Row-Level
Security (you can only ever access your own rows), there is no analytics on logged
content, and account deletion purges everything. Never commit your `.env`.

## Brand assets

Editable SVGs live in `apps/mobile/assets/brand/` (logo, icon, favicon, splash).
They're tasteful placeholders — replace them anytime. For native builds you'll want
PNG exports of the icon/splash; the web favicon uses the SVG directly.
