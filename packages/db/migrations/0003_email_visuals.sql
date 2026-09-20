-- 0003_email_visuals — richer visuals for both emails.
--
-- Deliberately no <img> tags: most clients block remote images by default, which
-- would leave holes where the design should be. Everything here is emoji plus
-- table/div shapes, so it renders identically in Gmail, Apple Mail and Outlook
-- with images off. Layout uses tables (not flex/grid) for Outlook's sake.

-- A 7-day strip: filled green ✓ for wins, teal ❄ for freezes, soft clay dot for
-- slips, hollow ring for unlogged days.
create or replace function app.render_day_strip(p_user uuid, p_today date)
returns text
language sql stable security definer set search_path = ''
as $$
  select '<table role="presentation" align="center" style="border-collapse:collapse;margin:4px auto 18px;"><tr>'
    || coalesce(string_agg(cell, '' order by d), '')
    || '</tr></table>'
  from (
    select gs.d::date as d,
      '<td align="center" valign="top" style="padding:0 3px;">'
      || '<div style="width:34px;height:34px;line-height:34px;border-radius:17px;text-align:center;'
      || 'font-size:15px;font-weight:bold;font-family:Helvetica,Arial,sans-serif;'
      || case e.status
           when 'win' then 'background:#457029;color:#FFFFFF;'
           when 'freeze' then 'background:#E2EFEE;color:#3F7B79;'
           when 'slip' then 'background:#F7E6D8;color:#A85A32;'
           else 'background:#FFFFFF;color:#CFC3AD;border:1px solid #E7DCC8;line-height:32px;'
         end
      || '">'
      || case e.status
           when 'win' then '&#10003;'
           when 'freeze' then '&#10054;'
           when 'slip' then '&middot;'
           else '&nbsp;'
         end
      || '</div>'
      || '<div style="font-size:10px;color:#82796A;margin-top:5px;font-family:Helvetica,Arial,sans-serif;">'
      || substr(to_char(gs.d, 'Dy'), 1, 1) || '</div>'
      || '</td>' as cell
    from generate_series(p_today - 6, p_today, interval '1 day') gs(d)
    left join public.daily_entries e
      on e.user_id = p_user and e.entry_date = gs.d::date
  ) x
$$;

-- lifetime clear days → the growth stage's emoji, mirroring GROWTH_STAGES
create or replace function app.stage_emoji(p_wins integer) returns text
language sql immutable
as $$
  select case
    when p_wins >= 180 then '🌳'
    when p_wins >= 90 then '🌳'
    when p_wins >= 30 then '🌿'
    when p_wins >= 7 then '🌱'
    else '🌰'
  end
$$;

create or replace function app.render_weekly_email(p_user uuid, p_today date)
returns table (subject text, html text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  wins int; slips int; freezes int; logged int;
  units numeric; spent numeric; cur text; lifetime int;
  streak int := app.current_streak(p_user, p_today);
  since date := p_today - 6;
  body text; banner text := '';
begin
  select coalesce(s.currency, 'USD') into cur
  from public.user_settings s where s.user_id = p_user;

  select
    count(*) filter (where e.status = 'win'),
    count(*) filter (where e.status = 'slip'),
    count(*) filter (where e.status = 'freeze'),
    count(*)
  into wins, slips, freezes, logged
  from public.daily_entries e
  where e.user_id = p_user and e.entry_date between since and p_today;

  select count(*) into lifetime
  from public.daily_entries e
  where e.user_id = p_user and e.status = 'win';

  select coalesce(sum(d.volume_ml * d.abv / 1000 * d.quantity), 0),
         coalesce(sum(coalesce(d.cost, 0) * d.quantity), 0)
  into units, spent
  from public.daily_entries e join public.drinks d on d.daily_entry_id = e.id
  where e.user_id = p_user and e.entry_date between since and p_today;

  if wins = 7 then
    banner := '<div style="background:#E9F5D8;border-radius:12px;padding:14px;text-align:center;'
      || 'color:#3C6323;font-size:15px;font-weight:bold;margin-bottom:16px;">'
      || '🎉 A perfect week — all seven days clear</div>';
  elsif wins >= 5 then
    banner := '<div style="background:#FFF1E2;border-radius:12px;padding:14px;text-align:center;'
      || 'color:#B95C22;font-size:15px;font-weight:bold;margin-bottom:16px;">'
      || '✨ ' || wins || ' clear days — a strong week</div>';
  end if;

  body :=
    -- streak, with fire only once there's a run worth celebrating
    '<div style="text-align:center;margin:2px 0 6px;">'
    || case when streak > 0
         then '<div style="font-size:42px;line-height:1.1;">🔥</div>'
              || '<div style="font-size:40px;font-weight:bold;color:#B95C22;line-height:1.1;">' || streak || '</div>'
              || '<div style="font-size:13px;color:#82796A;">day streak</div>'
         else '<div style="font-size:42px;line-height:1.1;">🌱</div>'
              || '<div style="font-size:15px;color:#82796A;margin-top:6px;">A fresh start is always available</div>'
       end
    || '</div>'
    || banner
    || app.render_day_strip(p_user, p_today)
    -- stat grid
    || '<table role="presentation" width="100%" style="border-collapse:separate;border-spacing:8px;">'
    || '<tr>'
    || '<td width="50%" style="background:#FBF2E3;border-radius:12px;padding:14px;text-align:center;">'
    ||   '<div style="font-size:24px;font-weight:bold;color:#457029;">✅ ' || wins || '</div>'
    ||   '<div style="font-size:12px;color:#82796A;">clear days</div></td>'
    || '<td width="50%" style="background:#FBF2E3;border-radius:12px;padding:14px;text-align:center;">'
    ||   '<div style="font-size:24px;font-weight:bold;color:#B95C22;">' || app.stage_emoji(lifetime) || ' ' || lifetime || '</div>'
    ||   '<div style="font-size:12px;color:#82796A;">clear days all-time</div></td>'
    || '</tr><tr>'
    || '<td width="50%" style="background:#FBF2E3;border-radius:12px;padding:14px;text-align:center;">'
    ||   '<div style="font-size:24px;font-weight:bold;color:#6A5946;">🍃 ' || round(units, 1) || '</div>'
    ||   '<div style="font-size:12px;color:#82796A;">units this week</div></td>'
    || '<td width="50%" style="background:#FBF2E3;border-radius:12px;padding:14px;text-align:center;">'
    ||   '<div style="font-size:24px;font-weight:bold;color:#6A5946;">' || cur || ' ' || round(spent) || '</div>'
    ||   '<div style="font-size:12px;color:#82796A;">spent on drinks</div></td>'
    || '</tr></table>'
    || '<p style="font-size:15px;line-height:1.6;color:#4A443C;margin-top:18px;">'
    || case
         when wins = 7 then 'Seven for seven. However this week felt from the inside, the record is spotless — that''s worth sitting with.'
         when wins >= 5 then 'A strong week. ' || wins || ' clear days is real momentum, and momentum is the whole game.'
         when wins >= 3 then 'A mixed week, and that''s allowed. ' || wins || ' clear days still happened, and they still count.'
         when logged = 0 then 'Nothing logged this week — no judgement. The tracker only helps when it''s honest, and it''s never too late to pick it back up.'
         else 'A hard week. Every clear day still counts, and next week is genuinely unwritten.'
       end
    || '</p>';

  return query select
    case when wins = 7 then '🎉 A perfect week — 7 clear days'
         else 'Your week with sobr — ' || wins || ' clear ' || case when wins = 1 then 'day' else 'days' end
    end,
    app.email_shell('Your week, counted', body);
end $$;

-- Reminder: mention the streak at stake, since that's the real motivator.
create or replace function app.render_reminder_email(p_user uuid, p_today date)
returns table (subject text, html text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  streak int := app.current_streak(p_user, p_today);
  body text;
begin
  body :=
    case when streak > 0 then
      '<div style="text-align:center;margin:2px 0 14px;">'
      || '<div style="font-size:40px;line-height:1.1;">🔥</div>'
      || '<div style="font-size:34px;font-weight:bold;color:#B95C22;line-height:1.2;">' || streak || '</div>'
      || '<div style="font-size:13px;color:#82796A;">day streak — keep it going</div></div>'
    else
      '<div style="text-align:center;margin:2px 0 14px;"><div style="font-size:40px;">🍃</div></div>'
    end
    || app.render_day_strip(p_user, p_today)
    || '<p style="font-size:15px;line-height:1.6;color:#4A443C;">'
    || 'Today isn''t logged yet. A minute of honesty keeps the picture real — '
    || 'clear day or not, it counts more when it''s counted.</p>'
    || '<div style="background:#FFF1E2;border-radius:12px;padding:14px;text-align:center;margin-top:14px;">'
    || '<span style="color:#B95C22;font-size:15px;font-weight:bold;">Open sobr and log today</span></div>';

  return query select
    case when streak > 0 then '🔥 ' || streak || ' days — how did today go?'
         else 'How did today go?' end,
    app.email_shell('A quiet check-in', body);
end $$;

-- Point the hourly worker at the new reminder renderer.
create or replace function app.run_email_jobs() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  local_now timestamp;
  local_today date;
  m record;
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
      select * into m from app.render_reminder_email(r.id, local_today);
      perform app.queue_email(r.id, r.email, 'reminder', local_today, m.subject, m.html);
    end if;

    if r.email_weekly
       and extract(dow from local_today) = 0 -- Sunday
       and extract(hour from local_now) = 18
    then
      select * into m from app.render_weekly_email(r.id, local_today);
      perform app.queue_email(r.id, r.email, 'weekly', local_today, m.subject, m.html);
    end if;
  end loop;
end $$;
