-- 0005_time_zone_guard — stop one user's bad time zone from halting everyone's email.
--
-- `user_settings.time_zone` is user-writable (RLS grants each user UPDATE on
-- their own row) and had no constraint, while app.run_email_jobs() ran
-- `now() at time zone r.time_zone` for every user inside a single loop with no
-- exception handling. A single unparseable zone raised invalid_parameter_value
-- and aborted the whole function, so *nobody* got mail — every hour, until the
-- row was found by hand. Reachable deliberately via a direct PATCH, or by
-- accident from a device reporting a deprecated zone id.
--
-- Two layers, because either alone leaves a gap:
--   1. reject bad zones at write time, so they never land; and
--   2. isolate each user's iteration, so *any* per-user error (not just a bad
--      zone — a render failure too) skips that user instead of everyone.
--
-- Idempotent — safe to run more than once.

-- ── 1. validation at the write boundary ──────────────────────────────────

create or replace function app.is_valid_time_zone(p_tz text) returns boolean
language plpgsql immutable
as $$
begin
  -- A constant timestamp keeps this genuinely immutable; we only care whether
  -- the zone name resolves, not what the result is.
  perform timestamp '2000-01-01 00:00:00' at time zone p_tz;
  return true;
exception when others then
  return false;
end $$;

-- Repair anything already stored before the guard existed, otherwise the
-- trigger below would block those users from updating any other setting.
update public.user_settings
  set time_zone = 'UTC'
  where not app.is_valid_time_zone(time_zone);

create or replace function app.enforce_valid_time_zone() returns trigger
language plpgsql
as $$
begin
  if not app.is_valid_time_zone(new.time_zone) then
    raise exception 'invalid time zone: %', new.time_zone
      using errcode = 'invalid_parameter_value',
            hint = 'Use an IANA name such as Asia/Kathmandu.';
  end if;
  return new;
end $$;

drop trigger if exists user_settings_time_zone_valid on public.user_settings;
create trigger user_settings_time_zone_valid
  before insert or update of time_zone on public.user_settings
  for each row execute function app.enforce_valid_time_zone();

-- ── 2. per-user isolation in the hourly job ──────────────────────────────

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
