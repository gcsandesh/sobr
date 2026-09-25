# sobr — Progress Log

A running, human-readable record of what's been built, checkpoint by checkpoint.
Each entry: **what was achieved** + **what you (the user) need to do**. TODO.md links
its task groups here.

---

<a id="phase5-complete"></a>
## Phase 5 · Complete app + Android release pipeline ✅ done (2026-09-25)

**Decisions made (engineer's call, per the user's "decide and continue")**
- Stay **light** (mist + teal); no dark mode yet. Dark would touch every hardcoded
  color and re-open the NativeWind `darkMode` gotcha for little gain right now.
- **Password reset is code-based**, not link-based: `resetPasswordForEmail` → 6-digit code
  from the existing Resend hook → `verifyOtp({ type: 'recovery' })` + `updateUser`. No deep
  links, so it works on a phone today.
- **Display name lives in auth `user_metadata`**: identity, not a preference; no migration.
- **Notes = the existing `daily_entries.note` column** (500 chars). Moods deferred (would
  need a migration).
- **Support screen** leads with Nepal numbers (ambulance 102, helpline 1166) plus the
  worldwide findahelpline.com directory, and a plain "stopping safely" medical caution.
- **APK via GitHub Actions**: this dev environment can't reach `dl.google.com` (Android
  SDK) or `api.expo.dev` (EAS), so the release build runs on GitHub's runners and is
  published as a GitHub Release. Signed with the RN template debug keystore (stable, so
  updates install over the top; fine for sideloading, not for stores).

**Achieved**
- UI kit: `TextField` (label, inline error, password reveal), `OptionList`, `ToggleRow`,
  `RowValue`, new icons; `Screen` centers at 640px on tablets/desktop; tab labels no longer clip.
- New screens: **Forgot password**, **Account** (name, password, sign out, delete),
  **History** (month-grouped, filterable, notes inline), **Support**, **Privacy policy**,
  **Terms**, **404**.
- Redesigns: **Settings** (account row, picker sheets instead of chip walls, Help & info),
  **Profile** (edit on avatar, History link, no duplicate sign-out), **Sign-in** (field
  errors, kinder auth errors, "Forgot password?"), **Onboarding** step 1 asks for a name.
- Day screen **Reflection** field; Home shows the note and greets by chosen name.
- **Bug fixed:** saving a day without a note (one-tap win, quick-add, freeze) wrote
  `note: null`, which would have erased a reflection. The note is now only written when passed.
- Email hook: per-action copy (sign-up / reset / email change) and the teal palette.
- `DEPLOY.md` deploy checklist; `.github/workflows/android-apk.yml`.
- Verified: 75/75 core tests, app typecheck, Android JS bundle export, web screenshots of
  every new/changed screen.

**What you need to do**
1. Add two repo secrets (Settings → Secrets and variables → Actions):
   `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Then re-run the
   *Android APK* workflow; the APK appears under Releases.
2. Redeploy the email hook so reset emails say "reset":
   `npx supabase functions deploy send-email --project-ref uqozokfjfstsfuelgzcy --no-verify-jwt`.
3. Run the phone smoke test in DEPLOY.md §4.

---

<a id="phase4-polish"></a>
## Phase 4b · Skill-driven polish + dev unblocks — ✅ done (2026-07-14)

**Achieved**
- **frontend-design skill pass** (`.claude/frontend-design_SKILL.md`): committed to one
  bold, memorable surface instead of evenly-timid styling — the Home hero is now a
  **forest-at-dusk card** (deep green gradient, amplified glow, oversized warm-off-white
  Fraunces streak numeral, moss progress bar) while the rest of the app stays quiet
  white. Header flipped to an editorial greeting headline ("Good evening" in Fraunces,
  "sobr" as a whisper above it). **Staggered page-load reveal** on Home (header → hero →
  stat pills → calendar → day panel, 80ms steps).
- **Progress tab restyle:** gradient rounded bars + weekday initials under the 14-day
  chart; v2 SectionHeaders.
- **Drink logger polish:** icon status badge on the day banner, SectionHeaders.
- **About screen** (`/about`): app info + version, privacy and notifications explainers,
  linked from Settings → About.
- **Dev-only auth bypass:** `EXPO_PUBLIC_SKIP_AUTH=1` in the root `.env` (dev builds
  only — double-gated on `__DEV__`) jumps straight to the tabs so screens can be tested
  in Expo Go, where Google sign-in can't run. Documented in `.env.example`.
- **Google sign-in temporarily disabled:** the button + divider are commented out in
  `(auth)/sign-in.tsx` (flow stays wired in `src/lib/auth.ts`; web was verified
  earlier). Re-enabling is deliberately the last TODO item — after a dev/EAS build
  exists.
- Verified: 71/71 core tests, typecheck clean, web + iOS exports clean, in-browser
  screenshots of the new hero + stagger (no console errors).

**What you need to do**
1. Commit the working tree when happy (you asked to own commits).
2. To browse the app in Expo Go: add `EXPO_PUBLIC_SKIP_AUTH=1` to `.env`, run
   `pnpm app --clear`; remove the line to restore real auth.
3. Check the Supabase email template includes `{{ .Token }}` so the OTP code is
   visible in the email (a link-only template looks like "OTP doesn't work").

---

<a id="phase4-engagement"></a>
## Phase 4 · Modern UI + engagement — ✅ done (2026-07-11)

**Goal:** make the daily ritual feel light and rewarding — never a burden — with a
more modern look and gentle motivation that arrives on its own.

**Achieved**
- **Design-system v2** (`ui.tsx` + `icons.tsx`): `SectionHeader`, `ListRow` (icon
  bubble + title/subtitle + press affordance), `Chip` (selectable pill — now the one
  pattern for times/zones/currencies/win modes), initials `Avatar`, and eight new
  line icons. Tab bar dropped its hairline border for a soft floating shadow.
- **Profile screen** (new tab): avatar + display name derived from the email,
  member-since, a 2×2 stats grid (current/longest streak, clear days, freezes), the
  **growth journey** rendered as an achievement track (achieved stages checked in
  green, current stage marked "you are here"), a freeze explainer, sign out.
- **Settings redesign:** grouped modern sections — Preferences (win mode, currency,
  **new time-zone editor**: device zone + common IANA zones, tap the row to expand),
  Notifications, Account. Everything on the v2 kit; functional parity kept.
- **Motivational notifications** (opt-in, device-local, no servers): alongside the
  existing daily check-in there's now **"Daily motivation"** — one warm note per day
  with different copy for each weekday (seven weekly local triggers, so nothing
  repeats two days in a row). Copy is growth-framed and non-triggering. Both
  schedules are applied atomically by `notifications.ts`; `useNotificationPrefs`
  (AsyncStorage) replaces `useReminder` and turns toggles back off if permission is
  denied.
- **Home hero:** soft green gradient wash behind the tree, a progress bar toward the
  next growth stage, and a stat-pill row (clear days · longest · freezes).
- Verified: 71/71 core tests, typecheck clean, web + iOS exports clean, in-browser
  checks of Home, Profile, and Settings (incl. the time-zone expander) with no
  console errors.

**What you need to do**
1. Reload (`pnpm web` / `pnpm app --clear`) and look around — Home hero, the new
   Profile tab, and the redesigned Settings.
2. On your phone (dev build), enable **both** notification toggles and confirm the
   check-in arrives at the chosen hour and the motivation note varies day to day.

---

<a id="redesign-light-theme"></a>
## Phase 3 · Redesign — light theme + merged Home — ✅ done (2026-07-01)

**Decision:** moved from the dark charcoal-green theme to a light, minimal white +
moss-green palette, and merged the standalone Calendar tab into Home with an inline
day-detail panel, per direction from the user during a page-planning session.

**Achieved**
- **Retheme:** `packages/config/src/tokens.ts` (single source of truth) and its
  `tailwind.config.js` mirror now define a white background with moss-green as the
  primary accent (kept: calm terracotta for slips, dusty blue for frozen — never
  alarm colors). Updated `ui.tsx` (Screen gradient, Card, Button, Notice), `Tree.tsx`
  (added a distinct warm-brown trunk color so it doesn't blend into the green canopy),
  `Glow.tsx` and `GrowthCelebration.tsx` (overlay + accent color), `app.json`
  (`userInterfaceStyle`, splash/background colors), and the status bar style
  (light → dark icons).
- **Home + Calendar merge:** extracted the month-grid calendar into a reusable
  `MonthCalendar` component and embedded it on Home, directly below the tree/streak
  card. Tapping any past or present date shows that day's check-in (status,
  units/drinks, edit/log actions) in a detail panel beneath the grid — no navigation
  away. Today is selected by default so the original quick-win flow is unchanged.
  The standalone Calendar tab is gone (`(tabs)/calendar.tsx` deleted); the tab bar is
  now Home · Progress · Settings.
- **OTP sign-in split:** `(auth)/sign-in.tsx` (email entry) and a new
  `(auth)/verify.tsx` (code entry) replace the old single-screen local-state toggle,
  so "wrong email?" is a natural `router.back()`.
- **Onboarding split:** `(onboarding)/index.tsx` now just redirects to the first real
  step; `welcome.tsx` → `how-it-works.tsx` → `win-condition.tsx` are separate routes
  with a shared `OnboardingProgress` dot indicator, navigated via `router.push`/`back`.
- Verified: `@sobr/core` 71/71 tests, app typecheck clean, web + iOS `expo export`
  clean, `expo-doctor` 18/18. Visually confirmed via headless Chrome screenshots
  (sign-in, verify, Home with embedded calendar + day-detail panel, date selection,
  Settings, all three onboarding steps) — clean, white, green-accented, matches the
  "modern, clean, minimalistic" brief.

**What you need to do** — reload (`pnpm web` / `pnpm app --clear`) and look around;
tell me if the green/white balance or any specific screen needs tuning. More
page/feature questions are still being worked through incrementally — this covers
what was decided so far.

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

<a id="metro-stale"></a>
## Note · "Unable to resolve @tanstack/react-query-persist-client" — ✅ not a code bug (2026-06-23)

A reload reported the persist-client package as unresolvable. The package is installed and
resolves fine — a **fresh Android bundle passed**. Cause: the Metro dev server was running
before the dep was installed, and a *reload* doesn't refresh its module map. **Fix:** restart
Metro with a cleared cache — `pnpm app --clear` (or `npx expo start -c`).

<a id="google-signin"></a>
## Phase 2 · Google sign-in — ✅ built (web-ready) (2026-06-23)

**Decision:** Google now; **Apple deferred** to "Future enhancements" (needs a paid Apple
Developer account + a dev/EAS build — to add at store-publish time).

**Achieved** — "Continue with Google" on the sign-in screen via Supabase OAuth (PKCE):
- `signInWithGoogle()` — web navigates to the provider (detectSessionInUrl finishes it); native
  opens an in-app auth session and exchanges the code (`expo-web-browser` + `expo-auth-session`).
- supabase client set to `flowType: 'pkce'`; brand Google "G" icon; calm glass button + "or" divider.
- Verified: typecheck + web/Android bundles green; sign-in renders cleanly (headless screenshot).

**Status (2026-06-23): ✅ Google works on web** — confirmed end-to-end by the user (provider
enabled in Supabase, Google Cloud redirect URI + Supabase redirect URLs set). The web redirect
uses the page origin; PKCE code exchange completes via detectSessionInUrl.

**Native readiness:** added a `sobr://auth-callback` deep-link handler in the root layout
(cold-start/background), so native Google sign-in is wired and will work as soon as you make a
custom **dev build** (it can't run in Expo Go). Not yet tested on device.

<a id="offline"></a>
## Phase 2 · Offline tolerance — ✅ done (2026-06-22)

**Achieved**
- **Persisted query cache** (AsyncStorage via `PersistQueryClientProvider`): reopening the app —
  even offline — shows last-known data instantly; gcTime raised to 7 days.
- **Network-aware** `onlineManager` wired to NetInfo (web + native): offline reads come from
  cache, writes pause and **auto-resume on reconnect** within the session.
- **Optimistic updates** for the core actions (save day, use freeze): the today view, calendar,
  and home stats update instantly; rolled back on error.
- Verified: web boots clean (headless, no pageerrors); typecheck + web/iOS bundles green.

**Note / future enhancement:** replaying writes made offline *after a full app restart* needs
serializable mutation defaults — deferred. In-session offline (e.g. airplane-mode → act →
reconnect) works now.

**What you need to do:** on device, try airplane mode → log a clear day (UI updates instantly) →
turn connectivity back on and confirm it syncs.

<a id="reminders"></a>
## Phase 2 · Daily reminder (local notifications) — ✅ built (2026-06-22)

**Achieved** — a gentle, opt-in daily **local** notification (no servers, nothing leaves the
device). Settings → "Daily reminder": a toggle + time chips (12/6/8/9/10). Permission is
requested on enable; copy is warm and non-triggering ("A moment for sobr — how did today feel?").
`useReminder` persists the preference (AsyncStorage) and (re)schedules a single repeating daily
notification. Native-only — hidden on web (no reliable scheduled web notifications); verified
web Settings still renders cleanly. typecheck + web/iOS bundles green.

**What you need to do:** on your phone, toggle the reminder on (grant the permission prompt) and
confirm the notification fires at the chosen time. (Remote push + smart "log before midnight"
timing can come later.)

<a id="m8-levelup"></a>
## M8 · Tree level-up celebration — ✅ done (2026-06-22)

**Achieved** — the engaging payoff: when lifetime clear days cross a growth threshold,
a calm full-screen moment shows the grown tree (with its amber glow), "Your tree grew →
<stage>", a gentle blurb, and a success haptic. `useGrowthCelebration` persists the last
celebrated stage (AsyncStorage) and gates on real data so it never fires on a loading flash
or re-fires on relaunch. **Verified via headless screenshot** (forced state) — renders
beautifully, no errors. This completes the M8 micro-interactions. typecheck + bundles green.

<a id="ui-modern"></a>
## UI · Modern styling (gradients + glass) — ✅ done (2026-06-22)

**Decision:** skipped `@expo/ui` — it's native-only (no web), alpha, and needs a dev build,
which breaks our single web+native codebase. Modernized with cross-platform styling instead.

**Achieved**
- Subtle **background gradient** on every screen (calm vignette depth) via `expo-linear-gradient`.
- **Glass cards:** translucent fill + top-light sheen + soft (non-harsh) shadow; hairline white
  border that callers can still override (border-win etc.).
- Soft amber **Glow** (SVG radial) behind the home tree for warmth/focus.
- Added `expo-linear-gradient` + `expo-blur` (both web-compatible).
- **Verified visually** via headless Chrome screenshots: sign-in and Home both render cleanly,
  no pageerrors; the glass card + glow look modern and on-brand. typecheck + web & iOS bundles green.
- **Visual QA pass** (2026-06-22): screenshotted Calendar, Progress, Settings under the new
  styling — all cohesive and readable (glass cards, ≥44px chips, amber "today" ring); no fixes needed.

<a id="m8-a11y"></a>
## M8 · A11y + copy pass — ✅ done (2026-06-22)

**Achieved**
- **Copy:** audited all UI strings — no judgmental ("failure"/"relapse") or triggering
  ("alcohol"/"consume") language; tone is consistently warm. "Slip", never "failure".
- **Contrast:** verified the dark palette clears WCAG AA (even the faintest text, #7C8E80 on the
  bg, is ~5:1).
- **Tap targets (≥44px):** enlarged the logger quantity steppers (36→44), preset chips, the
  "add custom" link, and the Settings win-mode rows + currency chips; added `radio` roles/labels.
- Verified: typecheck + web & iOS bundles green.

<a id="m8-states"></a>
## M8 · Error / empty / loading states — ✅ done (2026-06-22)

**Achieved** — failures and first-run now read calmly instead of blanking or showing silent zeros:
- Reusable `Notice` (info/error, optional "Try again") and `EmptyState` components.
- `useHomeStats` exposes `isError` + `refetch`; **Home** shows a gentle retry card on load failure.
- **Calendar** shows a retry notice if its data fails; **Progress** shows a retry notice and a
  friendly first-run empty state.
- Verified: typecheck + web bundle green.

<a id="dark-mode-crash"></a>
## Bugfix · Post-splash crash (web blank + mobile 500) — ✅ done (2026-06-22)

**Cause:** the app forces a dark scheme, but NativeWind's default `darkMode: 'media'` made it
throw `Cannot manually set color scheme` (`StyleSheet.setFlag('darkMode','class')`) — a
cross-platform NativeWind error that blanked web and crashed native. **Fix:** `darkMode: 'class'`
in `tailwind.config.js`. Verified via headless Chrome that sign-in renders with no pageerror;
web + iOS bundles + typecheck green. (Confirmed by user: now reaches onboarding.)

<a id="db-grants"></a>
## Bugfix · 42501 permission denied (table GRANTs) — ✅ done (2026-06-22)

**Cause:** choosing a win condition wrote to `user_settings` and failed with
`42501 permission denied`. RLS controls *which rows*, but the `authenticated` role also needs
table-level GRANTs — the migration never issued them. **Fix:** added `GRANT … TO authenticated`
to `0000_init.sql` and a standalone `0001_grants.sql` for existing databases.

**What you need to do:** run `packages/db/migrations/0001_grants.sql` in your Supabase SQL editor
(snippet also pasted in chat). Then retry choosing a win condition.

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
