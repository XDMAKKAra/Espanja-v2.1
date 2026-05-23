-- L-V290-MICROCOPY-SWEEP — strip em-dash from user-facing curriculum text.
--
-- The original 20260429_curriculum.sql migration hydrated curriculum_kurssit
-- and curriculum_lessons with editorial em-dashes ("Kurssi 1 — Kuka olen").
-- The L-V290 anti-slop contract bans em-dash in user-facing copy, so:
--   " — " becomes ": " (title separator)
--   remaining "—" become ","
-- This migration is idempotent — re-running on already-clean rows is a no-op.
--
-- Applied via mcp__claude_ai_Supabase__apply_migration on 2026-05-23.
-- Touched 8 kurssit + 50 lessons rows.

UPDATE curriculum_kurssit
SET title       = REPLACE(REPLACE(title, ' — ', ': '), '—', ','),
    description = REPLACE(REPLACE(description, ' — ', ': '), '—', ',')
WHERE title LIKE '%—%' OR description LIKE '%—%';

UPDATE curriculum_lessons
SET focus            = REPLACE(REPLACE(focus, ' — ', ': '), '—', ','),
    teaching_snippet = REPLACE(REPLACE(teaching_snippet, ' — ', ': '), '—', ',')
WHERE COALESCE(focus,'') LIKE '%—%' OR COALESCE(teaching_snippet,'') LIKE '%—%';
