# Pass 5 Phase 3 — OpenAI cost audit (static)

**Date:** 2026-04-23.
**Method:** static read of `lib/openai.js`, `routes/*.js`, `middleware/rateLimit.js`, + live Supabase introspection for the cache/usage tables. No OpenAI credits spent to produce this audit.
**Model:** `gpt-4o-mini` everywhere (`lib/openai.js:5`).

> **Headline finding is in `db/AUDIT.md §1`.** The `ai_cache` table doesn't exist in production, so every "cache hit" actually comes from `_memCache` — an in-memory Map per Vercel serverless invocation. On serverless, each cold start means an empty cache. **Effective prod cache hit rate is ~0%**, regardless of what the cache logic looks like. Fixing that migration is the single largest cost lever in the codebase.

---

## AI call sites

Counted from `grep -rc "openai\|chat\.completions\|generateAndLog" routes/` and read through to confirm each is live-wired:

| Route file            | AI touches | Endpoints | Status |
|-----------------------|-----------|-----------|--------|
| `routes/exercises.js` | 15        | `/generate` (vocab), `/grade`, `/grammar/generate`, `/grammar/grade`, `/reading/generate`, `/reading/grade`, `/translate-mini` (gen + grade) | All live. |
| `routes/writing.js`   | 4         | `/generate`, `/grade` | All live. |
| `routes/exam.js`      | 4         | Exam generator + grader | All live. |
| `routes/adaptive.js`  | 1         | Adaptive session composer | Live but thin — most branches hit bank-first. |
| `routes/email.js`     | 1         | D1 weakness personalisation | Live (but the email_preferences opt-out doesn't persist — see `db/AUDIT.md §1.5`). |
| `routes/progress.js`  | 1         | — | Grep false positive; actual file has no OpenAI call. |

No orphaned AI endpoints. **The plan's guess that `/api/translate-mini` is dead is wrong** — it's wired, it's called from the `kaannos` exercise mode (`exercises/kaannos/DESIGN.md:163`), and it has both a generator (`exercises.js:872`) and a grader downstream.

---

## Cache behaviour audit

`lib/openai.js`:
- **Key:** SHA-256 of `prompt::maxTokens::model`. Correct — no prefix truncation, so batch-specific prompts (with user profile context appended) get distinct keys as intended. Pass-0 bug (200-char prefix key collision leaking profiles) is resolved.
- **TTL split:** 30 min for graders, 24 h for generators. Exported constants `CACHE_TTL_MS_GRADER` / `CACHE_TTL_MS_GENERATOR`. Reasonable.
- **Two-tier:** `memGetCached` → `dbGetCached`. Dev uses mem only; prod uses both, mem populated on write.
- **Bug in prod:** `dbGetCached` / `dbSetCache` both silently swallow errors via `try/catch → return null` / no-op. Combined with the missing `ai_cache` table, the DB tier is fully broken and undetectable. The mem tier survives, but **on Vercel each lambda invocation is a fresh process** — TTL is effectively the lifetime of a single warm container, not 24 h.

**What to do:**
1. Ship migration 029 (creates `ai_cache`). See `db/AUDIT.md`.
2. Log cache hit/miss at INFO level with a 1% sample and forward a counter to PostHog (`openai_cache_hit` / `openai_cache_miss` with endpoint label). Without observability you'll miss the next regression too.
3. After 24 h of real traffic, assert hit rate ≥60% on generators / ≥20% on graders per `plans/05-db-cost.md` quality bar.

## Bank-first behaviour

`routes/exercises.js:66 tryBankExercise`:
- Always attempts the bank before AI (no dice roll — the old "50% freshness roll" was removed).
- Query: `mode + level + topic + language + quality_score > 0`, minus last-30-day `seen_exercises` for the user, `LIMIT 10`, then random pick.
- Updates `last_used_at` + inserts into `seen_exercises` on hit.

**Observations:**
- The 10-row cap is prudent on small banks (198 rows total today) but becomes a selection-quality ceiling later. Revisit when bank size per slice > 50.
- No quality-floor beyond `> 0`. Once `reported_count` data accumulates, add `AND reported_count < 3` or `quality_score > 0.5`.
- No fallback to level-adjacent rows. On a sparsely-populated (level × topic × language) triple, bank-miss → AI. Consider a relaxed retry (same mode/topic, any level within ±1 band) before paying for generation — acceptable quality hit for meaningful cost cut.

## Bank saturation (current state)

Live count: **198 rows in `exercise_bank`**, 9 rows in `seen_exercises`, 7 in `exercise_logs`. Ratio of exposures-to-inventory is ~4.5% — far from saturation. Prewarm migrations `013_b_c`, `014_m`, `015_e`, `016_l` appear applied (bank is non-empty across levels) but per-slice depth is unknown — worth a PostHog breakdown once traffic shows up.

Quick check to run after migrations land:

```sql
SELECT mode, level, topic, count(*) AS rows
FROM exercise_bank
GROUP BY mode, level, topic
ORDER BY rows ASC
LIMIT 20;
```

Slices with < 10 rows are where the AI fallback fires; those are your saturation targets for pre-generation.

## Rate limiter

See `db/AUDIT.md §1.2`. Every limiter is silently disabled in production. This isn't *directly* an OpenAI-cost finding, but the `aiLimiter` (20/hr per user) and `aiStrictLimiter` (10/hr per user) are the two guardrails that prevent a single hostile account from running the monthly budget dry in an afternoon. Shipping migration 029 fixes both at once.

Legitimate-user 429s aren't possible to assess without the limiter actually running. Revisit after ship.

## `checkMonthlyCostLimit`

Referenced from most AI endpoints. Hits the `ai_usage` table, which *does* exist and has 22 rows logged (`logAiUsage` is being called correctly). So the monthly-cap circuit is working in principle; it just can't be proven tripped until the cap is actually hit.

**Recommendation:** lower the default monthly cap to €50 until real traffic establishes a baseline. Currently the cap is whatever `OPENAI_MONTHLY_CAP_USD` env var defaults to — confirm it's set in Vercel.

## Logging audit

Per the quality bar ("no secrets in logs"):

```
grep -rn "console\.log.*OPENAI\|console\.log.*apiKey\|console\.log.*Bearer\|console\.log.*prompt" lib/ routes/ middleware/
```

Static read: `lib/openai.js` does not log keys; it logs error messages only. `routes/exercises.js` logs `err.message` in catch blocks, not prompt content. Clean.

Still recommend wrapping the OpenAI client with a redacting logger for defense in depth — any future dev who adds `console.log(req.body)` in a hot route will otherwise paste user writing samples into Vercel logs.

---

## Cost-fix plan (priority order)

1. **[blocked-on-DB]** Apply migration 029 (creates `ai_cache`, `rate_limit_buckets`). This single DDL is the biggest cost + abuse-risk fix in the whole codebase.
2. **Observability.** Add `openai_cache_hit` / `openai_cache_miss` PostHog events with endpoint label, 1% sample. Without this we will not know if (1) worked.
3. **Bank-first relaxation.** When `tryBankExercise` returns null for a (mode, level, topic) slice, retry with ±1 adjacent level before paying for generation. One-commit change, keyed off level-order array already defined in `lib/openai.js` constants.
4. **Quality floor on bank.** Add `AND reported_count < 3 AND quality_score > 0.5` to the bank query once per-row data is meaningful (30 days post-launch).
5. **Circuit breaker on cost spike.** Simple read of `ai_usage` last-hour cost vs last-7-day same-hour baseline; if >2×, flip a `__BANK_ONLY_MODE` flag in `/api/config/public` that frontends already poll. Ship after #1 + #2 so the signal is clean.
6. **Defer:** removing `/api/translate-mini`. It is **not** dead. The plan's premise there is wrong. Leave it in.

---

## Quality-bar scorecard

| Target (from `plans/05-db-cost.md`)                    | Status |
|---------------------------------------------------------|--------|
| Cache hit rate ≥60% generators / ≥20% graders           | **Unmeasurable until `ai_cache` migration lands; current effective hit rate ~0% in prod.** |
| Cost per active user/day ≤ €0.05                        | Unmeasurable — no DAU defined yet; `ai_usage` has 22 rows total. |
| No secrets in logs                                      | ✅ static grep confirms. |
| No dead endpoints                                       | ✅ every AI route has a live caller (see table above). |
| Rate limits on abusive users                            | ❌ **broken in prod** — `rate_limit_buckets` missing. |
