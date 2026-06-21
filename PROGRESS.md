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

<a id="env-root"></a>
## Bugfix · App stuck on setup screen despite a configured .env — ✅ done (2026-06-21)

**Symptom:** after running the SQL + filling `.env`, web *and* native still showed only the
setup screen. **Cause:** Expo auto-loads `.env` from the **app folder** (`apps/mobile/`), but
the documented `.env` lives at the **repo root**, so `EXPO_PUBLIC_*` never reached the bundle
and `isSupabaseConfigured` stayed false.

**Fix:** added `apps/mobile/app.config.js` that loads the repo-root `.env` (then any app-local
override) and injects the public keys into `extra`; `env.ts` now reads from `extra` (with an
`EXPO_PUBLIC_*` fallback). Verified with `expo config` that the root `.env` is now picked up
(`looks configured: true`). Added `dotenv`.

**What you need to do:** **restart the dev server** so the config reloads —
- web: re-run `pnpm web`
- native: `pnpm app --clear`

You should now move past setup to the sign-in screen.

<a id="brand-coil"></a>
## Brand · New logo + favicon (growth-coil mark) — ✅ done (2026-06-21)

**Achieved** — adopted your tapering growth-coil mark (faint→bright with the amber "today"
node):
- `Logo` component re-drawn as the coil (react-native-svg) — used at sign-in, onboarding,
  and the loading state.
- Brand SVGs updated: `logo.svg`, `favicon.svg`, full-bleed `icon.svg`.
- Rasterized real PNGs with resvg: **`favicon.png` (256)** and **`icon.png` (1024)**, and
  wired them — `web.favicon` now generates a proper `favicon.ico`, and the native app icon
  (iOS + Android adaptive) uses the mark.
- **Branded splash:** transparent coil `splash-icon.png` (576) wired via the
  `expo-splash-screen` plugin on the dark background (replaced the deprecated top-level
  `splash` key).
- Verified: expo config valid, typecheck + web (emits favicon.ico) & iOS bundles green.

**What you need to do** — reload to see it. To replace later, drop new SVGs in `assets/brand/`
and re-export PNGs (or just swap the PNGs).

<a id="m8-home"></a>
## M8 · Polish — Home daily-experience — ✅ done (2026-06-21)

**Achieved** (first slice of M8, focused on the screen you open every day)
- **Count-up streak number** — the big streak ticks up (ease-out) and re-animates on a
  new win, Duolingo-style; pure RAF so it behaves identically on web + native.
- **Calm win moment** — tapping "It was a clear day" (or protecting with a freeze) fires a
  gentle success **haptic** (native; no-op on web) and a soft fade-in confirmation banner.
- **Graceful first-load state** — a quietly pulsing logo + "A moment…" instead of flashing
  zeros while data loads.
- **Tree hero fades in**; added a "Longest · N" line and a screen-reader label on the
  freeze indicator.
- Verified: typecheck + web & iOS bundles green.

**What you need to do** — just reload (`pnpm app` / `pnpm web`) and try logging a clear day to
feel the count-up + haptic. Tell me how the motion feels and we'll tune timing/copy.

<a id="native-nativewind"></a>
## Maintenance · Native runtime errors (web OK, mobile not) — ✅ done (confirmed working 2026-06-21)

**Symptom:** web renders, native (Expo Go) errors. iOS/web both *bundle* fine, so it's a
runtime issue. Most probable cause given the exact symptom: **NativeWind 4.1.x breaks on
the New Architecture under React 19 / RN 0.81** (web uses react-native-web and sidesteps it).

**Change:** bumped `nativewind` 4.1.23 → **4.2.5** (+ react-native-css-interop 0.2.5), which
carries the New-Arch/React-19 fixes. Verified: ios + web bundles + typecheck all green.

**What you need to do:** restart the native app **with cache cleared** so the new babel/native
deps take effect: `pnpm app --clear` (or `npx expo start -c`), then reopen in Expo Go. If an
error remains, paste the **exact redbox title + message** — that pins the cause precisely.

<a id="launch-crash"></a>
## Maintenance · Fix launch crash when Supabase isn't configured — ✅ done (2026-06-21)

**Achieved** — the app crashed on load (web *and* native) with `supabaseUrl is required`.
Root cause: `createClient()` ran at import time with empty env and threw before the gate
could show the setup screen. Fixes:
- supabase client falls back to valid placeholder url/key when env is unset, so importing
  it never throws; the gate routes to the setup screen as intended.
- mutation hooks no longer throw from `useUid()` during render when signed out — the
  "must be signed in" check moved into the mutation function.

**Verified:** dev server serves (`/` → 200), web bundle compiles (1442 modules, no load
error), app type-checks. **What you need to do:** reload `pnpm web` — you should now see the
setup screen instead of a crash.

<a id="sdk54"></a>
## Maintenance · Expo SDK 52 → 54 + fix `pnpm web` — ✅ done (2026-06-21)

**Achieved**
- Upgraded to **Expo SDK 54** via Expo's own tooling (`expo install --fix`): React **19.1**,
  React Native **0.81.5**, expo-router **6**, Reanimated **4**, react-native-web **0.21**,
  `@types/react` **19**.
- Fixed the web run, which was failing to bundle:
  - **Reanimated 4 / worklets:** added `react-native-worklets` and let `babel-preset-expo`
    inject the worklets plugin (removed the manual `react-native-reanimated/plugin`).
  - **Module resolution:** Metro couldn't resolve the shared packages' `./x.js` import
    extensions — switched `@sobr/core` / `@sobr/config` / `@sobr/db` to extensionless
    relative imports (works for Metro *and* `tsc`).
  - Added `@expo/metro-runtime` (web peer) and made Metro `watchFolders` extend Expo's
    defaults instead of replacing them.
  - Web favicon now uses Expo's default (its generator needs a PNG, not our SVG).
- **Verified:** `expo export --platform web` succeeds (1379 modules), **expo-doctor 18/18**,
  app + all packages type-check, `@sobr/core` 71 tests still green.

**What you need to do** — re-run `pnpm install` (already done here), then `pnpm web`. To restore
a custom web favicon later, drop a PNG in and point `web.favicon` at it in `app.json`.

---

### Verified vs. pending (honesty check)
- **Verified here:** `@sobr/core` (71 tests) and TypeScript across every package + the app.
- **Pending your setup:** anything needing a live Supabase project — auth round-trip,
  reads/writes, and on-screen rendering on a real device/browser.
