# sobr: Engineering Handover

> **Read this first.** It is the single entry point for any agent or developer picking up the
> project: current status, how it's built, the decisions behind it, the gotchas that have
> already bitten, how to verify work, and where to continue.
>
> Companion docs:
> [PROJECT.md](./PROJECT.md) (product + principles) ·
> [PLAN.md](./PLAN.md) (original architecture plan) ·
> [TODO.md](./TODO.md) (task list, kept current) ·
> [PROGRESS.md](./PROGRESS.md) (chronological log, newest first, with "what the user must do") ·
> [DEPLOY.md](./DEPLOY.md) (release checklist + phone smoke test).
> Change history: `git log` (one commit per feature, with the why in the body).

Last updated: **2026-09-26** (Phase 5b).

---

## 1. TL;DR: where things stand

**sobr ("clear days, counted")** is a calm, private alcohol-moderation habit tracker: one
**Expo Router app for Android + iOS + web**, backed by **Supabase**. It is **screen-complete
and in daily use on the owner's Android phone** (installed from a GitHub Release APK).

- **Health:** `@sobr/core` **80/80** tests pass; the app typechecks with and without Expo's
  generated typed routes; the Android JS bundle exports clean; CI builds a release APK.
- **Users:** one (the owner). Sign-up is open; email confirmation is off.
- **Active branch:** `claude/awesome-bohr-aos87s` (not merged to `main` yet; open a PR when
  the owner asks). Every push touching the app builds an APK on GitHub Actions.
- **Latest APK:** build 7, https://github.com/gcsandesh/sobr/releases (tags `android-v<version>-<run>`).
- **Not yet verified on a device:** the Phase 5 screens were verified by typecheck, bundling
  and web screenshots only. The owner is running the phone smoke test (DEPLOY.md §4).

### What the app does, screen by screen

| Route | Screen |
| --- | --- |
| `(auth)/sign-in` | Email + password sign-in / sign-up toggle, field errors, "Forgot password?" |
| `(auth)/forgot-password` | Code-based reset: email → code + new password |
| `(onboarding)/welcome → how-it-works → win-condition` | Optional name, how it works, pick win rule (limit stepper) |
| `(tabs)/index` Home | Greeting, forest hero (tree + streak), stat pills, pledge/evening check-in, Steady link, month calendar, selected-day panel (status, units, note), FAB quick-add sheet |
| `(tabs)/progress` | 14-day bars, month + all-time stats, History link, milestones |
| `(tabs)/profile` | Avatar (tap → Account), numbers, growth journey, freezes explainer, History link |
| `(tabs)/settings` | Account row; Your rules (win rule, currency, time zone as picker sheets); notifications; email toggles; Your data (CSV export); Help & info |
| `day/[date]` | Status banner, logged items with steppers + cost, preset chips, custom item, **Reflection** note, photos |
| `account` | Display name, change password, sign out, delete account |
| `history` | Every day newest-first, grouped by month, filters, notes inline |
| `support` | Helplines (tap to call), findahelpline.com, peer groups, stopping-safely note |
| `legal/privacy`, `legal/terms` | Text from `src/content/legal.ts` |
| `steady` | Guided breathing for cravings (modal) |
| `about`, `setup`, `+not-found` | Info, "configure env" screen, 404 |

---

## 2. Product in one paragraph + principles

Each day the user taps **"It was a clear day"** (one-tap win) or **logs what they had**. A win
extends the **streak** and lifetime **clear days**, which grow a **tree** (seed → sprout →
sapling → young tree → full tree → grove at 0/3/7/14/30/60 clear days). Every 7-day streak
earns a **freeze** (max 3 banked); a freeze can protect the streak on a slip day. The win rule
is per user: **zero** (anything logged = slip), **limit** (≤ N units = win), or **manual**.
Units use the UK formula `volume_ml × abv% / 1000 × quantity`.

**Non-negotiable principles** (PROJECT.md has the full text):
- **Calm, never punitive.** A bad day is a *slip*, never "failure"/"relapse". Slip color is
  muted brick, never alarm red.
- **Non-triggering language.** App chrome talks about clear days, wins, growth, reflection.
  Don't name specific drinks in hints or chrome outside the logger itself.
- **Privacy first.** Per-user RLS on every table; no analytics or third-party SDKs that can see
  logged content; account deletion purges everything.
- **Correct math.** Streak / units / freeze / date logic lives in `@sobr/core` with tests.
  Change it only with tests.
- **Never overwrite what you haven't loaded.** A save replaces a day's whole drink list, so any
  write path must start from a *successfully loaded* day (see gotcha 11).

---

## 3. Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Monorepo | pnpm 9 workspaces (`node-linker=hoisted`) + Turborepo | Node 20 (`.nvmrc`) |
| App | **Expo SDK 54**, Expo Router 6, React 19.1, RN 0.81, New Architecture | one codebase for Android/iOS/web |
| Styling | NativeWind 4.2.x (`darkMode: 'class'`, never applied) + tokens in `@sobr/config` | palette mirrored in `tailwind.config.js` |
| Type | Fraunces 900 (display), Figtree (UI) via `@expo-google-fonts` | |
| Data | TanStack Query 5 + AsyncStorage persistence | optimistic writes for days, freezes, settings |
| Backend | **Supabase**: Postgres + Auth + RLS + Storage (`day-photos`) + pg_cron/pg_net email jobs | project ref `uqozokfjfstsfuelgzcy` |
| Validation | Zod (in `@sobr/core`) | |
| Visuals | react-native-svg (tree, charts, icons), reanimated 4 + worklets | |
| Keyboard | **react-native-keyboard-controller 1.18.5** | required on edge-to-edge Android (gotcha 12) |
| Files | expo-file-system (new `File`/`Paths` API), expo-sharing | CSV export |
| Notifications | expo-notifications, local only | daily check-in + 7 weekly motivation triggers |
| Auth | **email + password** (no confirmation); code-based reset | Google wired but hidden; Apple deferred |
| Tests | Vitest on `@sobr/core` | 80 tests |
| CI / release | GitHub Actions → release APK → GitHub Release | EAS profiles exist in `eas.json` for later |

**Rejected / deferred:** separate Next.js web app (not needed), `@expo/ui` (native-only),
dark mode (see §9), moods (needs a migration).

---

## 4. Repository layout

```
apps/mobile/
  app/                 routes (table in §1); _layout.tsx = providers, Gate, ErrorBoundary
  src/components/      ui.tsx (kit: Txt, Screen, Card, Button, TextField, OptionList,
                       ToggleRow, ListRow, RowValue, Chip, Avatar, Notice, EmptyState…),
                       BottomSheet, LimitStepper, LegalDoc, Tree, MonthCalendar, DayPhotos,
                       icons, celebrations
  src/data/            SessionProvider (session, displayName, greetingName), hooks.ts
                       (queries + optimistic mutations), api.ts (Supabase I/O), useRefresh,
                       useNotificationPrefs (+ resyncNotificationSchedule), pledge/celebrations
  src/lib/             supabase, account (name/password/reset), notifications, exportData,
                       dates (formatDay/formatMonth), errorMessage (+ authErrorMessage),
                       haptics, env, confirm, queryClient
  src/content/legal.ts privacy + terms text
  assets/brand/        logo/icon/splash + adaptive-{foreground,background,monochrome}
                       + notification-icon (SVG sources next to PNGs)
  app.json / app.config.js   app.config.js loads ROOT .env into `extra`; CI sets versionCode
packages/core/         @sobr/core: schemas + pure logic (units, win, streak, freeze, growth,
                       milestones, aggregates, dates, CSV export) + tests
packages/config/       @sobr/config: tokens, drink presets (incl. Nepal-local), currencies, growth meta
packages/db/           migrations 0000–0005, email/ templates (auth-code.html, reset-password.html),
                       seed + apply scripts
supabase/functions/send-email   Send Email auth hook via Resend (optional; not wired yet)
.github/workflows/android-apk.yml   tests + typecheck → release APK → GitHub Release
```

Dependency direction: `apps/mobile` → `@sobr/{core,config}`. Packages never import the app.
Shared packages use **extensionless** relative imports (gotcha 4).

---

## 5. Data model

All tables in `public`, **RLS enabled + forced**, granted to `authenticated` (gotcha 3).

- **`user_settings`** (PK `user_id`): `win_mode`, `daily_limit_units`, `currency` (USD
  default), `time_zone`, `onboarded` (drives routing), `email_reminders`, `email_weekly`.
  Auto-created by the `handle_new_user` trigger.
- **`daily_entries`**: `user_id`, `entry_date` (user's local civil date), `status`
  (`win|slip|freeze`), `note` (≤ 500 chars), unique `(user_id, entry_date)`.
- **`drinks`**: line items per entry (cascade delete). Units are **derived, never stored**.
- **`freeze_grants`**: `granted_for_streak` (unique per user), `used_at`, `used_on_entry_id`.
- **`day_photos`** + private storage bucket `day-photos`; object key
  `<user_id>/<entry_id>/<id>.<ext>`; storage policies pin the first segment to `auth.uid()`.
- **`email_log`** (service-only): reminder/weekly email audit + dedupe.
- **Display name** is *not* a column: it's `auth.users.user_metadata.display_name`.

Derived on read in `@sobr/core`: units, streaks, banked freezes, all stats.

Server-side jobs (migration 0002): `pg_cron` runs `app.run_email_jobs()` hourly; `pg_net`
posts to Resend using the Vault secret `resend_api_key` (absent → rows logged as
`skipped_no_key`). Sends from `onboarding@resend.dev`, so only the Resend account owner
receives them until a domain is verified.

Migrations are applied manually (Supabase SQL editor or `packages/db/apply-*.mjs`), in order
0000 → 0005. **This environment has no access to the sobr Supabase project** (the connected
Supabase account only has an unrelated project), so schema changes must be handed to the owner.

---

## 6. Gotchas (read these; each one has bitten)

1. **NativeWind must be ≥ 4.2.x with `darkMode: 'class'`.** 4.1.x crashes under React 19 /
   New Arch; `'media'` throws "Cannot manually set color scheme".
2. **The canonical `.env` is at the repo root**, loaded by `app.config.js`. Restart the dev
   server (`--clear`) after editing it. It is gitignored and exists only on the owner's Mac.
3. **RLS needs table GRANTs.** Symptom: `42501 permission denied` / "nothing saves". Fix:
   `0001_grants.sql`. supabase-js rejects with plain objects, so use `errorMessage()`, never
   `e instanceof Error`.
4. **Extensionless imports in shared packages** (`'./x'`, not `'./x.js'`); Metro can't rewrite them.
5. **"Unable to resolve <dep>"** after adding a dependency = stale Metro map → `--clear`.
6. **Brand PNGs are rasterized from the SVGs** with `@resvg/resvg-js` (install it in a scratch
   dir). Regenerate the PNGs whenever an SVG changes; Expo rejects SVG icons.
7. **Reanimated 4:** don't add the reanimated babel plugin; `babel-preset-expo` handles it.
8. **The Supabase client never throws at import** without env; the Gate shows `/setup`.
9. **Mutation hooks must not throw at render** when signed out; check inside `mutationFn`.
10. **Typed routes differ between local and CI.** `.expo/types` is gitignored, so CI typechecks
    with loose route types (e.g. `useSegments()` is `[string]`). New routes typecheck locally
    only after the dev server regenerates types. To reproduce CI, move `.expo/` and
    `expo-env.d.ts` aside and run `tsc --noEmit`.
11. **A day save replaces the whole drink list.** Any write path (day screen, Home quick-add,
    one-tap win) must only run after that day's query **succeeded** (live or from the
    persisted cache). A failed fetch must block writes and show a notice, or you wipe real
    data. `upsertEntryStatus` only writes `note` when it's passed (`undefined` = keep).
12. **Android is edge-to-edge on SDK 54**, so the window doesn't resize for the keyboard.
    Scrolling screens use `KeyboardAwareScrollView` (via `Screen scroll`), and the root is
    wrapped in `KeyboardProvider`. Avoid text inputs inside `BottomSheet` (a RN `Modal`):
    keyboard avoidance there is unverified, which is why the daily limit is a stepper.
13. **Supabase won't let you edit email templates without custom SMTP.** The default Reset
    Password email only has a link to the Site URL (`localhost:3000`), which is useless on a
    phone. The app's reset is code-based and needs `{{ .Token }}` in that template (DEPLOY.md §1).
    Until SMTP + template are set, reset a password via SQL:
    `update auth.users set encrypted_password = crypt('<pw>', gen_salt('bf')) where email = '<email>';`
14. **This cloud dev environment can't reach** `dl.google.com` (Android SDK), `api.expo.dev`
    (EAS) or `*.supabase.co`. Hence APKs are built on GitHub Actions, and anything touching the
    live DB is handed to the owner.
15. **The Expo CLI needs `--offline` / `EXPO_OFFLINE=1` here**, or it crashes fetching
    dependency versions through the proxy.

---

## 7. Auth

- **Email + password**, `signUp` / `signInWithPassword`, one screen. Needs Supabase →
  Authentication → Providers → Email → **Confirm email OFF** (it is).
- **Password reset** (`src/lib/account.ts`): `resetPasswordForEmail` → user enters the emailed
  code → `verifyOtp({ type: 'recovery' })` → `updateUser({ password })`. The Gate
  (`app/_layout.tsx`) leaves `(auth)/forgot-password` alone while the recovery session exists;
  leaving the screen without finishing signs that session out. The code field accepts
  6–10 digits.
- **Change password / display name:** `updateUser` from the Account screen.
- **Google:** `signInWithGoogle` in `src/lib/auth.ts` works on web, but the button was removed
  from sign-in. Re-add only once native OAuth can be tested. **Apple:** deferred to store time.
- **Dev bypass:** `EXPO_PUBLIC_SKIP_AUTH=1` (and `__DEV__`) jumps to the tabs with no session.
  Reads render empty; writes fail by design.

---

## 8. Build, run, release

```bash
corepack enable pnpm && pnpm install
pnpm web                      # web dev server (http://localhost:8081)
pnpm app                      # Expo dev server for a device (Expo Go lacks notifications on Android)
pnpm test:core                # 80 domain-logic tests
```

**Android release APK (how the owner installs):** push to `main` or `claude/**` (paths:
`apps/mobile/**`, `packages/**`, lockfile, workflow), or run *Actions → Android APK → Run
workflow*. About 12 minutes. The job:
1. runs core tests and typechecks,
2. runs `expo prebuild` + `gradlew assembleRelease` (arm64-v8a + armeabi-v7a),
3. sets `versionCode` = run number (so each build installs over the last),
4. publishes the APK as a GitHub Release, but only if the repo secrets
   `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set (they are).

It is signed with the RN template's debug keystore: fine for sideloading, never for a
store. Docs-only pushes don't trigger a build. `cancel-in-progress` means a new push cancels
a running build on the same branch. Full release checklist: **DEPLOY.md**.

To check an APK's baked config without a phone:
`unzip -p sobr-*.apk assets/app.config | jq .extra`.

---

## 9. Verification workflow (no device, no live DB here)

1. `pnpm --filter @sobr/core test` (add tests for any logic change).
2. `cd apps/mobile && pnpm exec tsc --noEmit`, and the CI variant (gotcha 10).
3. `cd apps/mobile && EXPO_OFFLINE=1 pnpm exec expo export --platform android` catches bundling
   and resolution errors, including new native deps.
4. **Visual (web):** start `EXPO_OFFLINE=1 EXPO_PUBLIC_SKIP_AUTH=1 EXPO_PUBLIC_SUPABASE_URL=https://example.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=x pnpm exec expo start --web --offline`, then screenshot with
   `playwright-core` and Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
   (390×844 @2x for phone, 1280 wide for desktop). Screens render with empty data under the bypass.
5. Push → watch the Actions run → confirm the Release asset.
6. Run `/code-review` and `/security-review` on meaningful batches (both were run for Phase 5).

**Deliberately deferred:**
- **Dark mode.** Many screens use static `colors.*` from `src/theme` in inline styles and
  SVGs. Doing it properly means CSS-variable tokens + a `useColors()` hook across the app,
  plus device testing.
- **Mood on check-in.** Needs a column + migration the owner must apply.

---

## 10. Conventions / working agreement

- **One commit per feature**, with the why in the body. End commit messages with the
  Co-Authored-By / session trailers your harness specifies. Push to the working branch; open
  a PR only when asked.
- **Pause at stable checkpoints** (tests + typecheck green, committed).
- **End every task** by telling the owner (1) what was achieved and (2) what *they* must do;
  record it in PROGRESS.md (newest first, with an anchor) and check it off in TODO.md.
- **Copy:** non-judgmental, non-triggering; the owner prefers no em dashes in chat replies.
- **Aesthetic:** calm light mist + deep teal; one bold surface (the Home hero); Fraunces
  numerals; soft cards; no casino gamification.

---

## 11. Where to continue

Owner actions outstanding (TODO.md has the live list):
1. Custom SMTP + paste `packages/db/email/reset-password.html` into the Reset Password template.
2. Phone smoke test (DEPLOY.md §4) and report anything broken.
3. Later: verify a Resend domain before any other users; Play Store via EAS (DEPLOY.md §5).

Engineering candidates, roughly by value:
- Fix whatever the owner's smoke test turns up (top priority).
- Merge `claude/awesome-bohr-aos87s` → `main` via PR once the owner approves.
- Dark mode (see §9).
- Mood on check-in + a "how you felt" trend (needs migration `0006_*`).
- Re-add Google sign-in (needs native OAuth testing) and Apple sign-in for iOS.
- Wire the `send-email` hook for branded auth mail once a Resend domain exists.

---

## 12. Kickoff prompt for the next agent

> You're continuing work on **sobr**, an Expo (Android + iOS + web) habit tracker backed by
> Supabase, repo `gcsandesh/sobr`, working branch `claude/awesome-bohr-aos87s`. Before doing
> anything, read `HANDOVER.md` in full, then `PROJECT.md`, `TODO.md`, the top two entries of
> `PROGRESS.md`, and `DEPLOY.md`. Skim `git log -20`.
>
> Confirm the baseline: `pnpm install`, `pnpm --filter @sobr/core test` (expect 80 passing),
> `cd apps/mobile && pnpm exec tsc --noEmit`. Heed HANDOVER §6, especially 10–15: typed
> routes differ in CI, never write a day that hasn't loaded, keyboard handling on edge-to-edge
> Android, SMTP-gated email templates, and no network access to the Android SDK, EAS or
> Supabase from the cloud environment. The owner installs APKs from GitHub Releases built by
> `.github/workflows/android-apk.yml`.
>
> Keep copy calm and non-triggering, commit per feature, update PROGRESS.md and TODO.md, and
> end by telling the owner what changed and what they need to do.

---

## Appendix A: Building with EAS (for store builds)

`apps/mobile/eas.json` has `development`, `preview` (APK) and `production` (AAB) profiles.
`app.config.js` reads the **root `.env`**, which EAS servers never receive, so set the
public vars on EAS once:

```bash
cd apps/mobile
eas env:create --name EXPO_PUBLIC_SUPABASE_URL      --value "<url>" --visibility plaintext --scope project
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<key>" --visibility plaintext --scope project
```

Plaintext is correct: both ship in the bundle and RLS protects the data. Never add
`DATABASE_URL`, `RESEND_API_KEY` or the service-role key. iOS device builds need a paid Apple
Developer account.

## Appendix B: Why email + password (not OTP sign-in)

Supabase's built-in mailer only delivers to pre-authorized addresses, and lifting that needs a
verified domain plus custom SMTP, so OTP sign-in could not complete on a device. Password auth
sends no mail. With **Confirm email OFF**, sign-up returns a session immediately; the sign-in
screen detects the "user but no session" case and explains it.

## Appendix C: The missing-GRANTs bug

`authenticated` once held only TRUNCATE/REFERENCES/TRIGGER on the app tables, and Postgres
checks GRANTs before RLS, so every read and write failed ("Plant my tree does nothing"). Check
with:
`select table_name, privilege_type from information_schema.role_table_grants where grantee='authenticated' and table_schema='public';`

## Appendix D: Auth email templates

- `packages/db/email/reset-password.html`: for the **Reset Password** slot. Code only
  (`{{ .Token }}`), no link.
- `packages/db/email/auth-code.html`: a general template for the other slots (code first,
  `{{ .ConfirmationURL }}` as a secondary button).
- House rules: no `<img>`, tables not flex/grid, inline styles only.
- All of this requires custom SMTP to be enabled first (gotcha 13).
