# sobr — Plan & Architecture

> **Historical plan (June 2026).** Kept for the reasoning behind the stack. Some details have
> since changed: the theme is now light mist + teal (not dark), auth is email + password (not
> OTP), and there are more tables (`day_photos`, `email_log`). For the current state, read
> **[HANDOVER.md](./HANDOVER.md)**.

A calm, growth-oriented drinking-habit tracker built around a daily win/slip streak,
a freeze-token safety net, and a growing-tree visual anchored to lifetime progress.

> **Tone is a feature.** Copy is never shaming. A bad day is a "slip", never a
> "failure" or "relapse". This constraint applies to code comments, UI strings,
> empty states, and error messages alike.

---

## 1. Tech stack — decisions & rationale

### Final stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Monorepo | **pnpm workspaces + Turborepo** | Shared logic/schema never drifts across surfaces. |
| Frontend | **Single Expo Router app (iOS + Android + Web)** | One UI codebase for all three targets. |
| Styling | **NativeWind (Tailwind for RN)** + shared design tokens | Works on native *and* web from one style system. |
| State/data | **TanStack Query** | Cache + optimistic updates on every surface. |
| Backend | **Supabase** (Postgres + Auth + RLS + Realtime + Storage) | Bundled auth + row-level isolation for sensitive data. |
| ORM / schema | **Drizzle ORM** | Type-safe schema as code, lives in a shared package. |
| Validation | **Zod** (shared package) | Single source of truth for entry/drink/settings shapes. |
| Charts | **react-native-svg** (hand-built lightweight charts) | One cross-platform charting path; no web/native split. |
| Auth (MVP) | **Email OTP / magic link** | Google + Apple deferred to Phase 2. |
| Tests | **Vitest** (domain logic in `@sobr/core`) | The bug-prone math gets real coverage. |

### Where I deviated from the brief's starting preference (and why)

**Single Expo Router app for web too, instead of a separate Next.js app.**

The brief explicitly invited this argument. I'm taking it:

- The web surface here is an **authenticated companion view** (review, stats,
  settings). There is no public/marketing content, so **SEO and SSR — Next.js's
  headline advantages — bring no value** to this product.
- A **single UI codebase eliminates drift entirely**, not just at the token level.
  Every screen, component, and interaction is written once. For a solo personal
  tool, maintaining two frontends is the single largest avoidable cost.
- **Expo Router's web output + NativeWind** produces a genuinely good responsive
  web app. The "companion view" requirement (stats/settings/review) is exactly the
  content that renders well in React Native Web — we are not shipping a cramped port,
  we are shipping responsive layouts that adapt at web breakpoints.
- **The monorepo and shared packages stay**, so if the web app ever outgrows this
  (e.g. wants Next.js SSR, richer desktop layouts), a dedicated `apps/web` can be
  added later that imports the same `@sobr/core` / `@sobr/db` / `@sobr/config`
  packages. **Nothing about this decision is a one-way door.**

Knock-on simplifications from one codebase:
- **Charts:** one cross-platform approach with `react-native-svg` instead of
  Recharts (web) + Victory Native (mobile). For this app's charts (small bar/area
  summaries) a few hand-built SVG components are lighter than either library and
  behave identically everywhere.
- **Components:** `shadcn/ui` is web-DOM only, so it doesn't apply. We build a
  small in-house RN component kit styled with NativeWind + design tokens.

**Kept exactly as the brief preferred:** pnpm + Turborepo, Supabase (the auth +
RLS + Postgres bundle is the right call over Neon + a bolted-on auth provider for
sensitive per-user data), Drizzle, Zod, TanStack Query, Expo + Expo Router +
NativeWind, shared design tokens.

---

## 2. Monorepo layout

```
sobr/
├─ apps/
│  └─ mobile/                 # Expo Router app — targets iOS, Android, and Web
│     ├─ app/                 # file-based routes (expo-router)
│     │  ├─ (auth)/           # sign-in / OTP screens
│     │  ├─ (onboarding)/     # first-run: intro + pick win condition
│     │  ├─ (tabs)/           # home, calendar, stats, settings
│     │  └─ day/[date].tsx    # drink logger for a given local date
│     ├─ src/
│     │  ├─ components/        # in-house RN component kit (Button, Card, Sheet…)
│     │  ├─ features/          # screen-level feature modules
│     │  ├─ lib/               # supabase client, query client, providers
│     │  ├─ hooks/             # data hooks (useDailyEntry, useStreak…)
│     │  └─ theme/             # NativeWind config bridge to @sobr/config tokens
│     └─ assets/              # fonts, generated SVG icons/splash
│
├─ packages/
│  ├─ core/                   # @sobr/core — PURE domain logic + Zod schemas + types
│  │  └─ src/
│  │     ├─ schemas/          # Zod: UserSettings, DailyEntry, Drink, ...
│  │     ├─ logic/            # units, win-determination, streak, freeze, growth
│  │     ├─ date/             # timezone-safe local-day helpers
│  │     └─ __tests__/        # Vitest suites for all of the above
│  ├─ config/                 # @sobr/config — design tokens, presets, currencies
│  │  └─ src/
│  │     ├─ tokens.ts         # colors, spacing, radii, type scale
│  │     ├─ presets.ts        # drink presets (incl. Nepal-local)
│  │     ├─ currencies.ts     # currency list (default USD)
│  │     └─ growth.ts         # growth-stage thresholds + metadata
│  └─ db/                     # @sobr/db — Drizzle schema, migrations, RLS, client
│     └─ src/
│        ├─ schema.ts         # Drizzle table definitions
│        ├─ client.ts         # server-side drizzle client factory
│        └─ migrations/       # SQL incl. RLS policies + delete-account routine
│
├─ PLAN.md  · TODO.md
├─ package.json · pnpm-workspace.yaml · turbo.json
├─ tsconfig.base.json · .npmrc · .nvmrc · .env.example
```

**Dependency direction:** `apps/mobile` → (`@sobr/core`, `@sobr/config`, `@sobr/db`-types).
`packages/*` never import from `apps/*`. `@sobr/core` has **zero runtime deps except
Zod** so its logic stays portable and fast to test.

---

## 3. Data model

Matches the brief's sketch with a few deliberate refinements. Postgres + RLS.

### Tables

- **`user_settings`** — one row per user.
  - `user_id uuid pk → auth.users`
  - `win_mode text check (zero|limit|manual) default 'zero'`
  - `daily_limit_units numeric default 2`
  - `currency text default 'USD'`  *(default changed to USD per request; user-selectable)*
  - `time_zone text default 'UTC'`  **(added)** — the user's home tz, so "today" is computed
    consistently server-side and across devices, not just from the current device clock.
  - `created_at / updated_at timestamptz`

- **`daily_entries`** — one row per user per local day.
  - `id uuid pk`
  - `user_id uuid → auth.users`
  - `entry_date date not null` — stored as the user's **local civil date**, not UTC.
  - `status text check (win|slip|freeze) not null`
  - `note text` **(added, optional)** — supports the "reflect daily" use-case of manual mode.
  - `created_at / updated_at`
  - `unique (user_id, entry_date)`

- **`drinks`** — line items belonging to a day.
  - `id uuid pk`
  - `daily_entry_id uuid → daily_entries(id) on delete cascade`
  - `preset_key text` (null if custom)
  - `name text not null`
  - `volume_ml numeric not null`
  - `abv numeric not null` — stored as a **percentage number** (e.g. `5` for 5%).
  - `cost numeric` (optional)
  - `quantity integer default 1 check (quantity >= 1)`
  - `created_at`
  - *Units are **derived**, never stored:* `units = volume_ml × abv / 1000 × quantity`.

- **`freeze_grants`** — append-only ledger of earned/used freeze tokens.
  - `id uuid pk`
  - `user_id uuid → auth.users`
  - `granted_at timestamptz default now()`
  - `granted_for_streak int` **(added)** — the streak milestone (7,14,21…) that earned it,
    so we never double-award the same milestone.
  - `used_at timestamptz` (null = still banked)
  - `used_on_entry_id uuid → daily_entries(id)`

### Why a few derived things are NOT stored

- **Units** are always derived (single formula in `@sobr/core`) so there's no chance
  of a stored value drifting from the inputs.
- **Streak / longest / banked-freeze counts** are derived from `daily_entries` +
  `freeze_grants` on read. Storing them invites desync bugs — the exact class of bug
  the brief flags. They're cheap to compute over a user's history.

### Row-Level Security

Every table gets RLS `enabled` + `force`, with policies `using (auth.uid() = user_id)`
for select/insert/update/delete (and via the parent entry for `drinks`). A user can
**only ever** touch their own rows. **Account deletion** is a `security definer`
routine that purges all of a user's rows across every table, then the auth user.

### Privacy posture

Sensitive personal-health data throughout: no analytics/telemetry on drink content,
no third-party SDKs that can see this data, Supabase encryption at rest, and a delete
path that genuinely purges. Env secrets are gitignored; `DATABASE_URL` never ships in
the client bundle (only `EXPO_PUBLIC_*` keys reach the app).

---

## 4. Core domain logic (`@sobr/core`) — the part that must be correct

All pure, all unit-tested. No I/O, no dates-from-`Date.now()` inside the logic
(callers pass in "today" + tz, so tests are deterministic).

- **Units:** `unitsForDrink(d) = d.volume_ml * d.abv / 1000 * d.quantity`. Day total = sum.
- **Win determination** (`determineStatus(mode, drinks, manualStatus, limit)`):
  - `zero` → any drink present ⇒ `slip`, else `win`.
  - `limit` → total units ≤ limit ⇒ `win`, else `slip` (no drinks ⇒ win).
  - `manual` → returns the user's explicit `win|slip` choice, independent of drinks.
- **Streak** (`computeStreak(entries, today, tz)`):
  - *Current* = consecutive `win|freeze` days ending **today or yesterday** (one grace
    day so an unlogged "today" doesn't kill a live streak). Slip or a gap breaks it.
  - *Longest* = max run of consecutive `win|freeze` days across all history; never decreases.
- **Freeze tokens:**
  - Earn one per completed 7-day streak milestone (7,14,21…), tracked by `granted_for_streak`
    so we never double-grant. Banked (unused) count is **capped at 3**.
  - On a slip, if banked > 0, the user may convert that day to `freeze` (protect the streak).
- **Growth stage** (`growthStage(totalWinDays)`): thresholds at **0 / 3 / 7 / 14 / 30 / 60**
  → seed → sprout → sapling → young tree → full tree → grove. Keyed to **lifetime win
  days**, so a single slip never visibly regresses the tree.
- **Dates:** `localDateString(instant, tz)` + `addDays`, all operating on `YYYY-MM-DD`
  civil-date strings to dodge UTC/midnight off-by-ones. "Today" is the user's local day.

---

## 5. Design system

Dark-first, calm, nature/growth metaphor — closer to a wellness app than a dashboard.

- **Palette** (tokens in `@sobr/config`): deep charcoal-green background, soft **moss**
  for win, muted **terracotta** for slip (never alarm-red — slips aren't punished),
  dusty **blue** for frozen, warm **amber/gold** as the single accent for streaks.
- **Type:** **Fraunces** (warm serif/display) for headers + big numbers, **Manrope**
  (clean grotesk) for UI text. Loaded via `expo-font`.
- **Feel:** generous spacing, soft rounded corners, no harsh shadows.
- **A11y:** ≥44px tap targets, WCAG-AA contrast on the dark theme, screen-reader labels
  on icon-only controls.
- **Brand mark / icons:** a growing-tree glyph, shipped as editable **SVG** (favicon,
  app icon, splash) — placeholder-quality but on-brand; user can replace.

---

## 6. Milestones

- **M0 — Foundations** *(this session)*: monorepo, tooling, PLAN/TODO, design tokens,
  presets, currencies, growth config, SVG brand assets.
- **M1 — `@sobr/core` (tested)** *(this session)*: Zod schemas, units, win-determination,
  streak, freeze, growth, date helpers + full Vitest coverage. **Highest priority — the
  correctness-critical core, fully verifiable without any backend.**
- **M2 — Database**: Drizzle schema, SQL migrations, RLS policies, delete-account routine,
  seed/local-dev notes.
- **M3 — App shell + auth**: Expo Router app, NativeWind + tokens + fonts wired, Supabase
  client, email-OTP auth, session handling, onboarding (intro + pick win condition).
- **M4 — Daily check-in + drink logger**: today view, one-tap "No drinks", preset sheet,
  quantity stepper, custom drink, live units/cost totals, live win/slip per mode, edit/remove.
- **M5 — Streaks + growth visual**: home anchor screen, animated growing tree, current/longest
  streak, freeze banking + "use a freeze" flow.
- **M6 — Calendar + stats**: month grid (color-coded, tappable), per-day unit dots, monthly
  aggregates, all-time stats with SVG charts.
- **M7 — Settings**: win mode + limit, currency, account (email, sign out, delete-all), tz.
- **M8 — Polish + a11y + tests pass**: micro-interactions, contrast/tap-target audit,
  empty states, copy review for non-judgmental tone.
- **Phase 2 (post-MVP)**: Google/Apple sign-in, Expo push reminders, CSV/JSON export UI,
  offline/optimistic sync, a dedicated `apps/web` if the web view outgrows RN Web.

Progress is tracked task-by-task in **`TODO.md`** (kept in sync as work lands).
