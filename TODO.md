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
- [x] Apply migration to a real Supabase project
- [x] `0001_grants.sql` applied — `authenticated` had no CRUD on any app table, so every
      read/write failed before RLS was even consulted (see HANDOVER → "Missing GRANTs")
- [x] `0004_day_photos.sql` applied — table + RLS + private storage bucket/policies

## M3 — App shell + auth · [progress](PROGRESS.md#m3-app)
- [x] Expo Router app scaffold (`apps/mobile`, TS strict, web enabled)
- [x] NativeWind + Tailwind config bridged to `@sobr/config` tokens
- [x] Load Fraunces + Manrope via `expo-font`
- [x] Root providers: QueryClient, Supabase session, theme
- [x] Supabase client (`EXPO_PUBLIC_*`), auth state listener
- [x] ~~Email-OTP sign-in / verify screens~~ → replaced by email + password (no verification):
      sending mail needs a verified domain + custom SMTP, which blocked sign-in entirely
- [x] Session routing guards (authed vs. unauthed vs. onboarding)
- [x] Onboarding: 2–3 intro screens (calm, non-judgmental copy)
- [x] Onboarding: pick win condition (zero / limit / manual) → persists to settings
- [x] Smoke-test auth + onboarding against a live Supabase project — verified end to end
      (sign-up → session → onboarding → "Plant my tree" → tabs) on 2026-09-20
- [x] **Confirm email turned OFF** — verified 2026-09-25: sign-up returns a session
      immediately, so anyone can create an account and use the app.

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
- [x] Verify freeze award/use round-trips through DB — award (grant row → 1/3 in UI) and
      use (slip → freeze, `used_at` + `used_on_entry_id` set, streak 0 → 13) both confirmed
      against the live project

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
- [x] Time zone setting — captured at onboarding; editable from Settings (picker sheet)
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
- [~] Google sign-in (Expo) — _built and verified on web, but **button is commented out for now** (untestable in Expo Go). Re-enabling is deliberately the LAST item — see the bottom of Future enhancements._
- [x] Daily reminder (local notification, schedulable from Settings) — _native; user tests delivery on device. Push (remote) still pending._
- [~] CSV / JSON export UI — _dropped: data lives in the DB and syncs on login._
- [x] Offline tolerance: optimistic local state + sync-on-reconnect — _persisted cache (instant reopen + offline reads), NetInfo online-manager (auto-resume on reconnect), optimistic save-day/use-freeze. Cross-restart write replay = future enhancement._
- [ ] Optional dedicated `apps/web` (Next.js) if web view outgrows RN Web

## Phase 3 — redesign: light theme + merged Home · [progress](PROGRESS.md#redesign-light-theme)
- [x] Retheme to a light, minimal white + moss-green palette (tokens, tailwind, ui.tsx, Tree, Glow, GrowthCelebration, splash/status bar)
- [x] Merge Calendar into Home: embedded month grid + inline day-detail panel below (Calendar tab removed)
- [x] Split OTP sign-in into two routes (sign-in email entry → verify code entry)
- [x] Split onboarding into three routes (welcome → how-it-works → win-condition) with a shared progress indicator

## Phase 4 — modern UI + engagement · [progress](PROGRESS.md#phase4-engagement)
- [x] Design-system v2: SectionHeader, ListRow, Chip, Avatar + new line icons (user, bell, spark, globe, target, wallet, log-out, chevron)
- [x] Tab bar: borderless floating look, 4 tabs (Home · Progress · Profile · Settings)
- [x] Profile screen: avatar, display name, member-since, stats grid, growth-journey achievement track, sign out
- [x] Settings redesign: grouped sections + icon rows, time-zone editor (device + common IANA zones)
- [x] Motivational notifications: opt-in "daily motivation" (7 rotating weekday messages, local weekly triggers) alongside the daily check-in
- [x] Home hero: soft green gradient wash, progress bar to next stage, stat-pill row
- [x] Progress tab restyle (gradient rounded bars + weekday labels), drink-logger polish (icon status badge, section headers), About screen (privacy/notifications/version, linked from Settings)
- [x] Dev-only auth bypass: `EXPO_PUBLIC_SKIP_AUTH=1` (+ `__DEV__` gate) jumps straight to tabs for Expo Go testing
- [x] frontend-design skill pass: forest-at-dusk hero (the app's one bold dominant surface — dark gradient, glow, warm Fraunces numeral), editorial greeting headline, staggered page-load reveal on Home
- [x] Google sign-in button commented out (untestable in Expo Go) — re-enable is the LAST TODO item
- [ ] User must test both notification schedules on a device (needs dev build for full fidelity)

## Phase 5 · Complete app + release pipeline · [progress](PROGRESS.md#phase5-complete)
- [x] UI kit: TextField, OptionList, ToggleRow, RowValue, icons; max-width layout; tab labels
- [x] Forgot password (code-based recovery) + change password
- [x] Display name (auth metadata): onboarding step 1 + Account screen
- [x] Account screen (name, password, sign out, delete); Settings/Profile de-duplicated
- [x] Settings: picker sheets for win rule / currency / time zone
- [x] Day reflection notes (+ fix: saves without a note no longer wipe it)
- [x] History screen (grouped by month, filters, notes inline)
- [x] Support screen (helplines, peer groups, stopping-safely note)
- [x] Privacy policy + terms screens (`src/content/legal.ts`)
- [x] Not-found route
- [x] Email hook: per-action copy, teal palette
- [x] GitHub Actions: tests + typecheck + release APK → GitHub Release
- [x] DEPLOY.md checklist
- [x] _User step:_ add `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` repo secrets
- [ ] _User step:_ paste `packages/db/email/reset-password.html` into Supabase → Reset Password template
- [ ] _Optional, later:_ wire + redeploy the `send-email` hook (Resend) once there are other users
- [ ] _User step:_ phone smoke test (DEPLOY.md §4)
- [x] Keyboard-aware screens on edge-to-edge Android; adaptive/themed + notification icons
- [x] Never overwrite a day that failed to load (day screen, quick-add, one-tap win)
- [x] CSV export; pull to refresh; ErrorBoundary; limit stepper; notification tap → today
- [ ] Dark mode (deferred: see PROGRESS → Phase 5 decisions)
- [ ] Mood on check-in (needs a migration)

---

## Day photos — "track memories as well"
- [x] `day_photos` table + RLS, private `day-photos` storage bucket + object policies
- [x] Object key is `<user_id>/<entry_id>/<id>.<ext>`; every storage policy pins the first
      path segment to `auth.uid()`, so the path *is* the authorization
- [x] Signed URLs minted per fetch (batched) — never persisted, since the bucket is private
- [x] `DayPhotos` strip on the day screen: pick from library (long-press Add for camera),
      long-press a thumbnail to remove
- [x] Verified end to end against the live project (row + object, 1.38 MB JPEG)
- [x] Captions — tap a thumbnail for a detail sheet with the full photo, a note field,
      and remove (remove moved off the long-press, which was undiscoverable)
- [x] Photo indicator on the calendar — corner dot, so a day can show both a status and a photo

## Future enhancements (when published to the App Store / Play Store)
- [ ] **Apple sign-in** — add once there's a paid Apple Developer account + a dev/EAS build
  (Apple requires it; "Sign in with Apple" is also mandatory for App Store apps that offer Google).
- [ ] Remote push notifications (smart "log before midnight" nudges).
- [ ] Data backup/export file (CSV/JSON) — model already supports it.
- [ ] **LAST: re-enable Google sign-in** — the flow stays wired in `src/lib/auth.ts`
  (`signInWithGoogle`; web was verified working), but the button is no longer in
  `apps/mobile/app/(auth)/sign-in.tsx` — that screen was rewritten for email + password, so the
  button + "or" divider need re-adding, not just uncommenting. Do this only once a custom
  dev/EAS build exists so native can actually be tested (Expo Go can't run the `sobr://`
  redirect).

---

### Status notes
- Items marked _user step_ require the user's own Supabase project + secrets and
  can't be executed in this environment; everything around them is built and ready.
- `@sobr/core` is the only layer fully runnable/verifiable here with no backend —
  it carries the correctness-critical math and has the test suite.
