-- 0006_freeze_per_run — freeze tokens are earned once per milestone PER STREAK.
--
-- Before: unique (user_id, granted_for_streak). Each 7/14/21-day token could be
-- earned once per account, ever, so after a first 7-day streak no later streak
-- earned a freeze again.
--
-- After: each grant records the first day of the streak that earned it
-- (run_start), and uniqueness is (user_id, run_start, granted_for_streak).
-- Legacy rows keep run_start = null; they still count toward the bank (unused
-- ones can still be spent) but no longer block new streaks.
--
-- Idempotent: safe to run more than once. The app works before and after it
-- (it falls back to the old behaviour while run_start doesn't exist).

alter table public.freeze_grants add column if not exists run_start date;

-- drop the old per-account unique constraint, whatever it was named
do $$
declare c record;
begin
  for c in
    select con.conname
      from pg_constraint con
     where con.conrelid = 'public.freeze_grants'::regclass
       and con.contype = 'u'
       and (select array_agg(att.attname::text order by att.attname)
              from unnest(con.conkey) k
              join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k)
           = array['granted_for_streak', 'user_id']
  loop
    execute format('alter table public.freeze_grants drop constraint %I', c.conname);
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.freeze_grants'::regclass
       and conname = 'freeze_grants_user_run_milestone_key'
  ) then
    alter table public.freeze_grants
      add constraint freeze_grants_user_run_milestone_key
      unique (user_id, run_start, granted_for_streak);
  end if;
end $$;

-- make the new column visible to the API immediately
notify pgrst, 'reload schema';
