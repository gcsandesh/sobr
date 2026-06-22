-- sobr — initial schema, RLS, triggers, and account-purge routine.
-- Apply via the Supabase SQL editor or `supabase db push`. Idempotent-ish:
-- uses IF NOT EXISTS where practical so re-running is safe during setup.
--
-- Privacy posture: this is sensitive personal-health data. Every table has RLS
-- ENABLED + FORCED so a user can only ever touch their own rows, and account
-- deletion genuinely purges everything via ON DELETE CASCADE to auth.users.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_settings (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  win_mode          text not null default 'zero' check (win_mode in ('zero','limit','manual')),
  daily_limit_units numeric not null default 2 check (daily_limit_units >= 0),
  currency          text not null default 'USD',
  time_zone         text not null default 'UTC',
  onboarded         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.daily_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  entry_date  date not null,
  status      text not null check (status in ('win','slip','freeze')),
  note        text check (char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists public.drinks (
  id              uuid primary key default gen_random_uuid(),
  daily_entry_id  uuid not null references public.daily_entries (id) on delete cascade,
  preset_key      text,
  name            text not null check (char_length(name) between 1 and 80),
  volume_ml       numeric not null check (volume_ml > 0),
  abv             numeric not null check (abv >= 0 and abv <= 100),
  cost            numeric check (cost >= 0),
  quantity        integer not null default 1 check (quantity >= 1),
  created_at      timestamptz not null default now()
);

create table if not exists public.freeze_grants (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  granted_at         timestamptz not null default now(),
  granted_for_streak integer not null check (granted_for_streak > 0),
  used_at            timestamptz,
  used_on_entry_id   uuid references public.daily_entries (id) on delete set null,
  -- prevent double-awarding the same milestone to the same user
  unique (user_id, granted_for_streak)
);

-- Indexes for the common read paths (calendar range, recent entries, banked tokens)
create index if not exists daily_entries_user_date_idx on public.daily_entries (user_id, entry_date);
create index if not exists drinks_entry_idx on public.drinks (daily_entry_id);
create index if not exists freeze_grants_user_idx on public.freeze_grants (user_id);
create index if not exists freeze_grants_banked_idx on public.freeze_grants (user_id) where used_at is null;

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at maintenance
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

drop trigger if exists daily_entries_set_updated_at on public.daily_entries;
create trigger daily_entries_set_updated_at
  before update on public.daily_entries
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-create settings for every new auth user
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security — enable + FORCE on every table
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.user_settings enable row level security;
alter table public.user_settings force row level security;
alter table public.daily_entries enable row level security;
alter table public.daily_entries force row level security;
alter table public.drinks        enable row level security;
alter table public.drinks        force row level security;
alter table public.freeze_grants enable row level security;
alter table public.freeze_grants force row level security;

-- Table privileges. RLS decides WHICH ROWS each user may touch; these GRANTs are
-- the table-level access Postgres requires *in addition* to RLS. Without them the
-- authenticated role gets "42501 permission denied". Only `authenticated` is
-- granted — `anon` (signed-out) never needs to read this personal data.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.daily_entries to authenticated;
grant select, insert, update, delete on public.drinks         to authenticated;
grant select, insert, update, delete on public.freeze_grants  to authenticated;

-- user_settings: a user owns exactly their row
drop policy if exists user_settings_select on public.user_settings;
create policy user_settings_select on public.user_settings
  for select using (auth.uid() = user_id);
drop policy if exists user_settings_insert on public.user_settings;
create policy user_settings_insert on public.user_settings
  for insert with check (auth.uid() = user_id);
drop policy if exists user_settings_update on public.user_settings;
create policy user_settings_update on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists user_settings_delete on public.user_settings;
create policy user_settings_delete on public.user_settings
  for delete using (auth.uid() = user_id);

-- daily_entries: per-user isolation
drop policy if exists daily_entries_select on public.daily_entries;
create policy daily_entries_select on public.daily_entries
  for select using (auth.uid() = user_id);
drop policy if exists daily_entries_insert on public.daily_entries;
create policy daily_entries_insert on public.daily_entries
  for insert with check (auth.uid() = user_id);
drop policy if exists daily_entries_update on public.daily_entries;
create policy daily_entries_update on public.daily_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists daily_entries_delete on public.daily_entries;
create policy daily_entries_delete on public.daily_entries
  for delete using (auth.uid() = user_id);

-- drinks: ownership flows through the parent daily_entry
drop policy if exists drinks_select on public.drinks;
create policy drinks_select on public.drinks
  for select using (
    exists (select 1 from public.daily_entries e
            where e.id = drinks.daily_entry_id and e.user_id = auth.uid())
  );
drop policy if exists drinks_insert on public.drinks;
create policy drinks_insert on public.drinks
  for insert with check (
    exists (select 1 from public.daily_entries e
            where e.id = drinks.daily_entry_id and e.user_id = auth.uid())
  );
drop policy if exists drinks_update on public.drinks;
create policy drinks_update on public.drinks
  for update using (
    exists (select 1 from public.daily_entries e
            where e.id = drinks.daily_entry_id and e.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.daily_entries e
            where e.id = drinks.daily_entry_id and e.user_id = auth.uid())
  );
drop policy if exists drinks_delete on public.drinks;
create policy drinks_delete on public.drinks
  for delete using (
    exists (select 1 from public.daily_entries e
            where e.id = drinks.daily_entry_id and e.user_id = auth.uid())
  );

-- freeze_grants: per-user isolation
drop policy if exists freeze_grants_select on public.freeze_grants;
create policy freeze_grants_select on public.freeze_grants
  for select using (auth.uid() = user_id);
drop policy if exists freeze_grants_insert on public.freeze_grants;
create policy freeze_grants_insert on public.freeze_grants
  for insert with check (auth.uid() = user_id);
drop policy if exists freeze_grants_update on public.freeze_grants;
create policy freeze_grants_update on public.freeze_grants
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists freeze_grants_delete on public.freeze_grants;
create policy freeze_grants_delete on public.freeze_grants
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Account deletion — purges ALL of the caller's data, then their auth user.
-- ON DELETE CASCADE from auth.users removes settings/entries/drinks/grants.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  -- Deleting the auth user cascades to every public table for this user.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
