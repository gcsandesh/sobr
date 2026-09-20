-- 0002_email — in-database email pipeline (reminders + weekly progress).
--
-- Architecture: pg_cron fires hourly → per-user time-zone checks decide who
-- gets mail this hour → pg_net POSTs to Resend. The API key lives in Supabase
-- Vault under the name 'resend_api_key'; while it is absent every send is
-- logged with status 'skipped_no_key' instead (safe dry-run mode).
--
-- To go live:  select vault.create_secret('<RESEND_API_KEY>', 'resend_api_key');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- per-user email preferences
alter table user_settings
  add column if not exists email_reminders boolean not null default true,
  add column if not exists email_weekly boolean not null default true;

-- audit + dedupe log. RLS on with no policies → only service roles can touch it.
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('reminder', 'weekly')),
  sent_on date not null,
  status text not null default 'queued', -- queued | skipped_no_key
  subject text not null,
  html text not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, sent_on)
);
alter table email_log enable row level security;

create schema if not exists app;

create or replace function app.resend_key() returns text
language sql stable security definer set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'resend_api_key' limit 1
$$;

-- Queue one email: dedupes on (user, kind, day), then fires the HTTP call if a
-- key exists. pg_net is async — delivery result lands in net._http_response.
-- Resend sandbox (onboarding@resend.dev) can only deliver to the account
-- owner's address. Until a domain is verified, sends to anyone else are
-- logged as 'skipped_sandbox' and never hit the API. When the domain is
-- verified: update the 'from' below and empty this allowlist.
create or replace function app.sandbox_allowlist() returns text[]
language sql immutable
as $$ select array['gcsandesh01@gmail.com'] $$;

create or replace function app.queue_email(
  p_user uuid, p_email text, p_kind text, p_on date, p_subject text, p_html text
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  k text := app.resend_key();
  allowed boolean := coalesce(array_length(app.sandbox_allowlist(), 1), 0) = 0
                     or p_email = any (app.sandbox_allowlist());
begin
  insert into public.email_log (user_id, kind, sent_on, status, subject, html)
  values (
    p_user, p_kind, p_on,
    case
      when k is null then 'skipped_no_key'
      when not allowed then 'skipped_sandbox'
      else 'queued'
    end,
    p_subject, p_html
  )
  on conflict (user_id, kind, sent_on) do nothing;
  if not found then
    return false; -- already handled today
  end if;
  if k is not null and allowed then
    perform net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || k,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'sobr <onboarding@resend.dev>',
        'to', jsonb_build_array(p_email),
        'subject', p_subject,
        'html', p_html
      )
    );
  end if;
  return true;
end $$;

-- shared warm shell for both emails
create or replace function app.email_shell(p_title text, p_body_html text) returns text
language sql immutable
as $$
  select '<!doctype html><html><body style="margin:0;padding:0;background:#F5EAD8;">'
    || '<div style="max-width:520px;margin:0 auto;padding:32px 20px;font-family:Georgia,''Times New Roman'',serif;color:#201E1D;">'
    || '<div style="background:#FFFFFF;border-radius:16px;padding:28px;border:1px solid #E7DCC8;">'
    || '<div style="font-size:22px;font-weight:bold;color:#C67139;margin-bottom:4px;">sobr</div>'
    || '<div style="font-size:13px;color:#82796A;margin-bottom:20px;">Clear days, counted.</div>'
    || '<div style="font-size:19px;margin-bottom:14px;">' || p_title || '</div>'
    || p_body_html
    || '</div>'
    || '<div style="text-align:center;font-size:12px;color:#82796A;padding:16px;">'
    || 'You can turn these emails off in sobr → Settings.</div>'
    || '</div></body></html>'
$$;

-- current streak (win/freeze run ending local-today, or yesterday if today is
-- still unlogged) — mirrors @sobr/core computeStreak's grace rule.
create or replace function app.current_streak(p_user uuid, p_today date) returns integer
language plpgsql stable security definer set search_path = ''
as $$
declare
  cursor_d date;
  n integer := 0;
  s text;
begin
  select status into s from public.daily_entries where user_id = p_user and entry_date = p_today;
  if s in ('win', 'freeze') then
    cursor_d := p_today;
  elsif s is null then
    select status into s from public.daily_entries where user_id = p_user and entry_date = p_today - 1;
    if s in ('win', 'freeze') then cursor_d := p_today - 1; end if;
  end if;
  if cursor_d is null then return 0; end if;
  loop
    select status into s from public.daily_entries where user_id = p_user and entry_date = cursor_d;
    exit when s is null or s not in ('win', 'freeze');
    n := n + 1;
    cursor_d := cursor_d - 1;
  end loop;
  return n;
end $$;

-- Render the weekly progress email (separate from sending so it can be
-- previewed/tested without the time gate).
create or replace function app.render_weekly_email(p_user uuid, p_today date)
returns table (subject text, html text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  wins int; slips int; freezes int;
  units numeric; spent numeric; cur text;
  streak int := app.current_streak(p_user, p_today);
  since date := p_today - 6;
  body text;
begin
  select coalesce(s.currency, 'USD') into cur from public.user_settings s where s.user_id = p_user;
  select
    count(*) filter (where e.status = 'win'),
    count(*) filter (where e.status = 'slip'),
    count(*) filter (where e.status = 'freeze')
  into wins, slips, freezes
  from public.daily_entries e
  where e.user_id = p_user and e.entry_date between since and p_today;

  select coalesce(sum(d.volume_ml * d.abv / 1000 * d.quantity), 0),
         coalesce(sum(coalesce(d.cost, 0) * d.quantity), 0)
  into units, spent
  from public.daily_entries e join public.drinks d on d.daily_entry_id = e.id
  where e.user_id = p_user and e.entry_date between since and p_today;

  body :=
    '<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:8px;">'
    || '<tr>'
    || '<td style="background:#FBF2E3;border-radius:12px;padding:14px;text-align:center;">'
    ||   '<div style="font-size:26px;font-weight:bold;color:#C67139;">' || wins || '</div>'
    ||   '<div style="font-size:12px;color:#82796A;">clear days</div></td>'
    || '<td style="background:#FBF2E3;border-radius:12px;padding:14px;text-align:center;">'
    ||   '<div style="font-size:26px;font-weight:bold;color:#C67139;">' || streak || '</div>'
    ||   '<div style="font-size:12px;color:#82796A;">day streak</div></td>'
    || '</tr><tr>'
    || '<td style="background:#FBF2E3;border-radius:12px;padding:14px;text-align:center;">'
    ||   '<div style="font-size:26px;font-weight:bold;color:#56633F;">' || round(units, 1) || '</div>'
    ||   '<div style="font-size:12px;color:#82796A;">units this week</div></td>'
    || '<td style="background:#FBF2E3;border-radius:12px;padding:14px;text-align:center;">'
    ||   '<div style="font-size:26px;font-weight:bold;color:#56633F;">' || cur || ' ' || round(spent) || '</div>'
    ||   '<div style="font-size:12px;color:#82796A;">spent on drinks</div></td>'
    || '</tr></table>'
    || '<p style="font-size:15px;line-height:1.6;color:#4A443C;margin-top:16px;">'
    || case
         when wins >= 6 then 'A nearly-perfect week — this is what momentum looks like. Keep tending it.'
         when wins >= 4 then 'A solid week. ' || wins || ' clear days is real progress, whatever the other days held.'
         when slips > 0 then 'A mixed week — and that''s okay. Every clear day still counts, and next week is unwritten.'
         else 'A fresh week starts now. One clear day is all it takes to begin.'
       end
    || '</p>';

  return query select
    'Your week with sobr — ' || wins || ' clear ' || case when wins = 1 then 'day' else 'days' end,
    app.email_shell('Your week, counted', body);
end $$;

-- Hourly worker: reminder at 20:00 local when today is unlogged; weekly
-- summary Sunday 18:00 local. Dedupe makes re-runs within the hour harmless.
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
    local_now := now() at time zone r.time_zone;
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
  end loop;
end $$;

-- hourly at :05, runs in UTC; per-user local-time gating happens inside
select cron.schedule('sobr-email-jobs', '5 * * * *', 'select app.run_email_jobs()');
