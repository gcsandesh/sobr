-- sobr — table GRANTs for the authenticated role.
--
-- Fixes "42501 permission denied for table ..." on projects that applied
-- 0000_init.sql before grants were added. RLS still restricts each user to their
-- own rows; these GRANTs are the table-level access Postgres requires as well.
-- Idempotent — safe to run more than once. `anon` is intentionally NOT granted.

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.daily_entries to authenticated;
grant select, insert, update, delete on public.drinks         to authenticated;
grant select, insert, update, delete on public.freeze_grants  to authenticated;
