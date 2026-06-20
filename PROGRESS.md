# sobr — Progress Log

A running, human-readable record of what's been built, checkpoint by checkpoint.
Each entry: **what was achieved** + **what you (the user) need to do**. TODO.md links
its task groups here.

---

<a id="m0-foundations"></a>
## M0 · Foundations — ✅ done (2026-06-21)

**Achieved**
- pnpm + Turborepo monorepo scaffolded; git initialised.
- Root tooling: `tsconfig.base.json` (strict), `.npmrc` (hoisted for RN), prettier,
  `.gitignore` (secrets/native/build), `.env.example` (documented).
- `PLAN.md` (architecture + stack rationale), `TODO.md`, `PROJECT.md`, this file.
- `@sobr/config`: design tokens, drink presets (incl. Nepal-local), currencies
  (default **USD**, user-selectable), growth-stage metadata.

**What you need to do** — nothing yet.

---

<a id="m1-core"></a>
## M1 · `@sobr/core` (the correctness-critical math) — ✅ done & tested (2026-06-21)

**Achieved**
- Shared **Zod schemas** + types: `Drink`, `DailyEntry`, `UserSettings`, `FreezeGrant`.
- Pure logic: units (UK formula), win-determination (zero/limit/manual), streak
  (current + longest, with the today/yesterday grace day), freeze tokens (7-day
  milestones, cap 3, generous deferred-fill), growth stage (0/3/7/14/30/60), monthly +
  all-time aggregates, and **timezone-safe** local-day date helpers.
- **71 Vitest tests, all green** — covering boundary cases, midnight/DST edges, grace-day
  streak logic, and the freeze cap.

**What you need to do** — nothing. You can run `pnpm test:core` anytime to see it pass.

---

<a id="m2-db"></a>
## M2 · Database (`@sobr/db`) — ✅ code complete (2026-06-21)

**Achieved**
- Drizzle schema for all four tables (+ derived Row types) and a server-only client.
- `migrations/0000_init.sql`: tables, checks, indexes, `updated_at` + new-user triggers,
  **RLS enabled + forced** with per-user policies (drinks isolated via their parent entry),
  and a `delete_account()` purge routine (cascades from `auth.users`).

**What you need to do**
1. Create a free **Supabase** project.
2. Open the SQL editor and run the contents of `packages/db/migrations/0000_init.sql`
   (or `pnpm --filter @sobr/db migrate` with `DATABASE_URL` set).
3. Keep your keys handy for M3.

---

<a id="m3-app"></a>
## M3–M7 · The app (Expo, web + native) — 🟡 built & type-checking (2026-06-21)

**Achieved** (all TypeScript-clean; not yet run against a live backend)
- Expo Router app: providers (QueryClient, Supabase session, fonts, gestures, safe-area),
  NativeWind bridged to the shared tokens, Fraunces + Manrope loaded.
- **Auth:** email-OTP sign-in (two-step), session listener, routing gate (setup → auth →
  onboarding → tabs).
- **Onboarding:** calm intro beats + "what counts as a win" picker that persists settings.
- **Home (Today):** the growing **tree** (animated SVG, stage from lifetime clear days),
  streak number, banked-freeze indicator, one-tap "clear day", and a "protect with a
  freeze" action on a slip.
- **Drink logger** (`day/[date]`): preset chips (incl. Nepal-local), quantity steppers,
  custom entry, optional per-item cost, live units/cost totals, live win/slip per mode,
  remove-a-day.
- **Calendar:** month grid, color-coded, unit dots, future-disabled, tap-to-open.
- **Progress:** 14-day units bar chart, monthly + all-time stat cards.
- **Settings:** win mode + limit, currency selector, account (email, sign out, delete-all
  with confirm).
- **Brand:** new SVG **logo** (sprout-through-ring), app icon, favicon, splash — tagline
  "Clear days, counted."
- Data layer wired to Supabase (RLS-safe) via TanStack Query; freeze awards reconciled on
  each save using the tested core logic.

**Not yet verified:** runtime/rendering, because that needs your Supabase project + a
device/browser. Mutations are wired but not yet optimistic (Phase 2).

**What you need to do**
1. Copy `.env.example` → `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (from your Supabase project's API settings).
2. In Supabase **Auth settings**, enable **Email OTP** (magic link / OTP) sign-in.
3. Run it: `pnpm install` then `pnpm web` (or `pnpm app` for the Expo dev server on a
   device). The app shows a friendly **setup screen** until the env vars are present.
4. Tell me what you see — then we iterate on polish (M8), real-device feel, and bugs.

---

### Verified vs. pending (honesty check)
- **Verified here:** `@sobr/core` (71 tests) and TypeScript across every package + the app.
- **Pending your setup:** anything needing a live Supabase project — auth round-trip,
  reads/writes, and on-screen rendering on a real device/browser.
