import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config. `pnpm db:generate` diffs schema.ts into SQL under
 * ./migrations. The canonical first migration (0000_init.sql) is hand-written
 * because it also sets up RLS, triggers, and the Supabase auth.users FK that
 * Drizzle Kit cannot infer.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // We manage Supabase's auth/storage schemas separately — keep Drizzle to public.
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
});
