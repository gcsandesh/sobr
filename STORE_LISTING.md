# sobr: Google Play listing and forms

Everything Play Console asks for, ready to paste. Keep it in step with
`apps/mobile/src/content/legal.ts`: if the app's data handling changes, the
Data safety answers below change in the same PR.

## Store listing

**App name** (max 30): `sobr: Clear days, counted`

**Short description** (max 80):
`A calm sobriety tracker. Count clear days, grow a streak, drink less.`

**Full description** (max 4000):

> sobr is a calm companion for drinking less, or not at all.
>
> One tap a day is enough. Mark a clear day, or log what you had, and sobr keeps
> the picture honest without judgement. You decide what counts as a win: no
> drinks at all, staying within your own limit, or simply how the day felt.
>
> WATCH IT GROW
> Every clear day in a row grows your tree, from a seed to a full tree and
> beyond. When a streak ends, its tree is planted in your forest, so the work you
> put in is never lost.
>
> GENTLE BY DESIGN
> A slip is a slip, never a failure. Earn freezes that protect your streak
> through a hard day. Milestones celebrate the first day, the first week, the
> first month and more.
>
> SEE YOUR PROGRESS
> Clear days, units and money saved, by week and month. A calendar shows every
> day at a glance, with notes and photos if you want them.
>
> A HAND WHEN IT'S HARD
> Craving something? Steady walks you through a minute of slow breathing. The
> Support screen lists helplines when you need a person.
>
> PRIVATE
> No ads. No analytics. No selling your data. Export everything as a file or a
> full backup any time, take a break without losing anything, or delete your
> account for good.
>
> sobr is not medical advice. If you drink heavily and want to stop, talk to a
> doctor first, as stopping suddenly can be risky.

**Category:** Health & Fitness
**Tags:** Habit tracker, Health, Self-improvement
**Contact email:** contact@<domain> (once the domain exists)
**Website:** https://<project>.vercel.app (later https://<domain>)
**Privacy policy URL:** https://<project>.vercel.app/privacy (later https://<domain>/privacy)

### Graphics (ready: `store/play/`)
- App icon: `icon-512.png`
- Feature graphic: `feature-graphic.png`
- Phone screenshots, in this order: `01-home` (Clear days, counted), `02-calendar`,
  `03-log`, `04-milestones`, `05-forest`, `06-steady`. Sample data only. How to
  regenerate: `store/README.md`.

## App content (Policy → App content)

| Form | Answer |
| --- | --- |
| Privacy policy | URL above |
| App access | **Some features are restricted.** Give reviewers a test account (email + password) with sample data. Create it before submitting, e.g. `review@<domain>`. |
| Ads | No ads |
| Content rating | Questionnaire: references to alcohol = **yes** (the app tracks drinking; it doesn't promote it). No violence, no user-to-user communication, no gambling. The rating follows from the answers; the target audience stays 18+ either way. |
| Target audience | **18 and over** only |
| News app | No |
| Health apps declaration | **Yes**. Pick the closest wellness / habit-tracking category on the form (the list changes; don't pick a medical or treatment one). Not a medical device. |
| Government app | No |
| Financial features | None |
| Data safety | Below |
| Account deletion | URL: https://<project>.vercel.app/delete-account (later https://<domain>/delete-account). In-app path: Settings → Your account → Delete account. |

## Data safety form

**Does the app collect or share user data?** Collects: yes. Shares: **no** (Supabase
and Resend are service providers acting for us, which Play does not count as sharing).

**Is data encrypted in transit?** Yes. **Can users request deletion?** Yes.

| Data type | Collected | Purpose | Optional? |
| --- | --- | --- | --- |
| Personal info → Email address | Yes | Account management, App functionality (sign-in, reminder emails) | Required |
| Personal info → Name | Yes | App functionality (greeting) | Optional |
| Health and fitness → Health info | Yes (drink log, clear/slip days) | App functionality | Required for the core feature |
| Photos and videos → Photos | Yes | App functionality (photos on a day) | Optional |
| Financial info | No (costs are typed by the user as plain numbers; no payment data) | | |
| Other user-generated content | Yes (day notes) | App functionality | Optional |
| App activity, Device IDs, Location, Contacts | No | | |

Processed ephemerally: no. Data is stored in the user's account until they delete it.

## Before the first upload
1. Run the **Android AAB (Play Store)** workflow (DEPLOY.md §5) and download the `.aab`.
2. Create the app in Play Console with package `com.sobr.app`. It can't change later.
3. Enrol in **Play App Signing** (default) and upload the `.aab` to **Closed testing**.
4. Add the 12 testers' Gmail addresses; keep the test running 14 days.
5. Apply for production access with the forms above complete.

## Launch day checklist (account bought ~Nov 1)

Do these in order; the bracketed ones can start before the account exists.

1. **Create the developer account** at play.google.com/console: *personal* account, pay the
   $25, verify your identity (government ID) and your Android phone through the Play
   Console app. Verification can take a few days, so start here.
2. **[before]** Website live on Vercel (DEPLOY.md §6b) so the privacy and deletion URLs work.
3. **[before]** Upload key + four secrets, then run **Actions → Android AAB (Play Store)**
   and download the `.aab` (DEPLOY.md §5).
4. **[before]** A public contact email. Gmail is fine until the domain's contact@ exists;
   set the same address as `LEGAL_CONTACT_EMAIL` in `legal.ts`.
5. **[before]** A reviewer account in the app (email + password) with a couple of weeks of
   sample days, for *App access*.
6. **Create app**: name `sobr: Clear days, counted`, default language English, App, Free.
7. **Store listing**: paste the text above; upload everything in `store/play/`.
8. **App content**: work through every form using the table above (privacy policy, app
   access, ads, content rating, target audience 18+, health apps, data safety, account
   deletion).
9. **Testing → Closed testing**: create a track, upload the `.aab`, add the 12+ testers'
   Gmail addresses (or a Google Group), and send them the opt-in link. Each tester must
   accept and install it.
10. **Wait 14 days** with the testers opted in, then **apply for production access** in
    the dashboard. Google reviews the application (usually a few days).
11. Promote the build to **Production** once approved.
