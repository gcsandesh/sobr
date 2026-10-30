# Store graphics

Ready-to-upload Google Play assets, in `play/`:

| File | Play Console slot | Size |
| --- | --- | --- |
| `icon-512.png` | App icon | 512 × 512 |
| `feature-graphic.png` | Feature graphic | 1024 × 500 |
| `01-home.png` … `06-steady.png` | Phone screenshots (upload in order) | 1080 × 1920 |

The screenshots show **sample data** (demo mode), never a real account.

## Regenerating

1. Run the app on web with sample data:
   `cd apps/mobile && EXPO_PUBLIC_SKIP_AUTH=1 EXPO_PUBLIC_DEMO_DATA=1 pnpm exec expo start --web`
2. Capture each screen at 390 × 844, device scale 3, into `store/raw/raw_<name>.png`
   (home, calendar, day, milestones, forest, steady). `raw/` is git-ignored.
3. Open each `store/src/*.html` at 1080 × 1920 (feature graphic at 1024 × 500) in Chromium
   and save a screenshot to `store/play/`. The templates hold the headlines; edit them there.
