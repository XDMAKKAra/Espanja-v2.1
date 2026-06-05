-- L-V392 P1-4: stop per-row re-evaluation of auth.uid() in RLS policies.
-- Applied to prod via MCP apply_migration 2026-06-05. Wrapping auth.uid() in
-- (select ...) lets Postgres evaluate it once per query (initplan) instead of
-- per row. Behaviour identical; only the query plan changes.

drop policy if exists free_usage_owner_select on public.free_usage;
create policy free_usage_owner_select on public.free_usage
  for select using ((select auth.uid()) = user_id);

drop policy if exists free_usage_owner_upsert on public.free_usage;
create policy free_usage_owner_upsert on public.free_usage
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists free_usage_owner_update on public.free_usage;
create policy free_usage_owner_update on public.free_usage
  for update using ((select auth.uid()) = user_id);

drop policy if exists translation_accepted_user_insert on public.translation_accepted;
create policy translation_accepted_user_insert on public.translation_accepted
  for insert to authenticated
  with check ((source = 'user') and (user_id = (select auth.uid())));
