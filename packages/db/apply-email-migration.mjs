import { readFileSync } from 'node:fs';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
  const m = env.match(/^DATABASE_URL="?([^"\n]+)"?/m);
  if (m) process.env.DATABASE_URL = m[1];
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
const ddl = readFileSync(new URL('./migrations/0002_email.sql', import.meta.url), 'utf8');

// drop a pre-existing schedule so re-runs don't error on duplicate job name
try {
  await sql`select cron.unschedule('sobr-email-jobs')`;
} catch {
  /* job or extension may not exist yet */
}
await sql.unsafe(ddl);
console.log('migration applied');

const jobs = await sql`select jobid, jobname, schedule, command from cron.job`;
console.log('cron jobs:', JSON.stringify(jobs, null, 2));
await sql.end();
