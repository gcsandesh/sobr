import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Server-side Drizzle client. NEVER import this from the Expo app bundle — it
 * holds a direct, privileged Postgres connection (DATABASE_URL) and bypasses RLS.
 * Use it only in trusted server contexts: migrations, seed scripts, admin tasks.
 */
export function createDbClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — required for the server-side DB client.');
  }
  const sql = postgres(connectionString, { prepare: false });
  return drizzle(sql, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
export { schema };
