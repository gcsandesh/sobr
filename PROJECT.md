# sobr — Project Context

> Single source of truth for *what we're building and the principles behind it*.
> Read this first. Architecture lives in [PLAN.md](./PLAN.md), the task list in
> [TODO.md](./TODO.md), and a running log of progress in [PROGRESS.md](./PROGRESS.md).

## The one-liner

**sobr — clear days, counted.** A calm, private companion for building a steadier
relationship with alcohol, built around a daily win/slip streak, a freeze-token
safety net, and a growing tree that reflects long-term progress.

## What it is (and isn't)

- It **is** a gentle daily ritual: check in, watch a streak and a tree grow, look
  back over a calendar, and see quiet progress.
- It **is not** a clinical "drinking tracker" or a finance dashboard. We avoid that
  framing deliberately (see Language below).

## Principles (non-negotiable)

1. **Calm, never punitive.** A bad day is a *slip*, never a "failure" or "relapse".
   Colors, copy, and animation stay supportive. Slip uses warm terracotta, not
   alarm-red.
2. **Non-triggering language.** Some people are nudged toward drinking when reminded
   of it. So app chrome leans on *clear days, wins, growth, reflection* — not
   "drinking tracker / alcohol / consumption". The drink logger exists, but the
   surrounding UI never dwells on it. Headings ask "How was today?", celebrate a
   "clear day", and frame the goal as growth.
3. **Privacy first.** This is sensitive personal-health data. Per-user accounts with
   Postgres Row-Level Security (a user can only ever touch their own rows). No
   analytics/telemetry on logged content, no third-party SDKs that can see it,
   encryption at rest, and account deletion that genuinely purges everything.
4. **Correctness of the math.** Streaks, units, freezes, and timezone/"today" logic
   are the most bug-prone and least-visible-when-wrong. They live in a pure,
   fully-unit-tested package (`@sobr/core`).
5. **Engaging like Duolingo — but quiet.** Borrow the habit-forming clarity (a single
   emotional anchor, satisfying streak feedback, a forgiving freeze) without the loud,
   gamified-casino energy. The tree is our flame.

## The core loop

Each day the user either taps **"It was a clear day"** (one-tap win) or **logs what
they had**. A win extends the **streak** and adds to **lifetime clear days**, which
grows the **tree** (seed → sprout → sapling → young tree → full tree → grove at
0/3/7/14/30/60 clear days). Every 7-day streak earns a **freeze token** (max 3 banked);
on a slip, a freeze can protect the streak instead of resetting it.

## Win conditions (per-user, changeable anytime)

- **A clear day** (`zero`) — any logged item makes the day a slip.
- **Within my limit** (`limit`) — total units ≤ a personal daily limit is a win.
- **I'll decide each day** (`manual`) — the user reflects and calls it themselves.

Units use the UK formula: `units = volume_ml × abv% / 1000` (× quantity).

## Tech stack (summary — full rationale in PLAN.md)

- **Monorepo:** pnpm workspaces + Turborepo.
- **Frontend:** one **Expo Router** app targeting **iOS + Android + Web** (no separate
  Next.js app — the web surface is an authed companion, so a single UI codebase wins).
- **Styling:** NativeWind + shared design tokens. **Data:** TanStack Query.
- **Backend:** Supabase (Postgres + Auth + RLS). **ORM/migrations:** Drizzle.
- **Validation:** Zod (shared). **Charts/visuals:** react-native-svg.
- **Auth (MVP):** email OTP. **Tests:** Vitest on `@sobr/core`.

### Packages
- `@sobr/core` — schemas + pure logic (units, win, streak, freeze, growth, dates). Tested.
- `@sobr/config` — design tokens, drink presets (incl. Nepal-local), currencies (default
  **USD**, user-selectable), growth-stage display metadata.
- `@sobr/db` — Drizzle schema, RLS migration, account-purge routine, server client.
- `apps/mobile` — the Expo app (web + native).

## Design language

- Dark-first, deep charcoal-green background; **moss** = win, **terracotta** = slip,
  **dusty blue** = frozen, **amber/gold** = the single accent (streaks/highlights).
- Type: **Fraunces** (warm serif) for headers + big numbers; **Manrope** (grotesk) for UI.
- Generous spacing, soft rounded corners, no harsh shadows. ≥44px tap targets, AA contrast,
  screen-reader labels on icon-only buttons.
- Brand mark: a sprout rising through an open ring (growth + "days, counted"). SVG assets in
  `apps/mobile/assets/brand/` (placeholder-quality; replaceable).

## On the roadmap (kept in mind, not MVP-blocking)

- **Reminders / notifications:** gentle, well-timed nudges ("a moment to check in")
  via Expo push — phrased to encourage reflection, never to remind of drinking. The
  data model and `time_zone` setting are already in place to support per-user local
  scheduling. (Phase 2.)
- Google / Apple sign-in, CSV/JSON export UI, offline tolerance (optimistic + sync),
  optional dedicated Next.js web app if the companion view outgrows RN Web.

## Working agreement (how we build this together)

- **Pause-and-iterate.** Stop at stable checkpoints (typecheck/tests green, committed)
  rather than barrelling through a whole milestone — so we can review and refine and
  never get stranded mid-task.
- **End every task** by telling the user: (1) what was achieved, (2) what *they* need to
  do from their side, then record it in **PROGRESS.md** and check the item off in
  **TODO.md** (with a link to the matching PROGRESS.md section).
- **TODO.md is the live truth** — checked off in place as work lands, never drifting.
