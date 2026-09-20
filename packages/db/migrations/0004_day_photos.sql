-- 0004_day_photos — attach photos to a tracked day ("track memories as well").
--
-- Storage layout: objects live in the private `day-photos` bucket under
--   <user_id>/<daily_entry_id>/<uuid>.<ext>
-- The leading path segment is the owner's uid, which is what every storage
-- policy below checks — so ownership is enforced by the path itself and cannot
-- be spoofed by a client picking its own key.
--
-- The table stores only the object path. URLs are minted as short-lived signed
-- URLs at read time: the bucket is private, so a stored URL would either expire
-- (dead link in the DB) or have to be public (defeats RLS).
--
-- Idempotent — safe to run more than once.

create table if not exists day_photos (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references daily_entries(id) on delete cascade,
  -- Denormalised from the parent entry so storage policies and RLS can check
  -- ownership without a join, and so a delete trigger can build the object path.
  user_id uuid not null,
  object_path text not null unique,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists day_photos_entry_idx on day_photos (daily_entry_id, created_at);

alter table day_photos enable row level security;

drop policy if exists day_photos_select on public.day_photos;
create policy day_photos_select on public.day_photos
  for select using (auth.uid() = user_id);
drop policy if exists day_photos_insert on public.day_photos;
create policy day_photos_insert on public.day_photos
  for insert with check (
    auth.uid() = user_id
    -- the parent entry must also belong to the caller, or a user could attach
    -- photos to someone else's day by guessing an entry id
    and exists (select 1 from public.daily_entries e
                where e.id = day_photos.daily_entry_id and e.user_id = auth.uid())
  );
drop policy if exists day_photos_update on public.day_photos;
create policy day_photos_update on public.day_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists day_photos_delete on public.day_photos;
create policy day_photos_delete on public.day_photos
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.day_photos to authenticated;

-- ── storage ───────────────────────────────────────────────────────────────
-- Private bucket. 10 MB cap and an image-only MIME allowlist are enforced
-- server-side; the client also downsizes before upload, but a client check is
-- a convenience, not a control.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'day-photos', 'day-photos', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = false;

-- Each policy pins the first path segment to the caller's uid.
drop policy if exists day_photos_objects_select on storage.objects;
create policy day_photos_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists day_photos_objects_insert on storage.objects;
create policy day_photos_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists day_photos_objects_update on storage.objects;
create policy day_photos_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists day_photos_objects_delete on storage.objects;
create policy day_photos_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'day-photos' and (storage.foldername(name))[1] = auth.uid()::text);
