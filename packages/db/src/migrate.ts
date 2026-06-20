import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

/**
 * Minimal forward-only migration runner. Executes every .sql file in
 * ./migrations in lexical order against DATABASE_URL, tracking applied files in
 * a `public._sobr_migrations` table so re-runs are safe.
 *
 * Run with: `pnpm --filter @sobr/db migrate` (needs DATABASE_URL in env).
 * For Supabase you can equally paste migrations/0000_init.sql into the SQL editor.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');

  const here = dirname(fileURLToPath(import.meta.url));
  const migrationsDir = join(here, '..', 'migrations');
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  const sql = postgres(url, { prepare: false });
  try {
    await sql`create table if not exists public._sobr_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`;
    const applied = new Set(
      (await sql<{ name: string }[]>`select name from public._sobr_migrations`).map((r) => r.name),
    );

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`• skip   ${file} (already applied)`);
        continue;
      }
      const body = await readFile(join(migrationsDir, file), 'utf8');
      console.log(`• apply  ${file}`);
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into public._sobr_migrations (name) values (${file})`;
      });
    }
    console.log('✓ migrations up to date');
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
