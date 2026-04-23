# Pass 5 Phase 2 — Post-ship notes

Migrations 029–037 applied live to `teovmfkoebnghqmbtycj` on 2026-04-23. Phase 1 audit is in `db/AUDIT.md`.

## What shipped

| # | Migration | Effect |
|---|---|---|
| 029 | `apply_missing_core` | Adds `ai_cache`, `rate_limit_buckets` tables + `cleanup_expired_rows()` fn. Fixes the SEV-1 findings in AUDIT §1.1, §1.2 — prod AI cache and all rate limiters now actually work. `search_path = ''` pinned on the function. |
| 030 | `apply_user_mastery` | Adds `user_mastery` table + own-row policy using `(select auth.uid())`. AUDIT §1.3. |
| 031 | `apply_reading_pieces_consumed` | Adds `user_profile.reading_pieces_consumed INT NOT NULL DEFAULT 0`. Reading soft→hard gate (Pass 4 Commit 8) now trips at piece 3. AUDIT §1.4. |
| 032 | `apply_email_preferences_expand` | Adds `d1_weakness`, `d7_offer`, `exam_countdown` BOOL cols to `email_preferences`. Pass 4 drip unsubscribe now persists. AUDIT §1.5. |
| 033 | `rls_policies_backfill` | Adds RLS policies to 8 of the 10 "RLS-on, no-policy" tables (ai_usage, email_preferences, exercise_bank shared-read, exercise_logs, push_subscriptions, seen_exercises, sr_cards, subscriptions). All user-scoped policies use `(select auth.uid())`. |
| 034 | `rls_policy_initplan_fix` | Rewrites 18 existing policies to `(select auth.uid())` so the auth function evaluates once per statement, not per row. All 18 linter warnings cleared. |
| 035 | `waitlist_rls_tighten` | Drops the `USING (true) WITH CHECK (true) FOR ALL` policy that let any anon-key holder read/write the whole waitlist. |
| 036 | `seen_exercises_exercise_id_index` | Adds FK covering index. Linter warning cleared. |
| 037 | `drop_redundant_indexes` | Drops 3 btree indexes on columns already covered by unique-constraint indexes (`password_resets.token`, `password_resets.email`, `email_verifications.token`). |

## Advisor state after

Security: 10 → 5 remaining lints, all intentional:
- `ai_cache`, `rate_limit_buckets` — server-only infrastructure, RLS-enabled-no-policy is the correct posture.
- `email_verifications`, `password_resets` — pre-auth token tables, server-only.
- `waitlist` — server-only writes; no anon/authenticated policy on purpose.

Plus one dashboard-only toggle: **enable "Leaked password protection" in Supabase Auth settings** (HaveIBeenPwned check). Not a migration.

Performance: all 18 `auth_rls_initplan` warnings + the unindexed-FK warning cleared. 14 `unused_index` notices remain — expected, given minimal traffic (7 `exercise_logs` rows, 22 `ai_usage` rows today). Revisit in 30 days.

## Deferred

- **038 — `pg_cron` + scheduled cleanup.** The `cleanup_expired_rows()` function exists and is ready, but `pg_cron` is not installed on this project (may require plan-tier upgrade on Supabase). Until then, either enable `pg_cron` in the dashboard + `CRON_SCHEDULE` it, or add a Vercel cron hitting a server route that runs `SELECT cleanup_expired_rows();`. Without this, `ai_cache` will slowly accumulate expired rows — not a crisis (index covers `expires_at`), but should be closed out before real traffic.
- **Column drops** (`user_profile.strong_areas`, `motivation`, `exercise_logs.ytl_grade`) — low priority, deferred until 30-day traffic window confirms no reads.
- **Unused-index review** — same 30-day window.

## If you need to roll back

Each migration has a `.down.sql` beside it (029 only — the later migrations are all low-risk one-liners). For 030–037, rollback is: `DROP POLICY` / `DROP INDEX` / `DROP COLUMN` with the names from the up-SQL. Don't roll back 029 without first reverting the 030/031/032 dependent features; the policies on `user_mastery` use the same `auth.uid()` pattern.

Note: the `supabase.migrations` tracking table (previously empty) now contains entries for 029–037 thanks to `apply_migration`. **The 35 older `migrations/*.sql` files are still not tracked there.** If you want a clean state, a one-off `INSERT INTO supabase_migrations.schema_migrations (version) VALUES (...)` for the historical list would close the gap — not required for correctness, but nice for future CLI workflows.
