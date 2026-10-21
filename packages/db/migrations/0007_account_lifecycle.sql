-- 0007_account_lifecycle — "take a break" and "delete with a 30-day undo".
--
--   paused_at              set when the user takes a break. Nothing is deleted;
--                          emails stop; signing in offers "Resume".
--   deletion_requested_at  set when the user deletes their account. Signing in
--                          within 30 days offers "Restore"; after that the
--                          daily purge below erases the auth user, which
--                          cascades to every app table. (Photo files are removed
--                          by the app at request time; see the app's
--                          requestAccountDeletion.)
--
-- Both columns live on user_settings, so the existing RLS (a user can only
-- update their own row) already governs who can set them.
-- Idempotent: safe to run more than once.

alter table public.user_settings
  add column if not exists paused_at timestamptz,
  add column if not exists deletion_requested_at timestamptz;

-- ── emails skip paused and deleting accounts ───────────────────────────────
-- Same as 0005's app.run_email_jobs, plus the two conditions in the WHERE.
create or replace function app.run_email_jobs() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  local_now timestamp;
  local_today date;
  w record;
begin
  for r in
    select u.id, u.email, s.time_zone, s.email_reminders, s.email_weekly
    from auth.users u join public.user_settings s on s.user_id = u.id
    where u.email is not null
      and s.paused_at is null
      and s.deletion_requested_at is null
  loop
    -- Subtransaction per user: one row's failure must never cost every other
    -- user their mail. Swallowing is deliberate — this runs unattended from
    -- pg_cron, so the only alternative is aborting the batch.
    begin
      local_now := pg_catalog.now() at time zone r.time_zone;
      local_today := local_now::date;

      if r.email_reminders
         and extract(hour from local_now) = 20
         and not exists (
           select 1 from public.daily_entries e
           where e.user_id = r.id and e.entry_date = local_today
         )
      then
        perform app.queue_email(
          r.id, r.email, 'reminder', local_today,
          'How did today go?',
          app.email_shell(
            'A quiet check-in',
            '<p style="font-size:15px;line-height:1.6;color:#4A443C;">'
            || 'Today hasn''t been logged yet. A minute to reflect keeps the picture honest — '
            || 'clear day or not, it counts more when it''s counted.</p>'
            || '<p style="font-size:15px;color:#4A443C;">Open sobr and log today. 🍃</p>'
          )
        );
      end if;

      if r.email_weekly
         and extract(dow from local_today) = 0 -- Sunday
         and extract(hour from local_now) = 18
      then
        select * into w from app.render_weekly_email(r.id, local_today);
        perform app.queue_email(r.id, r.email, 'weekly', local_today, w.subject, w.html);
      end if;
    exception when others then
      raise warning 'sobr email job skipped user %: % (%)', r.id, sqlerrm, sqlstate;
    end;
  end loop;
end $$;

-- ── the 30-day purge ────────────────────────────────────────────────────────
create or replace function app.purge_deleted_accounts() returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  n integer;
begin
  with gone as (
    delete from auth.users u
     using public.user_settings s
     where s.user_id = u.id
       and s.deletion_requested_at is not null
       and s.deletion_requested_at < pg_catalog.now() - interval '30 days'
    returning u.id
  )
  select count(*) into n from gone;
  return n;
end $$;

revoke all on function app.purge_deleted_accounts() from public;

-- daily at 03:17 UTC; scheduling by name replaces an existing job of that name
select cron.schedule('sobr-purge-deleted-accounts', '17 3 * * *',
                     'select app.purge_deleted_accounts()');

notify pgrst, 'reload schema';
