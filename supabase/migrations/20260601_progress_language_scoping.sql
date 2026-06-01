-- L-V339 P1 — Cross-language progress bleed fix (backend foundation).
-- Progress-bearing tables had no `language` column, so dashboard stats
-- (streak, per-mode counts, chart, grade estimate), weak topics, exam history
-- and placement were shared across es/fr/de. SR/curriculum/digikirja progress
-- was already language-scoped; these four were the gap.
--
-- Stores the full-word convention ("spanish"/"french"/"german") to match the
-- dashboard `language` query param and the client's state.language. Existing
-- rows backfill to 'spanish' (the only language with content today), so
-- behaviour is unchanged until the client starts passing the active language.

alter table public.exercise_logs     add column if not exists language text not null default 'spanish';
alter table public.user_mistakes      add column if not exists language text not null default 'spanish';
alter table public.exam_sessions      add column if not exists language text not null default 'spanish';
alter table public.diagnostic_results add column if not exists language text not null default 'spanish';

-- Composite indexes matching the dashboard read patterns (user + language + recency/status).
create index if not exists idx_exercise_logs_user_lang_created     on public.exercise_logs (user_id, language, created_at desc);
create index if not exists idx_user_mistakes_user_lang_created      on public.user_mistakes (user_id, language, created_at desc);
create index if not exists idx_exam_sessions_user_lang_status       on public.exam_sessions (user_id, language, status);
create index if not exists idx_diagnostic_results_user_lang_created on public.diagnostic_results (user_id, language, created_at desc);
