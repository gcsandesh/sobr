# sobr — Engineering Handover

> **Read this first.** It's the single entry point for any agent/developer picking up the
> project. It consolidates status, decisions, gotchas, the verification workflow, and where to
> continue. Companion docs: [PROJECT.md](./PROJECT.md) (product context & principles),
> [PLAN.md](./PLAN.md) (architecture), [TODO.md](./TODO.md) (task list, kept current),
> [PROGRESS.md](./PROGRESS.md) (chronological log with "what the user must do" per step).
> Detailed change history lives in `git log` (one commit per feature).

Last updated: 2026-07-01.

---

## 1. TL;DR — current status

**The MVP is feature-complete and verified.** A calm, private alcohol-moderation habit tracker
("**sobr — clear days, counted.**") built as ONE Expo app for **web + iOS + Android**, backed by
Supabase. Web runs and is confirmed working (incl. Google sign-in). Native hasn't been tested on a
device yet — it needs a custom dev build (Expo Go can't do native Google OAuth or scheduled
notifications fully).

Health at handover: **`@sobr/core` 71/71 tests pass**, all four workspaces + the app
type-check, web bundles clean, `expo-doctor` passes.

What works end-to-end on **web**: email-OTP + Google auth (now a two-step sign-in → verify
flow), a three-step onboarding, daily check-in, drink logger, streaks + freeze tokens + growth
tree (with level-up celebration), an embedded calendar + day-detail panel on Home, stats,
settings, offline persistence. Reminders are local-notification based (native).

**Visual direction (2026-07-01):** the app moved from the original dark charcoal-green theme to
a **light, minimal white + moss-green** palette per product direction — see §3 and the
`redesign-light-theme` entry in PROGRESS.md. The standalone Calendar tab was folded into Home
(tab bar is now Home · Progress · Settings).

---

## 2. What this product is (one paragraph)

Each day the user taps **"It was a clear day"** (one-tap win) or **logs what they had**. A win
extends a **streak** and lifetime **clear days**, which grows a **tree** (seed→…→grove at
0/3/7/14/30/60 clear days). Every 7-day streak earns a **freeze token** (max 3 banked); on a slip
a freeze protects the streak. Win condition is configurable per user: **zero** (any drink = slip),
**limit** (≤ N units = win), or **manual** (self-declared). Units use the UK formula
`volume_ml × abv% / 1000`. See [PROJECT.md](./PROJECT.md) for principles.

### Non-negotiable principles (apply to all future work)
- **Calm, never punitive.** A bad day is a *slip* — never "failure"/"relapse". Terracotta, not red.
- **Non-triggering language.** App chrome leans on *clear days / wins / growth*; avoid
  "alcohol / drinking / consumption" framing (it can nudge some people toward drinking).
- **Privacy first.** Sensitive health data: per-user Postgres RLS, no analytics on logged content,
  account deletion truly purges, secrets only in `.env` (gitignored).
- **Correctness of the math** lives in the tested `@sobr/core` package — change it with tests.

---

## 3. Tech stack & the decisions behind it

| Concern | Choice | Why (decision) |
| --- | --- | --- |
| Monorepo | pnpm workspaces + Turborepo | Shared logic/schema never drift. |
| Frontend | **One Expo Router app** (web+iOS+Android) | Web is an authed companion — no SEO/SSR — so a separate Next.js app wasn't worth a 2nd UI codebase. Reversible: packages stay shareable. |
| Styling | **NativeWind v4.2.5**, `darkMode: 'class'` | Tailwind for RN, works web+native. Theme is **light** (white + moss-green, since 2026-07-01); `darkMode: 'class'` is kept because `'media'` has historically crashed on this NativeWind/RN combo (see gotchas) — the app never applies a `dark` class, so it's inert. |
| Tokens | `@sobr/config` (mirrored in `tailwind.config.js`) | Tailwind (CJS) can't import the TS ESM tokens, so the palette is mirrored — keep them in sync. |
| Data/cache | TanStack Query (+ persistence) | Offline tolerance. |
| Backend | **Supabase** (Postgres + Auth + RLS) | Bundled auth + row-isolation beats Neon + bolt-on auth for sensitive per-user data. |
| ORM/migrations | **Drizzle** + hand-written SQL | RLS/triggers/grants are hand-written (Drizzle can't infer them). |
| Validation | **Zod** (in `@sobr/core`) | Single source of truth for shapes. |
| Charts/visuals | **react-native-svg** | One cross-platform path (no Recharts/shadcn — DOM-only). |
| Animation | reanimated 4 + `react-native-worklets` | SDK 54. |
| Auth | email OTP + **Google** (Supabase OAuth/PKCE) | Apple deferred to store-publish time. |
| Reminders | `expo-notifications` (local) | No servers; remote push later. |
| Tests | **Vitest** on `@sobr/core` | The bug-prone math is covered. |
| Runtime | Expo **SDK 54** (React 19.1, RN 0.81.5), Node ≥20, pnpm 9 (corepack) | |

**Rejected:** `@expo/ui` (native-only/alpha — would break web); separate Next.js web app (not
needed); CSV/JSON export (data lives in DB and restores on login).

---

## 4. Repository layout

```
sobr/
├─ apps/mobile/                Expo Router app (web + native)
│  ├─ app/                     routes: (auth) (onboarding) (tabs) day/[date] setup _layout
│  ├─ src/components/          UI kit (ui.tsx), Tree, Logo, Glow, GrowthCelebration, icons, AnimatedNumber
│  ├─ src/data/                SessionProvider, hooks (queries+mutations), useReminder, useGrowthCelebration, api.ts
│  ├─ src/lib/                 supabase, auth (Google), notifications, queryClient, env, haptics
│  ├─ src/theme/               re-exports @sobr/config tokens for SVG/inline use
│  ├─ assets/brand/            SVGs + PNGs (logo/icon/favicon/splash) — placeholder, replaceable
│  ├─ app.json / app.config.js plugins, scheme "sobr"; app.config.js loads the ROOT .env into `extra`
│  ├─ tailwind.config.js metro.config.js babel.config.js global.css
├─ packages/core/              @sobr/core — schemas + pure logic + 71 Vitest tests
├─ packages/config/            @sobr/config — tokens, drink presets, currencies (USD default), growth meta
├─ packages/db/                @sobr/db — Drizzle schema, migrations/ (0000_init.sql, 0001_grants.sql), client
├─ HANDOVER.md PROJECT.md PLAN.md TODO.md PROGRESS.md README.md
└─ package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .env.example
```

Dependency direction: `apps/mobile` → `@sobr/{core,config,db-types}`. Packages never import apps.
`@sobr/core` has zero deps except Zod (keeps it portable + fast to test).

---

## 5. Data model & database

Tables (all in `public`, all **RLS enabled + forced**, all granted to `authenticated`):
- **`user_settings`** (PK `user_id`→auth.users): `win_mode` (zero|limit|manual), `daily_limit_units`,
  `currency` (default **USD**), `time_zone`, **`onboarded`** (drives routing), timestamps.
- **`daily_entries`**: `user_id`, `entry_date` (local civil date), `status` (win|slip|freeze),
  `note`, unique `(user_id, entry_date)`.
- **`drinks`**: `daily_entry_id` (cascade), `preset_key`, `name`, `volume_ml`, `abv` (percent number),
  `cost`, `quantity`. **Units are derived, never stored.**
- **`freeze_grants`**: `user_id`, `granted_for_streak` (unique per user — no double-award),
  `used_at`, `used_on_entry_id`.

Derived-not-stored: units, streaks, banked-freeze counts, all stats (computed in `@sobr/core` on
read — can't drift). DB extras: `handle_new_user` trigger (auto-creates `user_settings` on signup),
`updated_at` triggers, `delete_account()` security-definer purge (cascades from auth.users).

**Migrations** (`packages/db/migrations/`): `0000_init.sql` (tables, checks, indexes, RLS, policies,
grants, triggers, delete routine) and `0001_grants.sql` (idempotent grants for DBs created before
grants were added). Apply via the Supabase SQL editor or `pnpm --filter @sobr/db migrate`.

---

## 6. Gotchas & fixes already discovered (READ — these will bite again)

1. **NativeWind must be ≥ 4.2.x AND `darkMode: 'class'`.** 4.1.x crashes on the New Architecture
   under React 19 (web blanks / native errors). `darkMode: 'media'` has thrown *"Cannot manually
   set color scheme"* on this stack before — `darkMode: 'class'` avoids it. (The app is
   light-themed now and never applies a `dark` class, so this is purely defensive.)
2. **The canonical `.env` is at the REPO ROOT**, loaded by `apps/mobile/app.config.js` (Expo only
   auto-loads the app-folder `.env`). **Restart the dev server after editing `.env`**
   (`pnpm web` / `pnpm app --clear`).
3. **RLS needs table GRANTs.** Symptom: `42501 permission denied for table ...`. RLS governs rows;
   Postgres still needs `GRANT ... TO authenticated`. Fix = run `0001_grants.sql` on the project.
4. **Shared packages use extensionless relative imports** (`from './x'`, not `'./x.js'`) — Metro
   can't rewrite `.js`→`.ts`. `tsc` (Bundler resolution) is happy either way.
5. **`pnpm app` "Unable to resolve <new dep>"** after adding a dependency = stale Metro module map.
   Restart with `pnpm app --clear` (not just a reload). It's not a code bug.
6. **Web favicon/app icon need PNGs** (Expo's generator rejects SVG). PNGs were rasterized from the
   brand SVGs with `@resvg/resvg-js` (installed ad-hoc in /tmp). Regenerate the same way if the SVGs change.
7. **Reanimated 4 / SDK 54:** `babel-preset-expo` auto-injects the worklets plugin — do NOT add
   `react-native-reanimated/plugin` manually; `react-native-worklets` is installed.
8. **Supabase client never throws at import** when env is unset (placeholder url/key) so the setup
   screen can show; `flowType: 'pkce'` is set for OAuth.
9. **Mutation hooks must not throw at render** when signed out — the "must be signed in" check lives
   inside the `mutationFn` (`requireUid`), not the hook body.

---

## 7. Auth specifics

- **Email OTP** works on web + native (`signInWithOtp` / `verifyOtp`).
- **Google** (`src/lib/auth.ts` → `signInWithGoogle`): Supabase OAuth + PKCE.
  - Web redirect = page origin; `detectSessionInUrl` exchanges the `?code`. **Confirmed working.**
  - Native redirect = `sobr://auth-callback`; handled inline by `openAuthSessionAsync` and via a
    deep-link listener in `app/_layout.tsx`. **Needs a custom dev build** (Expo Go can't).
  - Supabase setup the user has done: Google provider (client id/secret), redirect URLs
    (`http://localhost:8081`, `sobr://auth-callback`), Site URL, and the Google Cloud "Authorized
    redirect URI" = `https://<project>.supabase.co/auth/v1/callback`.
- **Apple**: deferred (needs paid Apple Developer account + dev build; mandatory for App Store apps
  that offer Google). See TODO → Future enhancements.

---

## 8. How to run

```bash
corepack enable pnpm          # if pnpm missing
pnpm install
# DB: run packages/db/migrations/0000_init.sql then 0001_grants.sql in Supabase SQL editor
# Env: a .env exists at the repo root (gitignored) with EXPO_PUBLIC_SUPABASE_URL/ANON_KEY (+DATABASE_URL)
pnpm web                      # web app (origin usually http://localhost:8081)
pnpm app                      # Expo dev server (device); use --clear after dep/config changes
pnpm test:core                # 71 domain-logic tests
```

Until env is set, the app shows a friendly **setup screen**.

---

## 9. Verification workflow (how this codebase has been checked — keep doing this)

Because there's no device/CI here, work is verified by:
1. **Domain logic:** `pnpm --filter @sobr/core test` (must stay green; add tests for any logic change).
2. **Types:** per package `pnpm --filter @sobr/<pkg> typecheck`; app `cd apps/mobile && pnpm exec tsc --noEmit`.
3. **Bundling (catches build/resolve errors, then exits — unlike the dev server):**
   `cd apps/mobile && pnpm exec expo export --platform web|ios|android`.
4. **Config:** `pnpm dlx expo-doctor`.
5. **Visual (web):** drive headless Chrome to screenshot, then view the PNG. Pattern used:
   - Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; `npm i puppeteer-core`
     in a /tmp dir; `puppeteer.launch({ executablePath, headless:'new' })`; `page.goto('http://localhost:<port>/')`;
     `page.screenshot()`; capture `pageerror` events.
   - To screenshot **authed screens** without a session: temporarily edit `app/_layout.tsx`'s `Gate`
     to force the tabs route (`if (segments[0] !== '(tabs)') router.replace('/(tabs)'); return;`),
     restart the dev server, screenshot, then **restore the file** (back it up first; never commit it).
     Authed queries are disabled without a user, so screens render with empty data.

---

## 10. Conventions / working agreement

- **Commit per feature** (small, logical commits). End commit messages with the
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.
- **Pause-and-iterate** at stable checkpoints (green typecheck/tests, committed) rather than
  barrelling through a whole milestone.
- **End every task** by telling the user (1) what was achieved and (2) what *they* must do; then
  record it in `PROGRESS.md` and check it off in `TODO.md` (link the TODO group to the PROGRESS
  anchor). `TODO.md` is the live source of truth — never let it drift.
- Copy stays **non-judgmental + non-triggering**; aesthetic stays **calm dark wellness** (gradients,
  glass cards, soft amber glow — no harsh shadows, no casino gamification).

---

## 11. What's done vs. what's left

**Done (see PROGRESS.md for the full log):** M0 foundations · M1 tested core · M2 DB+RLS+grants ·
M3 app shell+auth · M4 logger · M5 streaks+tree · M6 calendar+stats · M7 settings · **M8 polish**
(micro-interactions incl. tree level-up, a11y, error/empty states, copy) · modern UI · daily
reminders · offline tolerance · Google sign-in (web) · **Phase 3 redesign** (light white+green
theme, Calendar merged into Home with a day-detail panel, two-step OTP sign-in, three-step
onboarding).

**Left / future (TODO.md → Future enhancements):**
- **Test the native app on a device** (needs a dev build) — only the user can.
- **Apple sign-in** — at store-publish time (paid Apple account + dev build).
- **Native Google** — works once a dev build exists (already wired).
- **Remote push** / smart "log before midnight" nudges.
- Optional EAS/dev-build setup (`eas.json` + guide) to make native testing one command.
- Optional dedicated Next.js `apps/web` if the web view ever outgrows RN Web.

**Outstanding user actions:** run `0001_grants.sql` if a fresh DB shows `42501`; make a dev build to
test native; (later) Apple Developer setup.

---

## 12. Kickoff prompt for the next agent

Paste this to the next agent:

> You're continuing work on **sobr**, a cross-platform (Expo web+iOS+Android) alcohol-moderation
> habit tracker at `/Users/gcsandesh/Desktop/projects/personal/sobr`. **Before doing anything,
> read `HANDOVER.md` in full, then `PROJECT.md`, `PLAN.md`, `PROGRESS.md`, and `TODO.md`** to learn
> the product, the architecture, every decision, the known gotchas, and exactly where we stopped.
> Skim recent `git log` for the change history (we commit one feature per commit).
>
> Then confirm the baseline is healthy: `pnpm install`, `pnpm --filter @sobr/core test` (expect
> 71 passing), and `cd apps/mobile && pnpm exec tsc --noEmit`. Verify UI changes the way HANDOVER
> §9 describes (expo export to catch build errors; headless-Chrome screenshots for visuals).
>
> Respect the working agreement in HANDOVER §10: commit per feature; keep `TODO.md` and
> `PROGRESS.md` updated (check items off, log what was done + what the user must do); keep copy
> non-judgmental/non-triggering and the aesthetic calm. Heed the gotchas in HANDOVER §6 (NativeWind
> darkMode/version, root `.env` via `app.config.js`, RLS GRANTs, extensionless imports, Metro
> `--clear`). The MVP is complete and working on web; the main remaining work needs a native dev
> build (see TODO → Future enhancements). Pick up from the top of `TODO.md`'s unchecked items, or
> ask the user which direction to take next.
