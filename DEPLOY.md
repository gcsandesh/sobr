# sobr: Deploy checklist

How a build gets from this repo onto a phone (and later a store), what must be true before
it does, and how to check it worked. Keep this current; it's the list you run every release.

---

## 0. Pipelines at a glance

| Target | How | Where it lands |
| --- | --- | --- |
| **Android APK (sideload)** | `.github/workflows/android-apk.yml` on every push to `main` / `claude/**` touching the app, or *Run workflow* by hand | GitHub **Releases** (tag `android-v<version>-<run>`) + a workflow artifact |
| Android Play Store | `eas build -p android --profile production` then `eas submit` | Play Console |
| iOS | `eas build -p ios` (paid Apple Developer account required) | TestFlight |
| Web | `pnpm --filter @sobr/mobile export:web` → static `dist/` | Any static host (Vercel/Netlify/Cloudflare Pages) |
| Backend | SQL in `packages/db/migrations/`, edge function in `supabase/functions/send-email` | Supabase project `uqozokfjfstsfuelgzcy` |

---

## 1. One-time setup

### GitHub Actions (for the APK)
- [ ] Repo → **Settings → Secrets and variables → Actions → New repository secret**:
  - `EXPO_PUBLIC_SUPABASE_URL` = `https://<project-ref>.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = the project's anon (or `sb_publishable_…`) key
  - Both are public by design (they ship inside the app). **Never** add `DATABASE_URL`,
    `RESEND_API_KEY` or the service-role key here or anywhere in the app.
- [ ] Without the two secrets the workflow still builds, but the APK boots to the *setup*
      screen and no Release is published (you'll see a warning annotation on the run).

### Supabase dashboard
- [ ] Authentication → Providers → Email → **Confirm email OFF** (password sign-up must
      return a session; see HANDOVER → "Auth: email + password").
- [ ] Authentication → Hooks → **Send Email** → the `send-email` function (sends every
      auth code, including password-reset codes, through Resend).
- [ ] All migrations applied, in order: `0000_init` → `0001_grants` → `0002_email` →
      `0003_email_visuals` → `0004_day_photos` → `0005_time_zone_guard`.
      Verify grants: `select table_name, privilege_type from information_schema.role_table_grants where grantee='authenticated' and table_schema='public';`
      (every app table needs SELECT/INSERT/UPDATE/DELETE, or nothing saves).
- [ ] Resend: until a domain is verified, `onboarding@resend.dev` only delivers to the
      Resend account owner's address. Verify a domain and set the `EMAIL_FROM` secret before
      anyone else relies on password reset or reminder emails.

---

## 2. Pre-release checks (every release)

Run locally, all must pass (CI runs the first three too):

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm --filter @sobr/core test`: domain math green
- [ ] `cd apps/mobile && pnpm exec tsc --noEmit`: app typechecks
- [ ] `cd apps/mobile && pnpm exec expo export --platform android`: JS bundle builds
- [ ] `pnpm dlx expo-doctor` (needs network): config sane

Product checks:

- [ ] `EXPO_PUBLIC_SKIP_AUTH` is not `1` in any build env (it is also `__DEV__`-gated, so a
      release build ignores it, but don't rely on one guard).
- [ ] Bump `expo.version` in `apps/mobile/app.json` for user-visible releases. (CI sets
      `android.versionCode` from the run number automatically.)
- [ ] Support screen numbers still correct (`apps/mobile/app/support.tsx`): Nepal
      ambulance 102, national helpline 1166, plus findahelpline.com.
- [ ] Privacy policy (`apps/mobile/src/content/legal.ts`) still matches reality: any new
      processor, SDK, or data field means the policy changes in the same PR, and
      `LEGAL_UPDATED` moves.
- [ ] Copy pass on anything new: "slip", never "failure/relapse"; no drinking-centric
      chrome (PROJECT.md → Principles).

---

## 3. Ship the Android APK

1. Push to `main` (or a `claude/**` branch), or open **Actions → Android APK → Run workflow**.
2. Wait for both jobs (`Tests + typecheck`, then `Release APK`, ~15–25 min cold, faster
   with the Gradle cache).
3. Open **Releases** on the phone → newest `sobr … (build N)` → tap the `.apk`.
4. First install only: allow **Install unknown apps** for the browser when Android asks.
5. Later builds install over the top (same signature, higher versionCode). Data lives in
   the account, so even an uninstall/reinstall loses nothing but local notification
   settings.

**Signing note.** The CI APK is signed with the React Native template's debug keystore.
That's fine for personal sideloading and keeps updates installable, but it is *not* a
private key: never upload that APK to a store. Play Store builds go through EAS (below),
which manages a real upload key.

---

## 4. Post-install smoke test (5 minutes, on the phone)

- [ ] App opens to **Sign in** (not the setup screen → secrets missing).
- [ ] Create account / sign in → onboarding (name optional) → pick a win rule → Home.
- [ ] Tap **It was a clear day** → streak 1, calendar shows the day green.
- [ ] Open the day → write a Reflection → Save → note appears on Home and in History.
- [ ] Quick-add (+) a drink to today → the note is still there (regression check).
- [ ] Settings → Currency / Time zone sheets change and persist after restart.
- [ ] Settings → Notifications → enable Daily check-in → Android permission prompt appears.
- [ ] Day screen → add a photo → it shows, and a dot appears on the calendar.
- [ ] Account → change name → Home greeting updates.
- [ ] Sign out → Forgot password → code arrives (see Resend note) → new password works.
- [ ] Support → tapping a number opens the dialer.

---

## 5. Play Store (when ready)

- [ ] Google Play developer account ($25 one-time).
- [ ] `cd apps/mobile && eas init` (links the project), then set env on EAS:
      `eas env:create --name EXPO_PUBLIC_SUPABASE_URL …` and `…_ANON_KEY …` (plaintext is
      correct; see HANDOVER → "Building with EAS").
- [ ] `eas build -p android --profile production` (AAB, EAS-managed upload key).
- [ ] Play Console: app content → **Health** declarations, data safety form (matches
      `legal.ts`), target audience **18+**, privacy policy URL (host the policy on the web
      build or a static page first).
- [ ] Internal testing track → closed testing → production.
- [ ] Before store submission: Sign in with Apple is required on iOS if Google sign-in is
      re-enabled (TODO → Future enhancements).

---

## 6. Web

- [ ] `cd apps/mobile && EXPO_PUBLIC_SUPABASE_URL=… EXPO_PUBLIC_SUPABASE_ANON_KEY=… pnpm exec expo export --platform web`
- [ ] Deploy `apps/mobile/dist/` as a single-page app (all routes → `index.html`).
- [ ] Add the site origin to Supabase → Authentication → URL Configuration → Redirect URLs.

---

## 7. Rollback

- **APK:** older builds stay on the Releases page; installing an older versionCode over a
  newer one needs an uninstall first (data is safe in the account).
- **Database:** migrations are forward-only. Write a compensating migration rather than
  editing an applied one; take a backup (Supabase → Database → Backups) before any
  destructive change.
- **Edge function:** redeploy the previous commit's `supabase/functions/send-email`.
