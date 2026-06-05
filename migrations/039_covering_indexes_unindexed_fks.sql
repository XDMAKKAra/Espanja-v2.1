-- L-V392 P2-3: covering indexes for the two FK columns the advisor flagged.
-- Applied to prod via MCP apply_migration 2026-06-05.
create index if not exists idx_translation_accepted_user_id
  on public.translation_accepted (user_id);
create index if not exists idx_user_curriculum_progress_kurssi_key
  on public.user_curriculum_progress (kurssi_key);
