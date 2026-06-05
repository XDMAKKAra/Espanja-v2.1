-- L-V392 P1-3: diagnostic_results had INSERT + SELECT policies but no UPDATE.
-- placement /choose-level and personalization /build-profile update it by id;
-- once routed through the user-scoped req.supabase client an UPDATE with no
-- policy silently affects 0 rows. Add the owner-scoped UPDATE policy.
-- Applied to prod via MCP apply_migration 2026-06-05.
drop policy if exists "Users can update own diagnostics" on public.diagnostic_results;
create policy "Users can update own diagnostics" on public.diagnostic_results
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
