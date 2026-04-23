# Pass 5 Phase 4 — Post-ship notes (cost)

The cost-side quality bar from `plans/05-db-cost.md` is partially met. The most impactful change was in `db/` — creating the `ai_cache` table in prod — since that single DDL was the reason prod cache hit rate was effectively 0%.

## What shipped

- **Prod OpenAI cache now functional.** Migration 029 created the `ai_cache` table that `lib/openai.js:65,79` (dbGetCached/dbSetCache) was already calling. No code change needed — the cache logic was correct; the storage layer was missing. Hit rate should now grow to the 60%/20% targets as real traffic hits repeated prompts.
- **Rate limiters now enforced.** Same migration added `rate_limit_buckets`. `authLimiter`, `aiLimiter`, `aiStrictLimiter`, `registerLimiter`, `forgotPasswordLimiter`, `reportLimiter` now all apply in production. The "fail open on DB error" branch in `middleware/rateLimit.js:38` is no longer the hot path.

## Audit corrections

- `/api/translate-mini` is **not** dead — it's the generator+grader for the `kaannos` translation mode. The plan was wrong; we kept the route.
- `checkMonthlyCostLimit` was already working (hits `ai_usage` which existed); no change needed. Confirm `OPENAI_MONTHLY_CAP_USD` is set sensibly in Vercel env.

## Deferred (Phase 4 items we did not ship this pass)

1. **Cache hit/miss telemetry.** Add `openai_cache_hit` / `openai_cache_miss` PostHog events (1% sample, endpoint label) in `lib/openai.js`. Without this we can't prove the hit rate improvement from migration 029. ~30 min of work.
2. **Bank-first relaxation.** When `tryBankExercise` returns null for a (mode, level, topic) slice, retry with ±1 adjacent level before calling OpenAI. One-commit change; measurable in `exercise_bank.last_used_at`. See `cost/AUDIT.md §Bank-first`.
3. **Quality floor on bank.** `AND reported_count < 3 AND quality_score > 0.5` added to the bank query. Wait until `reported_count` has real data (30 days).
4. **Cost-spike circuit breaker.** Poll `ai_usage` last-hour cost vs 7-day baseline; if >2×, flip `__BANK_ONLY_MODE` in `/api/config/public`. Ship after (1) so the signal is clean.
5. **Observability dashboard.** A tiny `/admin/cost` page or a PostHog dashboard showing: $/day, cache hit rate by endpoint, bank size per (mode, level, topic) slice, rate-limit 429s. Needed for the "cost dashboard" bullet in the plan's Done checklist.

## Quality-bar status (updated)

| Target | Status |
|---|---|
| Cache hit rate ≥60% generators / ≥20% graders | **Now measurable.** Storage exists; telemetry deferred (item 1 above). |
| No index scan on hot queries | ✅ all hot paths have covering indexes (see `db/AUDIT.md §Query-pattern review`). |
| Cost per active user/day ≤ €0.05 | Unmeasurable until observability lands + there's a DAU baseline. |
| No secrets in logs | ✅ (static grep, unchanged). |
| Rate-limiter enforced without 429-ing legitimate users | Limiters now enforced; legitimate-user 429 review requires real traffic. |
| `generateAndLog` dead-endpoint audit | ✅ no dead endpoints (see audit). |

## Done checklist (plan §Done)

- [x] All applicable migrations applied (029–037; 038 deferred pending `pg_cron` availability).
- [ ] Cost dashboard live (deferred — item 5 above).
- [x] `db/POSTSHIP.md` written.
- [x] `cost/POSTSHIP.md` written.
