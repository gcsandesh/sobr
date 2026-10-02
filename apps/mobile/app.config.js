const path = require('path');

// Expo auto-loads `.env` from the app folder only. In this monorepo the canonical
// `.env` lives at the repo root, so load that here (then let an app-local `.env`
// override it if present) and inject the public keys into `extra` — which is
// reliably bundled and readable at runtime via expo-constants, regardless of
// Metro's process.env inlining timing.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });

// CI (the GitHub Actions APK build) passes the run number here so every build
// installs over the previous one. Local/EAS builds keep app.json's value.
const versionCode = Number(process.env.ANDROID_VERSION_CODE) || undefined;

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(versionCode ? { versionCode } : {}),
  },
  extra: {
    ...(config.extra ?? {}),
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? null,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null,
  },
});
