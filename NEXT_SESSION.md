# sobr: pick up where we left off (2026-10-30)

Paste the prompt at the bottom into a new Claude Code session on `gcsandesh/sobr`.
This file is the "where are we right now"; **HANDOVER.md** is the deep project context
(stack, data model, 26 gotchas, conventions) and should be read first.

## State of the code

- **main** has everything up to PR #11: Android fixes (centred tab bar, `PressableStyled`),
  iOS parity + CI iOS build, drinks UI, Play assets, mood on check-in, version **1.0.0**.
- **PR #12 merged** (2026-10-30):
  - the owner's logo, redrawn as a vector: sapling with two leaves on a hill, inside a
    circle, dark green on cream; every icon variant, `Logo.tsx`, Play icon + feature graphic
  - **Bricolage Grotesque** replaces Fraunces for headings and numbers (app, site, store
    templates); body stays Figtree
- Play graphics in `store/play/` are current (new logo + font, re-captured 2026-10-30).

## Releases

- Every push to `main` builds an APK and publishes a GitHub Release
  (https://github.com/gcsandesh/sobr/releases). Branch pushes publish prereleases.
- `ios-build.yml` compiles an unsigned iOS Simulator build on app changes (green).
- `android-aab.yml` (manual) builds the signed Play bundle once the upload-key secrets exist.

## Owner status (Sandesh)

Done: Supabase migrations **0000 to 0008 all applied** (0007 + 0008 on 2026-10-30; the
`schedule 3` result is the daily purge job). Vercel project connected (`sobr` under
gcsandeshs-projects); previews build; production should be live from main.

To do before / on the Play launch (~Nov 1, $25 personal account):
1. Confirm the Vercel production URL; put it in STORE_LISTING.md (privacy + deletion URLs).
2. Create the upload keystore + 4 GitHub secrets (DEPLOY.md §5), then run
   *Actions → Android AAB (Play Store)* once, and fix it if the first run fails.
3. Pick the public contact email (Gmail is fine) and set `LEGAL_CONTACT_EMAIL` in
   `apps/mobile/src/content/legal.ts` (the site's delete page uses it).
4. Make a reviewer account with a couple of weeks of sample days (Play "App access").
5. 12 testers' Gmail addresses for the 14-day closed test.
6. Follow the "Launch day checklist" at the end of STORE_LISTING.md.
Domain is optional for launch (LAUNCH.md).

## Working notes for the next agent

- The owner wants decisions made autonomously, PRs created **and merged** once CI is green,
  short plain replies, and **no em dashes**.
- Verify UI in web screenshots with demo data:
  `cd apps/mobile && EXPO_OFFLINE=1 EXPO_PUBLIC_SKIP_AUTH=1 EXPO_PUBLIC_DEMO_DATA=1 EXPO_PUBLIC_SUPABASE_URL=https://example.supabase.co EXPO_PUBLIC_SUPABASE_ANON_KEY=x pnpm exec expo start --web --offline`
  then Playwright (Chromium is preinstalled in cloud sessions). Web hides Android-only bugs:
  never use `style={({ pressed }) => …}` on a Pressable (HANDOVER gotcha 25).
- Never `pkill -f` a pattern that also appears in your own command line (it kills the shell).
- The cloud environment blocks dl.google.com, api.expo.dev, *.supabase.co and vercel.com;
  the owner runs SQL in the Supabase dashboard.
- Brand assets: SVGs in `apps/mobile/assets/brand/` are the source; PNGs were rasterized
  with headless Chromium at the sizes in `app.json`.

## Ideas parked for later

Dark mode; Drink Control in-app importer; promo video (optional for Play); App Store
submission (needs a $99/yr Apple Developer account).

---

**Prompt for the new session:**

> Continue work on sobr (gcsandesh/sobr). Read NEXT_SESSION.md, then HANDOVER.md. First
> check for open PRs and merge any that are green, then help me through the Play Store
> launch checklist. Make decisions yourself,
> open and merge PRs when green, keep replies short, and don't use em dashes.
