// Applies migrations/0004_day_photos.sql (table + RLS + storage bucket/policies).
// Idempotent, so re-running is safe.
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8');
  const m = env.match(/^DATABASE_URL="?([^"\n]+)"?/m);
  if (m) process.env.DATABASE_URL = m[1];
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
const ddl = readFileSync(new URL('./migrations/0004_day_photos.sql', import.meta.url), 'utf8');
await sql.unsafe(ddl);
console.log('0004_day_photos applied');

const [bucket] = await sql`
  select id, public, file_size_limit, allowed_mime_types
  from storage.buckets where id = 'day-photos'`;
console.log('bucket:', JSON.stringify(bucket));

const policies = await sql`
  select policyname from pg_policies
  where (schemaname = 'public' and tablename = 'day_photos')
     or (schemaname = 'storage' and tablename = 'objects' and policyname like 'day_photos%')
  order by policyname`;
console.log('policies:', policies.map((p) => p.policyname).join(', '));
await sql.end();
