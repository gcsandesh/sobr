// Builds sobr's public pages (home, privacy, terms, account deletion) into
// site/dist as plain static HTML. The policy text is imported straight from
// the app's legal.ts, so the store-facing pages can never drift from what the
// app shows. Needs Node 22.18+ (it imports a .ts file).
//
//   node site/build.mjs        → site/dist/
//
// Deployed to GitHub Pages by .github/workflows/site.yml. When the domain is
// bought, add site/CNAME with it and update SITE_URL below.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'site', 'dist');
const legal = await import(join(root, 'apps/mobile/src/content/legal.ts'));
const { LEGAL_UPDATED, LEGAL_CONTACT_URL, LEGAL_CONTACT_EMAIL, PRIVACY, TERMS } = legal;

const RELEASES_URL = 'https://github.com/gcsandesh/sobr/releases/latest';

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const css = `
:root{--bg:#F4F9F7;--card:#FFFFFF;--ink:#16211F;--muted:#4A5D59;--faint:#6F8480;--accent:#1F6F6B;--accent-bg:#E2F2EF;--border:#D5E3DE;--flame:#C2410C}
@media (prefers-color-scheme: dark){:root{--bg:#0F1716;--card:#16211F;--ink:#EAF3F0;--muted:#B5C6C2;--faint:#8FA39F;--accent:#5CC2B8;--accent-bg:#183330;--border:#24332F;--flame:#FB923C}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 Figtree,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:720px;margin:0 auto;padding:24px 16px 64px}
header{display:flex;align-items:center;gap:12px;margin-bottom:32px}
header a{display:flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none;font-weight:700;font-size:20px}
header img{width:40px;height:40px;border-radius:10px}
nav{margin-left:auto;display:flex;gap:16px;font-size:15px}
nav a{color:var(--muted);text-decoration:none}
nav a:hover{color:var(--accent)}
@media (max-width:560px){nav{display:none}}
h1{font-family:Fraunces,Georgia,serif;font-weight:900;font-size:clamp(32px,7vw,48px);line-height:1.1;margin:0 0 8px}
h2{font-size:20px;margin:32px 0 8px}
p,li{color:var(--muted)}
a{color:var(--accent)}
.meta{color:var(--faint);font-size:14px;margin-bottom:24px}
.card{background:var(--card);border-radius:16px;padding:20px 24px;box-shadow:0 10px 30px rgba(27,58,53,.07);margin:16px 0}
.hero{text-align:center;padding:24px 0 8px}
.hero img{width:96px;height:96px;border-radius:22px;box-shadow:0 12px 30px rgba(31,111,107,.25)}
.hero p{font-size:19px;max-width:520px;margin:12px auto 24px}
.btn{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:32px}
.grid .card{margin:0}
.grid h3{margin:0 0 4px;font-size:17px}
.grid p{margin:0;font-size:15px}
ol li{margin:6px 0}
footer{margin-top:48px;color:var(--faint);font-size:14px;display:flex;flex-wrap:wrap;gap:16px}
footer a{color:var(--faint)}
`;

function page({ file, title, description, body }) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=Fraunces:opsz,wght@9..144,900&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
<div class="wrap">
<header>
  <a href="./"><img src="icon.svg" alt="">sobr</a>
  <nav><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="delete-account.html">Delete account</a></nav>
</header>
<main>
${body}
</main>
<footer>
  <span>sobr · Clear days, counted.</span>
  <a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="delete-account.html">Delete account</a><a href="${esc(LEGAL_CONTACT_URL)}">Contact</a>
</footer>
</div>
</body>
</html>
`;
  writeFileSync(join(out, file), html);
}

const sections = (list) =>
  list
    .map(
      (s) =>
        `<h2>${esc(s.heading)}</h2>\n${s.body.map((p) => `<p>${esc(p)}</p>`).join('\n')}`,
    )
    .join('\n');

mkdirSync(out, { recursive: true });
copyFileSync(join(root, 'apps/mobile/assets/brand/icon.svg'), join(out, 'icon.svg'));
writeFileSync(join(out, '.nojekyll'), '');

page({
  file: 'index.html',
  title: 'sobr · Clear days, counted',
  description:
    'A calm companion for drinking less or not at all. Count clear days, grow a tree with your streak, and keep your data private.',
  body: `
<section class="hero">
  <img src="icon.svg" alt="sobr app icon">
  <h1>Clear days, counted.</h1>
  <p>A calm companion for drinking less, or not at all. One tap a day, a streak that grows into a tree, and no judgement on the days that slip.</p>
  <a class="btn" href="${RELEASES_URL}">Get the Android app</a>
</section>
<div class="grid">
  <div class="card"><h3>One tap a day</h3><p>Mark a clear day in a second, or log what you had. Your rule decides what counts as a win.</p></div>
  <div class="card"><h3>Watch it grow</h3><p>Your streak grows a tree. Finished streaks are planted in your forest.</p></div>
  <div class="card"><h3>Gentle by design</h3><p>A slip is a slip, never a failure. Freezes protect a streak through a hard day.</p></div>
  <div class="card"><h3>Private</h3><p>No ads, no analytics, no selling data. Export it or delete it any time.</p></div>
</div>`,
});

page({
  file: 'privacy.html',
  title: 'Privacy policy · sobr',
  description: 'How sobr stores and protects what you log.',
  body: `<h1>Privacy policy</h1>\n<div class="meta">Last updated ${esc(LEGAL_UPDATED)}</div>\n${sections(PRIVACY)}`,
});

page({
  file: 'terms.html',
  title: 'Terms of use · sobr',
  description: 'The terms for using sobr.',
  body: `<h1>Terms of use</h1>\n<div class="meta">Last updated ${esc(LEGAL_UPDATED)}</div>\n${sections(TERMS)}`,
});

// Google Play requires a web page where people can ask for their account and
// data to be deleted, even if the app is no longer installed.
page({
  file: 'delete-account.html',
  title: 'Delete your sobr account',
  description: 'How to delete your sobr account and data.',
  body: `
<h1>Delete your account</h1>
<div class="meta">sobr · account and data deletion</div>
<div class="card">
<h2 style="margin-top:0">In the app (quickest)</h2>
<ol>
  <li>Open sobr and sign in.</li>
  <li>Go to <strong>Settings → Your account</strong>.</li>
  <li>Tap <strong>Delete account</strong>, optionally download a backup, then type DELETE to confirm.</li>
</ol>
</div>
<div class="card">
<h2 style="margin-top:0">Without the app</h2>
${
  LEGAL_CONTACT_EMAIL
    ? `<p>Email <a href="mailto:${esc(LEGAL_CONTACT_EMAIL)}?subject=Delete%20my%20sobr%20account">${esc(LEGAL_CONTACT_EMAIL)}</a> from the address your account uses, with the subject "Delete my sobr account". Requests are handled within 7 days.</p>`
    : `<p>Send a deletion request through the <a href="${esc(LEGAL_CONTACT_URL)}">contact page</a> and say that you want your account deleted. Please don't post your email address publicly; we'll reply so you can confirm the request from the address your account uses. Requests are handled within 7 days.</p>`
}
</div>
<h2>What gets deleted, and when</h2>
<p><strong>Right away:</strong> every photo you attached to a day.</p>
<p><strong>After 30 days:</strong> your account, email address, display name, settings, and every logged day, drink and note are permanently erased. Signing in during those 30 days lets you cancel and restore everything.</p>
<p><strong>What we keep:</strong> nothing. No copy of your data is retained after the 30 days.</p>
<p>If you only want a pause, use <strong>Take a break</strong> in the same screen instead: reminders and emails stop and nothing is deleted.</p>`,
});

console.log('site built →', out);
