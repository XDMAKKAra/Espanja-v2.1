-- v249 (Bug 2) — Restore visible progress on Oppimispolku-index.
--
-- Root cause: public.user_curriculum_progress had RLS enabled but ZERO
-- policies. The backend's Supabase client uses an `sb_secret_*` API key,
-- which (unlike the legacy service_role JWT) respects RLS — so every
-- SELECT silently returned 0 rows.
--
-- Symptom: GET /api/curriculum returned `lessonsCompleted: 0` for every
-- kurssi even when the user had completed lessons stored in the table,
-- so the Oppimispolku-index showed "Aloita →" instead of "1 / 10
-- oppituntia" for kurssi_1.
--
-- Fix: mirror the policy shape used on the parallel user_lesson_progress
-- table (auth.uid() = user_id for every CRUD action). Applied via MCP
-- on 2026-05-21; this file documents the migration in repo history.
--
-- Verified by curl: GET /api/curriculum?lang=es now returns
-- `lessonsCompleted: 1` for testpro123@gmail.com.

CREATE POLICY IF NOT EXISTS user_curriculum_progress_select_own ON public.user_curriculum_progress
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY IF NOT EXISTS user_curriculum_progress_insert_own ON public.user_curriculum_progress
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY IF NOT EXISTS user_curriculum_progress_update_own ON public.user_curriculum_progress
  FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY IF NOT EXISTS user_curriculum_progress_delete_own ON public.user_curriculum_progress
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
