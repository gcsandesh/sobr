<div align="center">
  <img src="apps/mobile/assets/brand/logo.svg" width="84" alt="sobr logo" />
  <h1>sobr</h1>
  <p><em>Clear days, counted.</em></p>
</div>

A calm, private companion for a steadier relationship with alcohol — a daily
win/slip streak, a freeze-token safety net, and a growing tree that reflects
long-term progress. Built mobile-first (Expo) with a web companion view.

> **Picking up the project?** Start with **[HANDOVER.md](./HANDOVER.md)** — the single entry point
> (status, decisions, gotchas, how to verify, where to continue). Then **[PROJECT.md](./PROJECT.md)**
> (what/why), **[PLAN.md](./PLAN.md)** (architecture), **[TODO.md](./TODO.md)** (tasks), and
> **[PROGRESS.md](./PROGRESS.md)** (chronological log). Shipping a build: **[DEPLOY.md](./DEPLOY.md)**.

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

# 1) Database: in the Supabase SQL editor, run every file in
#      packages/db/migrations/ in order (0000 → 0005)

# 2) Auth: Supabase → Authentication → Providers → Email → turn "Confirm email" OFF.
#    For password reset codes: enable custom SMTP, then paste
#    packages/db/email/reset-password.html into the Reset Password template.

# 3) Env:
cp .env.example .env       # then fill in EXPO_PUBLIC_SUPABASE_URL + ANON key
```

## Run

```bash
pnpm web        # the app in a browser
pnpm app        # Expo dev server (scan QR with Expo Go on a device)
pnpm test:core  # run the domain-logic test suite
```

Until your Supabase env vars are set, the app shows a friendly setup screen.

## Install on Android

Every push that touches the app builds a release APK on GitHub Actions and publishes it
under **[Releases](https://github.com/gcsandesh/sobr/releases)**. Open the newest one on
your phone, tap the `.apk`, and allow installs from your browser. Details and the release
checklist: [DEPLOY.md](./DEPLOY.md).

## Privacy

This is sensitive personal data. Every table is protected by Postgres Row-Level
Security (you can only ever access your own rows), there is no analytics on logged
content, and account deletion purges everything. Never commit your `.env`.

## Brand assets

Editable SVGs live in `apps/mobile/assets/brand/` (logo, icon, favicon, splash).
They're tasteful placeholders — replace them anytime. For native builds you'll want
PNG exports of the icon/splash; the web favicon uses the SVG directly.
