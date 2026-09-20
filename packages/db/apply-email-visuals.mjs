import { readFileSync } from 'node:fs';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
  const m = env.match(/^DATABASE_URL="?([^"\n]+)"?/m);
  if (m) process.env.DATABASE_URL = m[1];
}
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

await sql.unsafe(readFileSync(new URL('./migrations/0003_email_visuals.sql', import.meta.url), 'utf8'));
console.log('0003_email_visuals applied');

const [u] = await sql`select id, email from auth.users where email = 'gcsandesh01@gmail.com'`;

// preview both, and send the weekly so the new design can be judged for real
const [wk] = await sql`select * from app.render_weekly_email(${u.id}, '2026-07-28'::date)`;
const [rm] = await sql`select * from app.render_reminder_email(${u.id}, '2026-07-30'::date)`;
console.log('weekly subject :', wk.subject);
console.log('reminder subject:', rm.subject);

// clear today's dedupe rows so the redesign actually sends
await sql`delete from email_log where user_id = ${u.id} and sent_on in ('2026-07-28','2026-07-30')`;
const [a] = await sql`select app.queue_email(${u.id}, ${u.email}, 'weekly', '2026-07-28'::date, ${wk.subject}, ${wk.html}) as q`;
const [b] = await sql`select app.queue_email(${u.id}, ${u.email}, 'reminder', '2026-07-30'::date, ${rm.subject}, ${rm.html}) as q`;
console.log('queued weekly:', a.q, '| queued reminder:', b.q);

await new Promise((r) => setTimeout(r, 8000));
const resp = await sql`select status_code, content from net._http_response order by created desc limit 2`;
console.log('resend responses:', JSON.stringify(resp));

await sql.end();
