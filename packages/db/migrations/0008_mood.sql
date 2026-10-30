-- 0008_mood — how each day felt, 1 (rough) to 5 (great). Optional.
--
-- A new column on an existing table: the table-level grants from 0001 already
-- cover it, so (unlike a new table after Supabase's Oct 30 2026 change) no
-- GRANT is needed. Rows keep RLS as before. The app probes for the column and
-- simply doesn't save mood until this has run.

alter table public.daily_entries
  add column if not exists mood smallint
  check (mood is null or mood between 1 and 5);
