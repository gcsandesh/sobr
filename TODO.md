# sobr — Build TODO

Running source of truth for progress. Checked in place as work lands — not appended.
Legend: `[ ]` todo · `[x]` done · `[~]` in progress / partial.

---

## M0 — Foundations
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
- [ ] SVG brand assets: app icon, favicon, splash glyph (growing tree)
- [ ] Root `README.md` with setup instructions

## M1 — `@sobr/core` (correctness-critical, fully tested)
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

## M2 — Database (`@sobr/db`)
- [ ] Package scaffold (`@sobr/db`, drizzle-kit config)
- [ ] Drizzle schema: `user_settings`, `daily_entries`, `drinks`, `freeze_grants`
- [ ] SQL migration: tables + constraints + indexes
- [ ] RLS: enable + force on every table
- [ ] RLS policies: per-user isolation (drinks via parent entry)
- [ ] `auto-create user_settings` trigger on new auth user
- [ ] `delete_account` security-definer routine (purges all user rows)
- [ ] `updated_at` triggers
- [ ] Server-side drizzle client factory (`DATABASE_URL`)
- [ ] Apply migration to a real Supabase project (requires user's project) — _user step_

## M3 — App shell + auth
- [ ] Expo Router app scaffold (`apps/mobile`, TS strict, web enabled)
- [ ] NativeWind + Tailwind config bridged to `@sobr/config` tokens
- [ ] Load Fraunces + Manrope via `expo-font`
- [ ] Root providers: QueryClient, Supabase session, theme
- [ ] Supabase client (`EXPO_PUBLIC_*`), auth state listener
- [ ] Email-OTP sign-in / verify screens
- [ ] Session routing guards (authed vs. unauthed vs. onboarding)
- [ ] Onboarding: 2–3 intro screens (calm, non-judgmental copy)
- [ ] Onboarding: pick win condition (zero / limit / manual) → persists to settings
- [ ] Smoke-test auth + onboarding against a live Supabase project — _user step_

## M4 — Daily check-in + drink logger
- [ ] Today view: "No drinks today" (one-tap win) + "Log a drink"
- [ ] Today summary card (status + totals), tappable to edit
- [ ] Drink logger route `day/[date]` (any past/present day)
- [ ] Preset picker sheet (presets from `@sobr/config`)
- [ ] Quantity stepper (×N) per line item
- [ ] Custom drink entry (name, volume, abv, cost)
- [ ] Optional cost field, currency from settings
- [ ] Running day total (units + cost), live
- [ ] Live win/slip per mode (zero forces slip; limit shows X/limit; manual = user sets)
- [ ] Edit / remove individual line items
- [ ] Remove-entry action (clear a day logged by mistake)
- [ ] Wire mutations to Supabase + optimistic cache updates

## M5 — Streaks + growth visual
- [ ] Home: growing-tree anchor, stage from lifetime win days
- [ ] Tree growth visual with real craft (animated, per-stage SVG)
- [ ] Current streak + longest streak display
- [ ] Banked freeze tokens display (cap 3)
- [ ] "Use a freeze to protect your streak" flow on a slip day
- [ ] Verify freeze award/use round-trips through DB

## M6 — Calendar + stats
- [ ] Month-grid calendar, color-coded (win/slip/frozen/future-disabled)
- [ ] Per-day unit indicator dots
- [ ] Tap a day → open drink logger for that date
- [ ] Monthly aggregates (wins, units, spend, avg units/drinking day)
- [ ] All-time stats (longest streak, total win days, total spent, total units)
- [ ] SVG charts (units/spend over time)

## M7 — Settings
- [ ] Change win mode + daily limit value
- [ ] Currency selector (default USD)
- [ ] Time zone setting
- [ ] Account: show email, sign out
- [ ] Account: delete account/data (calls purge routine) with confirm
- [ ] Data export (CSV/JSON) — _Phase 2; data model supports it_

## M8 — Polish, a11y, tests
- [ ] Micro-interactions (tree level-up, streak increment, freeze use)
- [ ] A11y audit: contrast (AA), ≥44px targets, SR labels on icon buttons
- [ ] Empty states + first-run delight
- [ ] Copy pass: non-judgmental tone everywhere ("slip", never "failure")
- [ ] Loading / error / offline-ish states for queries

## Phase 2 (post-MVP)
- [ ] Google + Apple sign-in (Expo)
- [ ] Expo push reminders ("log today before midnight")
- [ ] CSV / JSON export UI
- [ ] Offline tolerance: optimistic local state + sync-on-reconnect
- [ ] Optional dedicated `apps/web` (Next.js) if web view outgrows RN Web

---

### Status notes
- Items marked _user step_ require the user's own Supabase project + secrets and
  can't be executed in this environment; everything around them is built and ready.
- `@sobr/core` is the only layer fully runnable/verifiable here with no backend —
  it carries the correctness-critical math and has the test suite.
