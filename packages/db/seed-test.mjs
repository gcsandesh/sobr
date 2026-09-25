import { readFileSync } from 'node:fs';
import postgres from 'postgres';

// read DATABASE_URL straight from the repo .env (never via shell)
if (!process.env.DATABASE_URL) {
  const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
  const m = env.match(/^DATABASE_URL="?([^"\n]+)"?/m);
  if (m) process.env.DATABASE_URL = m[1];
}

/**
 * Seed realistic July 2026 history for the test account so every screen has
 * real data: a believable mix of wins, two slips with drinks+costs, notes, a
 * banked freeze, and a live 13-day streak. Idempotent: wipes and re-inserts
 * only this user's rows.
 */
const EMAIL = 'gcsandesh01@gmail.com';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

const [user] = await sql`select id from auth.users where email = ${EMAIL}`;
if (!user) throw new Error(`no auth user for ${EMAIL}`);
const uid = user.id;
console.log('seeding for', EMAIL, uid);

// settings: Kathmandu tz, NPR, zero-mode, onboarded
await sql`
  update user_settings set
    win_mode = 'zero', daily_limit_units = 2, currency = 'NPR',
    time_zone = 'Asia/Kathmandu', onboarded = true, updated_at = now()
  where user_id = ${uid}`;

// wipe prior seed
await sql`delete from daily_entries where user_id = ${uid}`; // drinks cascade
await sql`delete from freeze_grants where user_id = ${uid}`;

const days = [];
// Jul 1–5: clear start
for (let d = 1; d <= 5; d++) days.push({ d, status: 'win' });
// Jul 6: slip — friends over, 2 strong beers
days.push({
  d: 6,
  status: 'slip',
  note: 'Friends over for the football match. Two beers, stopped there.',
  drinks: [{ preset_key: 'beer_strong', name: 'Beer — strong / craft', volume_ml: 500, abv: 6.5, cost: 600, quantity: 2 }],
});
// Jul 7–13: 7 clear days (earns the freeze)
for (let d = 7; d <= 13; d++) days.push({ d, status: 'win', note: d === 13 ? 'One full week. Sleeping so much better.' : null });
// Jul 14: slip — work dinner, wine
days.push({
  d: 14,
  status: 'slip',
  note: 'Work dinner. One glass turned into two.',
  drinks: [{ preset_key: 'wine_glass', name: 'Wine — glass', volume_ml: 150, abv: 12, cost: 550, quantity: 2 }],
});
// Jul 15–27: current 13-day run
for (let d = 15; d <= 27; d++)
  days.push({ d, status: 'win', note: d === 21 ? 'Craving hit hard after work — went for a walk instead.' : null });

for (const day of days) {
  const date = `2026-07-${String(day.d).padStart(2, '0')}`;
  const ts = `${date}T15:00:00Z`;
  const [entry] = await sql`
    insert into daily_entries (user_id, entry_date, status, note, created_at, updated_at)
    values (${uid}, ${date}, ${day.status}, ${day.note ?? null}, ${ts}, ${ts})
    returning id`;
  for (const dr of day.drinks ?? []) {
    await sql`
      insert into drinks (daily_entry_id, preset_key, name, volume_ml, abv, cost, quantity, created_at)
      values (${entry.id}, ${dr.preset_key}, ${dr.name}, ${dr.volume_ml}, ${dr.abv}, ${dr.cost}, ${dr.quantity}, ${ts})`;
  }
}

// one banked freeze, earned when the Jul 7–13 run hit 7
await sql`
  insert into freeze_grants (user_id, granted_at, granted_for_streak)
  values (${uid}, '2026-07-13T15:00:00Z', 7)`;

const check = await sql`
  select status, count(*) from daily_entries where user_id = ${uid} group by status order by 1`;
console.log('seeded:', JSON.stringify(check));
await sql.end();
