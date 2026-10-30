# sobr: Launch plan (domain, email, Play Store)

Saved 2026-10-28 from the planning chat, so it's easy to come back to.
Status checkboxes are for the owner; the engineering side is tracked in TODO.md.

## 0. Before anything else
- [ ] Run `packages/db/migrations/0007_account_lifecycle.sql` in Supabase → SQL Editor.
      The two warnings (destructive operations, tables without RLS) are expected: it creates
      no new tables. Until it's run, *Take a break* and *Delete account* show an error.

## 1. Domain
Check which of these are free:
- **sobr.app**: best fit for an app (~$14/yr)
- **sobr.me**: works well
- **getsobr.com** / **sobrapp.com**: safe .com options
- **sobr.day** / **clearday.app**: on-brand alternatives

**Where to buy:** **Cloudflare Registrar** (sells at cost, no markup; free DNS; free *Email
Routing* that forwards `contact@yourdomain` to Gmail). **Porkbun** is a good, cheap
alternative. Skip GoDaddy (constant upsells). Needs an international card (e.g. a Nepal dollar
card).

- [ ] Buy the domain (optional for the Play launch: Gmail works as the contact email and
      Vercel's `*.vercel.app` URL works for the privacy/deletion links). No cPanel or
      hosting is needed: Vercel hosts the site, Cloudflare Email Routing handles contact@.

## 2. Official email
Use **contact@** (for users and Google) and **no-reply@** (for app emails).
- **Receiving (contact@):** Cloudflare Email Routing → forwards to Gmail, free.
- **Sending app emails** (password reset, reminders) from no-reply@: **Resend free plan**
  (~3,000 emails/month, 100/day; check their pricing page for current limits) after
  verifying the domain in Resend.
- **A real inbox for contact@ (optional):** Zoho Mail free plan (one domain), or Google
  Workspace (~$7/month).
- Nodemailer is a library, not a sending service; it isn't needed. Supabase sends auth
  emails itself once it has SMTP details.

- [ ] Set up Email Routing for contact@
- [ ] Verify the domain in Resend; set Supabase custom SMTP (DEPLOY.md §1)

## 3. Play Store
- **$25, once**, by card when creating the developer account. Choose a **personal** account
  (organization accounts need a D-U-N-S number).
- Google verifies identity with a government ID.
- New personal accounts must run a **closed test with 12+ testers for 14 days** before going
  public. Line up 12 friends.
- Staying on **Supabase free** is fine for launch; move to Pro ($25/month, daily backups) when
  scaling up.

- [ ] Create the Play developer account
- [ ] Line up 12 testers

## 4. Engineering (next session)
1. Domain → set up the public pages and email on it.
2. ~~Signed Play Store builds~~: done, `android-aab.yml` (DEPLOY.md §5). Owner makes the
   upload keystore and adds four secrets.
3. ~~Website: marketing page + privacy, terms, account deletion~~: done, on Vercel
   (DEPLOY.md §6b). Owner imports the repo into Vercel once; the domain attaches there.
4. Custom SMTP (Resend), then turn email confirmation back on.
5. ~~Store listing text~~: done, STORE_LISTING.md. Screenshots still to take from a real
   account.

**From the owner:** run 0007, buy the domain, create the Play developer account.
