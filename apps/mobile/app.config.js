const path = require('path');

// Expo auto-loads `.env` from the app folder only. In this monorepo the canonical
// `.env` lives at the repo root, so load that here (then let an app-local `.env`
// override it if present) and inject the public keys into `extra` — which is
// reliably bundled and readable at runtime via expo-constants, regardless of
// Metro's process.env inlining timing.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? null,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null,
  },
});
