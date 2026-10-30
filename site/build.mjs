// Builds sobr's website into site/dist: the marketing page (site/src) plus
// privacy, terms and account-deletion pages. The policy text is imported
// straight from the app's legal.ts, so the store-facing pages can never drift
// from what the app shows.
//
//   node site/build.mjs        → site/dist/   (Node 22.18+; it imports a .ts file)
//
// Deployed by Vercel (see vercel.json; one project serves all of it). Links
// use clean URLs (/privacy), which vercel.json's cleanUrls maps to the .html
// files. To preview locally with working links: npx serve site/dist
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(`site/build.mjs needs Node 22.18+ (found ${process.versions.node}).`);
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'site', 'src');
const out = join(root, 'site', 'dist');
const { LEGAL_UPDATED, LEGAL_CONTACT_URL, LEGAL_CONTACT_EMAIL, PRIVACY, TERMS } = await import(
  join(root, 'apps/mobile/src/content/legal.ts')
);

// Where "Download" goes. Swap for the Play Store link once the app is live.
const DOWNLOAD_URL = 'https://github.com/gcsandesh/sobr/releases/latest';

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const contactHref = LEGAL_CONTACT_EMAIL ? `mailto:${LEGAL_CONTACT_EMAIL}` : LEGAL_CONTACT_URL;

const footer = `<footer class="footer">
  <div class="container">
    <a class="brand" href="/"><img src="icon.svg" alt="">sobr</a>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/delete-account">Delete account</a>
    <a href="${esc(contactHref)}">Contact</a>
    <span>Not medical advice. If you're in crisis, contact local emergency services.</span>
  </div>
</footer>`;

const fill = (html) =>
  html.replaceAll('{{DOWNLOAD_URL}}', DOWNLOAD_URL).replaceAll('{{FOOTER}}', footer);

function legalPage({ file, title, description, body }) {
  writeFileSync(
    join(out, file),
    fill(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<header class="topbar">
  <div class="container">
    <a class="brand" href="/"><img src="icon.svg" alt="">sobr</a>
    <nav aria-label="Main"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/delete-account">Delete account</a></nav>
    <a class="btn btn-primary btn-sm" href="{{DOWNLOAD_URL}}">Get the app</a>
  </div>
</header>
<main class="doc">
${body}
</main>
{{FOOTER}}
</body>
</html>
`),
  );
}

const sections = (list) =>
  list
    .map((s) => `<h2>${esc(s.heading)}</h2>\n${s.body.map((p) => `<p>${esc(p)}</p>`).join('\n')}`)
    .join('\n');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of readdirSync(src)) {
  if (f.endsWith('.html')) writeFileSync(join(out, f), fill(readFileSync(join(src, f), 'utf8')));
  else copyFileSync(join(src, f), join(out, f));
}
copyFileSync(join(root, 'apps/mobile/assets/brand/icon.svg'), join(out, 'icon.svg'));

legalPage({
  file: 'privacy.html',
  title: 'Privacy policy · sobr',
  description: 'How sobr stores and protects what you log.',
  body: `<h1>Privacy policy</h1>\n<div class="meta">Last updated ${esc(LEGAL_UPDATED)}</div>\n${sections(PRIVACY)}`,
});

legalPage({
  file: 'terms.html',
  title: 'Terms of use · sobr',
  description: 'The terms for using sobr.',
  body: `<h1>Terms of use</h1>\n<div class="meta">Last updated ${esc(LEGAL_UPDATED)}</div>\n${sections(TERMS)}`,
});

// Google Play requires a web page where people can ask for their account and
// data to be deleted, even if the app is no longer installed.
legalPage({
  file: 'delete-account.html',
  title: 'Delete your sobr account',
  description: 'How to delete your sobr account and data.',
  body: `
<h1>Delete your account</h1>
<div class="meta">sobr · account and data deletion</div>
<div class="card">
<h2>In the app (quickest)</h2>
<ol>
  <li>Open sobr and sign in.</li>
  <li>Go to <strong>Settings → Your account</strong>.</li>
  <li>Tap <strong>Delete account</strong>, optionally download a backup, then type DELETE to confirm.</li>
</ol>
</div>
<div class="card">
<h2>Without the app</h2>
${
  LEGAL_CONTACT_EMAIL
    ? `<p>Email <a href="mailto:${esc(LEGAL_CONTACT_EMAIL)}?subject=Delete%20my%20sobr%20account">${esc(LEGAL_CONTACT_EMAIL)}</a> from the address your account uses, with the subject "Delete my sobr account". Requests are handled within 7 days.</p>`
    : `<p>Send a deletion request through the <a href="${esc(LEGAL_CONTACT_URL)}">contact page</a> and say that you want your account deleted. Please don't post your email address publicly; we'll reply so you can confirm the request from the address your account uses. Requests are handled within 7 days.</p>`
}
</div>
<h2>What gets deleted, and when</h2>
<p><strong>Right away:</strong> every photo you attached to a day, and your profile photo.</p>
<p><strong>After 30 days:</strong> your account, email address, display name, settings, and every logged day, drink and note are permanently erased. Signing in during those 30 days lets you cancel and restore everything.</p>
<p><strong>What we keep:</strong> nothing. No copy of your data is retained after the 30 days.</p>
<p>If you only want a pause, use <strong>Take a break</strong> on the same screen instead: reminders and emails stop and nothing is deleted.</p>`,
});

console.log('site built →', out);
