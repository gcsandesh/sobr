# sobr — Build TODO

Running source of truth for progress. Checked in place as work lands — not appended.
Legend: `[ ]` todo · `[x]` done · `[~]` in progress / partial.

---

## M0 — Foundations · [progress](PROGRESS.md#m0-foundations)
- [x] Enable pnpm (corepack), init git, create monorepo dirs
- [x] Root `package.json` + workspace scripts
- [x] `pnpm-workspace.yaml`, `turbo.json`
- [x] `tsconfig.base.json`, `.npmrc`, `.nvmrc`, prettier config
- [x] `.gitignore` (secrets, native, build artifacts)
- [x] `.env.example` (Supabase + DATABASE_URL, documented)
- [x] `PLAN.md` (stack rationale, data model, layout, milestones)
- [x] `TODO.md` (this file)
- [x] `@sobr/config`: design tokens (palette, spacing, radii, type scale)
- [x] `@sobr/config`: drink presets (incl. Nepal-local: raksi, tongba, local lager)
- [x] `@sobr/config`: currencies list (default USD, user-selectable)
- [x] `@sobr/config`: growth-stage thresholds + metadata
- [x] SVG brand assets: logo, app icon, favicon, splash (sprout-through-ring)
- [x] Root `README.md` with setup instructions
- [x] `PROJECT.md` context file + `PROGRESS.md` running log

## M1 — `@sobr/core` (correctness-critical, fully tested) · [progress](PROGRESS.md#m1-core)
- [x] Package scaffold (`@sobr/core`, tsconfig, vitest)
- [x] Zod schema: `Drink`
- [x] Zod schema: `DailyEntry` (+ status enum)
- [x] Zod schema: `UserSettings` (+ win_mode enum)
- [x] Zod schema: `FreezeGrant`
- [x] Inferred TS types exported from schemas
- [x] Date helpers: `localDateString`, `addDays`, `diffDays`, `todayInTz` (tz-safe)
- [x] Logic: `unitsForDrink`, `totalUnits`, `totalCost`
- [x] Logic: `determineStatus(mode, drinks, manualStatus, limit)`
- [x] Logic: `computeStreak` → current + longest (today/yesterday grace, gaps break)
- [x] Logic: freeze — `freezeMilestone`, `bankedFreezes` (cap 3), `freezesToAward`
- [x] Logic: `growthStage(totalWinDays)` (0/3/7/14/30/60)
- [x] Logic: monthly + all-time aggregates (wins, units, spend, avg units/drinking day)
- [x] Vitest: units (incl. quantity, zero-abv)
- [x] Vitest: win-determination (all 3 modes, boundary at limit)
- [x] Vitest: streak (grace day, gaps, freeze-protected, longest never decreases)
- [x] Vitest: freeze milestones + banking cap
- [x] Vitest: growth thresholds (each boundary)
- [x] Vitest: timezone/midnight edge cases
- [x] All core tests green

## M2 — Database (`@sobr/db`) · [progress](PROGRESS.md#m2-db)
- [x] Package scaffold (`@sobr/db`, drizzle-kit config)
- [x] Drizzle schema: `user_settings`, `daily_entries`, `drinks`, `freeze_grants`
- [x] SQL migration: tables + constraints + indexes
- [x] RLS: enable + force on every table
- [x] RLS policies: per-user isolation (drinks via parent entry)
- [x] `auto-create user_settings` trigger on new auth user
- [x] `delete_account` security-definer routine (purges all user rows)
- [x] `updated_at` triggers
- [x] Server-side drizzle client factory (`DATABASE_URL`)
- [ ] Apply migration to a real Supabase project (requires user's project) — _user step_

## M3 — App shell + auth · [progress](PROGRESS.md#m3-app)
- [x] Expo Router app scaffold (`apps/mobile`, TS strict, web enabled)
- [x] NativeWind + Tailwind config bridged to `@sobr/config` tokens
- [x] Load Fraunces + Manrope via `expo-font`
- [x] Root providers: QueryClient, Supabase session, theme
- [x] Supabase client (`EXPO_PUBLIC_*`), auth state listener
- [x] Email-OTP sign-in / verify screens
- [x] Session routing guards (authed vs. unauthed vs. onboarding)
- [x] Onboarding: 2–3 intro screens (calm, non-judgmental copy)
- [x] Onboarding: pick win condition (zero / limit / manual) → persists to settings
- [ ] Smoke-test auth + onboarding against a live Supabase project — _user step_

## M4 — Daily check-in + drink logger · [progress](PROGRESS.md#m3-app)
- [x] Today view: "No drinks today" (one-tap win) + "Log a drink"
- [x] Today summary card (status + totals), tappable to edit
- [x] Drink logger route `day/[date]` (any past/present day)
- [x] Preset picker sheet (presets from `@sobr/config`)
- [x] Quantity stepper (×N) per line item
- [x] Custom drink entry (name, volume, abv, cost)
- [x] Optional cost field, currency from settings
- [x] Running day total (units + cost), live
- [x] Live win/slip per mode (zero forces slip; limit shows X/limit; manual = user sets)
- [x] Edit / remove individual line items
- [x] Remove-entry action (clear a day logged by mistake)
- [~] Wire mutations to Supabase + optimistic cache updates — _wired to Supabase; optimistic updates deferred to Phase 2_

## M5 — Streaks + growth visual · [progress](PROGRESS.md#m3-app)
- [x] Home: growing-tree anchor, stage from lifetime win days
- [x] Tree growth visual with real craft (animated, per-stage SVG)
- [x] Current streak + longest streak display
- [x] Banked freeze tokens display (cap 3)
- [x] "Use a freeze to protect your streak" flow on a slip day
- [ ] Verify freeze award/use round-trips through DB

## M6 — Calendar + stats · [progress](PROGRESS.md#m3-app)
- [x] Month-grid calendar, color-coded (win/slip/frozen/future-disabled)
- [x] Per-day unit indicator dots
- [x] Tap a day → open drink logger for that date
- [x] Monthly aggregates (wins, units, spend, avg units/drinking day)
- [x] All-time stats (longest streak, total win days, total spent, total units)
- [x] SVG charts (units/spend over time)

## M7 — Settings · [progress](PROGRESS.md#m3-app)
- [x] Change win mode + daily limit value
- [x] Currency selector (default USD)
- [~] Time zone setting — _captured from device at onboarding + shown; in-app editor pending_
- [x] Account: show email, sign out
- [x] Account: delete account/data (calls purge routine) with confirm
- [~] Data export (CSV/JSON) — _dropped: data lives in the DB and syncs on login, so a manual export isn't needed. Model still supports adding a backup file later._

## M8 — Polish, a11y, tests · [progress](PROGRESS.md#m8-home)
- [x] Micro-interactions (tree level-up, streak increment, freeze use) — _streak count-up, win/freeze haptic + banner, and tree level-up celebration_
- [x] A11y audit: contrast (AA), ≥44px targets, SR labels on icon buttons — _contrast verified ≥AA; bumped steppers/chips/rows to ≥44px; radio roles added_
- [x] Empty states + first-run delight — _Home first-load + Progress first-run empty state_
- [x] Copy pass: non-judgmental tone everywhere ("slip", never "failure") — _audited: no triggering/judgmental words in UI_
- [x] Loading / error / offline-ish states for queries — _Notice/EmptyState; Home/Calendar/Progress retry on error_

## Phase 2 (post-MVP)
- [ ] Google + Apple sign-in (Expo)
- [x] Daily reminder (local notification, schedulable from Settings) — _native; user tests delivery on device. Push (remote) still pending._
- [ ] CSV / JSON export UI
- [x] Offline tolerance: optimistic local state + sync-on-reconnect — _persisted cache (instant reopen + offline reads), NetInfo online-manager (auto-resume on reconnect), optimistic save-day/use-freeze. Cross-restart write replay = future enhancement._
- [ ] Optional dedicated `apps/web` (Next.js) if web view outgrows RN Web

---

### Status notes
- Items marked _user step_ require the user's own Supabase project + secrets and
  can't be executed in this environment; everything around them is built and ready.
- `@sobr/core` is the only layer fully runnable/verifiable here with no backend —
  it carries the correctness-critical math and has the test suite.
