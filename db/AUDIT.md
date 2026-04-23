# Pass 5 Phase 1 — Database audit

**Project:** `teovmfkoebnghqmbtycj` (eu-central-1, Postgres 17.6.1).
**Date:** 2026-04-23.
**Method:** live introspection via Supabase MCP (`list_tables`, `execute_sql` against `pg_indexes`, `pg_policies`, `information_schema`, `pg_stat_statements`, `pg_extension`) + static code review. Read-only — no DDL applied.

> **Migration tracking note.** `supabase.migrations` is empty — this project was never bootstrapped with the Supabase CLI migration table. The `migrations/` folder is a hand-ordered catalog, not a tracked state. Truth source is introspection; **"applied" below means the table/column/policy actually exists in the live DB**, not that a migration file was run.

---

## SEV-1 — Code references DB objects that don't exist

These are the headline findings. In every case the code ships without crashing because the Supabase client swallows the "relation does not exist" error and the caller falls back silently — which means the feature in question is **dead on prod**.

### 1.1 `ai_cache` table — **missing**

- **Defined in:** `migrations/007_rate_limit_cache.sql`
- **Used by:** `lib/openai.js:65,79` (`dbGetCached`, `dbSetCache`).
- **Effect:** Every `.from("ai_cache")` call 404s; `dbGetCached` returns `null`, `dbSetCache` no-ops. `lib/openai.js` falls back to `_memCache` (Map), but on **Vercel serverless each invocation is a cold process** → the Map is empty for most requests. Prod cache hit rate is effectively 0% even though cache logic is intact.
- **Cost impact:** every OpenAI call that *would* have been cached is billed fresh. On hot combos (same level/topic/mode prompted minutes apart by different users) this is the dominant spend.

### 1.2 `rate_limit_buckets` table — **missing**

- **Defined in:** `migrations/007_rate_limit_cache.sql`
- **Used by:** `middleware/rateLimit.js:31,55,64,71,78`.
- **Effect:** `supabaseRateLimit()` hits the missing table → `error` set → the function explicitly "fails open" (`middleware/rateLimit.js:38–40`) and allows the request. **Every limiter — authLimiter, registerLimiter, forgotPasswordLimiter, aiLimiter, aiStrictLimiter, reportLimiter — is disabled in production.**
- **Blast radius:** unbounded AI spend from a single hostile account; no cap on register or password-reset attempts. This is the most exposed finding in the audit.

### 1.3 `user_mastery` table — **missing**

- **Defined in:** `migrations/021_user_mastery.sql`
- **Used by:** `lib/learningPath.js`, `routes/progress.js`, `lib/sessionComposer.js`, `js/diagnostic.js`, plus tests.
- **Effect:** writes swallowed, reads return empty → every mastery-driven decision runs against `{}`. The spaced-retrieval learning path degrades to "pick anything" mode; diagnostic mastery display shows zeros.

### 1.4 `user_profile.reading_pieces_consumed` column — **missing**

- **Defined in:** `migrations/027_reading_pieces_consumed.sql`
- **Used by:** Pass 4 Commit 8 reading soft-gate (PAYWALL.md rule: 2 free reading pieces then hard gate).
- **Effect:** increment on reading fetch silently errors; the "3rd piece 403s" check never trips → free users get unlimited reading pieces.

### 1.5 `email_preferences.{d1_weakness,d7_offer,exam_countdown}` columns — **missing**

- **Defined in:** `migrations/028_email_preferences_expand.sql`
- **Used by:** Pass 4 Commit 11 drip cron endpoints (`routes/email.js`) + preferences GET/PUT.
- **Effect:** unsubscribe flips don't persist; the cron targets use the default behavior (send-to-all) with no per-user opt-out for the three new categories.

### Verification query

```sql
SELECT to_regclass('public.ai_cache')            AS ai_cache,
       to_regclass('public.rate_limit_buckets')  AS rate_limit_buckets,
       to_regclass('public.user_mastery')        AS user_mastery;
-- returns (null, null, null) today.
```

The `user_profile` and `email_preferences` column lists are the same story — compare `SELECT column_name FROM information_schema.columns WHERE table_name='user_profile'` against `migrations/027`.

---

## SEV-2 — RLS coverage gaps

### 2.1 Ten tables have RLS enabled but **zero policies**

`ai_usage`, `email_preferences`, `email_verifications`, `exercise_bank`, `exercise_logs`, `password_resets`, `push_subscriptions`, `seen_exercises`, `sr_cards`, `subscriptions`.

With no policies, RLS-enabled tables are **denied to every non-bypass role**. Today the server uses `SUPABASE_SERVICE_ROLE_KEY` (`supabase.js:8`), which bypasses RLS, so prod works. Two real problems:

- **Any future anon-key usage of these tables breaks completely.** Worse, testing one might confuse "access denied" for a bug in application logic.
- **Defense in depth is absent.** A service-role key leak is game over; with correct policies the key leak is still bad but user isolation survives for user-scoped tables (`exercise_logs`, `seen_exercises`, `sr_cards`, `ai_usage`, `email_preferences`, `password_resets`, `push_subscriptions`, `subscriptions`).

`exercise_bank` is a special case — it's shared content and wants `USING (true)` for SELECT (anyone can read banked exercises) with no INSERT/UPDATE/DELETE for `public`.

### 2.2 `waitlist` RLS policy is overly permissive

```
USING (true) WITH CHECK (true) FOR ALL TO public
```

Anyone authenticated (or using the anon key) can read and write every row. Rename or replace with service-role-only (`TO service_role`) plus a public INSERT with `WITH CHECK (email IS NOT NULL)` if you want anon signup via anon key; or keep all waitlist inserts server-side and drop the public policy entirely.

### 2.3 Missing: `public.auth` columns exposure

No direct finding — `auth.users` is not exposed via public views. The only foreign keys into `auth.users` are all `ON DELETE CASCADE` or `ON DELETE NO ACTION` (default). Fine for now.

---

## SEV-3 — Performance lints

### 3.1 `auth.uid()` re-evaluated per row (18 policies)

Supabase's performance linter flagged 18 policies across `exam_sessions`, `user_profile`, `diagnostic_results`, `user_level`, `user_session_state`, `user_mistakes`, `seen_seed_items`, `hint_events`. Each uses `auth.uid() = user_id` — which Postgres re-evaluates for every row. Changing to `(select auth.uid()) = user_id` makes the subquery evaluate once per statement. Effectively free change, material under load.

### 3.2 `seen_exercises.exercise_id` FK is unindexed

The primary key is `(user_id, exercise_id)`, which indexes `user_id` first — so lookups by `exercise_id` (e.g. when cleaning up bank rows that get deleted) scan sequentially. Fix: `CREATE INDEX IF NOT EXISTS idx_seen_exercises_exercise ON seen_exercises (exercise_id);`

### 3.3 Eleven "unused" indexes flagged

`idx_exercise_logs_user`, `idx_subscriptions_ls_customer`, `idx_password_resets_token`, `idx_password_resets_email`, `idx_email_verifications_token`, `idx_exercise_bank_reported`, `idx_mistakes_topics`, `idx_seen_seed_user_seen`, `idx_waitlist_product`, `idx_ai_usage_month`, `idx_hint_events_user`, `idx_push_subs_user`, `idx_session_state_user`.

**Do not drop yet.** With only 7 `exercise_logs` rows and 22 `ai_usage` rows, the planner always prefers a seq scan — these indexes look unused because there's no real load. Re-check after 30 days of real traffic post-launch. The Stripe/LS customer index and password-reset email index are the most likely to stay unused after that.

---

## SEV-4 — Hygiene

### 4.1 `cleanup_expired_rows()` has mutable `search_path`

Linter finding (`function_search_path_mutable`). Fix: `ALTER FUNCTION public.cleanup_expired_rows SET search_path = '';` and fully-qualify table references inside the body. Also: this function is **never called** today — migration 007 suggested wiring it to `pg_cron`, but `pg_cron` is not an installed extension (see extensions list below). So expired `ai_cache` rows (when the table finally exists) and expired `rate_limit_buckets` would accumulate. Either enable `pg_cron` + schedule it, or do cleanup via an Edge Function / Vercel cron.

### 4.2 Supabase Auth — leaked password protection disabled

Linter finding (`auth_leaked_password_protection`). Toggle on in dashboard. Free, immediate win.

### 4.3 Installed extensions

`pg_graphql`, `pg_stat_statements`, `pgcrypto`, `supabase_vault`, `uuid-ossp`. Missing: `pg_cron` (for scheduled cleanup), `pgvector` (not currently needed — no RAG). No action required.

---

## Query-pattern review (static, since traffic is negligible)

`pg_stat_statements` top 25 is dominated by Supabase Studio introspection queries and auth-internal calls (`sessions`, `refresh_tokens`). The application's own queries don't appear in the top 25 because cumulative traffic is tiny (7 exercise logs total). So this is a **static read**, not a slow-query trace:

- **`tryBankExercise` (`routes/exercises.js:66`)** — `exercise_bank WHERE mode = ? AND level = ? AND topic = ? AND language = ? AND quality_score > 0`. Covered by `idx_exercise_bank_lookup` (btree on mode,level,topic,language, partial on `quality_score > 0`). OK. Companion query `seen_exercises WHERE user_id = ? AND seen_at >= ?` covered by `idx_seen_exercises_user`. OK.
- **`routes/progress.js`** hits `exercise_logs` by `user_id` and `user_mastery` by `user_id` — first covered by `idx_exercise_logs_user` (and the composite `_user_mode`). Second broken because the table doesn't exist.
- **`routes/adaptive.js`** hits `user_level`, `user_session_state` — PK on `user_id` handles these.
- **`routes/sr.js`** hits `sr_cards WHERE user_id = ? AND language = ? AND next_review <= CURRENT_DATE` — covered by `idx_sr_cards_due`. OK.

No missing indexes on the hot paths beyond what's already listed. The two categories of real risk today are (a) the missing tables in §1, (b) the RLS-initplan perf issue in §3.1 once load shows up.

---

## Connection pooling

`supabase.js` uses a single `createClient` with the service-role key, no explicit pooler config. On Vercel serverless this is fine — each invocation gets a fresh client; Supabase's built-in PgBouncer-compatible pooler handles the actual TCP pool. The `pg_stat_statements` top-25 includes `pg_backup_start` and one `SELECT * FROM pgbouncer.get_auth(...)` call, consistent with the pooler being engaged.

Recommendation: no change. If traffic grows, set `SUPABASE_URL` to the pooler endpoint (`…pooler.supabase.com:6543`) for routes that do many small queries per request — currently none qualify.

---

## Dead columns / dead tables

- **`user_profile.strong_areas`** — defined, never written (grep confirms). `weak_areas` also unused since Pass 4 stripped the profile wizard. **Keep** for now; small blast radius.
- **`user_profile.motivation`** — same story, stripped from wizard, never read.
- **`exercise_logs.ytl_grade`** — set only in the old writing-grade path. Pass 3 moved grading to `exam_sessions.final_grade`. Candidate for removal after verifying no dashboard reads it.
- **`diagnostic_results.question_ids`** — written but never read. Kept for forensics; fine.
- **`password_resets`** — row count 0 and two redundant indexes on `token` (`idx_password_resets_token` + unique constraint `password_resets_token_key`) and two on `email`. Drop the non-unique `idx_` duplicates in a cleanup migration.
- **`email_verifications`** — same pattern: unique constraint `email_verifications_token_key` plus redundant `idx_email_verifications_token`.

No dead tables identified in public schema.

---

## Migration-file review

35 SQL files in `migrations/`. Confirmed-missing in prod: **007 (partial — ai_cache + rate_limit_buckets + cleanup_expired_rows fn exists), 021 (user_mastery), 027, 028**.

Also: `013` and `014` have collisions — both directories contain two `013_*.sql` and two `014_*.sql` files. `013_prewarm_bank_b_c.sql` vs `013_push_subscriptions.sql`; `014_prewarm_bank_m.sql` vs `014_user_profile.sql`. This is a naming bug, not a correctness bug (both halves of each pair look applied), but it makes the folder a poor index for the next migration. Rename in a cleanup pass, or adopt the Supabase CLI migration table properly from Phase 2.

---

## Phase 2 plan (recommended order)

Each is idempotent and ships as its own migration. SEV-1 fixes first, then security, then performance.

1. **`029_apply_missing_core.sql`** — replay 007's `ai_cache` + `rate_limit_buckets` + `cleanup_expired_rows`. Put `IF NOT EXISTS` everywhere and fix the function's `search_path`. **This is the #1 production risk; ship first.**
2. **`030_apply_user_mastery.sql`** — replay 021 idempotently.
3. **`031_apply_reading_pieces_consumed.sql`** — replay 027.
4. **`032_apply_email_preferences_expand.sql`** — replay 028.
5. **`033_rls_policies_backfill.sql`** — add missing policies to the 10 RLS-enabled-no-policy tables. One `USING ((select auth.uid()) = user_id)` each for user-scoped; `exercise_bank` gets a SELECT-only `USING (true)`.
6. **`034_rls_policy_initplan_fix.sql`** — rewrite the 18 flagged policies to use `(select auth.uid())`.
7. **`035_waitlist_rls_tighten.sql`** — drop "Service role full access", add an anon INSERT-only policy + service-role-gated SELECT/UPDATE.
8. **`036_seen_exercises_exercise_id_index.sql`** — add the missing FK index.
9. **`037_drop_redundant_indexes.sql`** — drop `idx_password_resets_token`, `idx_password_resets_email`, `idx_email_verifications_token` (redundant with unique constraints).
10. **`038_cleanup_scheduler.sql`** — enable `pg_cron` and schedule `cleanup_expired_rows()` every 10 min. (Alternatively wire it via Vercel cron — cheaper if pg_cron on the current plan tier is an upgrade.)

RLS fixes (033, 034, 035) each ship with a supertest that impersonates user A and confirms 0 rows from user B's data. See `plans/05-db-cost.md` quality bar.

**Also:** turn on "Leaked password protection" in Supabase Auth settings (dashboard toggle, no migration needed).

**Deferred:** the unused-index cleanup (§3.3), the `strong_areas` / `motivation` / `ytl_grade` column drops. Revisit 30 days post-launch when `pg_stat_user_indexes` has real data.
