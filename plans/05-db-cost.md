# Pass 5 — Database + cost hardening (single prompt, audit + fix)

By now Puheo has real exercise variety, polished UI, a content bank, and an onboarding funnel that converts. Before marketing pushes real traffic, harden the foundation: Supabase schema health + OpenAI spend control.

**Prerequisites:** Passes 1–4 merged.

## Skills

- `.claude/skills/supabase/SKILL.md`
- `.claude/skills/supabase-postgres-best-practices/SKILL.md`

## Scope

One pass, gated. No Step 1/2 split needed — this is audit + fix, not a big design decision.

## Phase 1 — Database audit (read-only, no migrations yet)

Produce `db/AUDIT.md` covering:
- Every table in Supabase. Columns, types, indexes, foreign keys, RLS policies.
- Query patterns: which queries run hot? Check `routes/progress.js`, `routes/sr.js`, `routes/adaptive.js`. Are they indexed?
- RLS audit: is every user-scoped table actually enforcing user isolation? A student must not be able to read another student's progress.
- Dead columns, dead tables, unused indexes.
- Migration file review (`migrations/`): any migration that's never been applied in production?
- Connection pooling: are we using Supabase's pooler correctly?
- Slow query log if available.

## Phase 2 — Database fixes (migrations)

Per finding from Phase 1, a numbered SQL migration. Rules:
- Each migration idempotent (`IF NOT EXISTS` everywhere).
- Each migration tested on a local Supabase first.
- Each migration applied to staging (if exists) before production.
- RLS fixes get their own migration and a supertest proving isolation.

Target: 5–10 migrations.

## Phase 3 — OpenAI cost audit

Produce `cost/AUDIT.md`:
- Per endpoint: calls/day, tokens/call, $/day, cache hit rate, bank hit rate.
- Dead call audit: are there `generateAndLog` calls in routes that no client actually triggers? Grep for any endpoint → client call mismatch.
- Cache key sanity: the training pass added SHA-256 + TTL split. Verify it actually works — log cache hit vs miss for 24h and report ratio.
- Bank saturation: how many exercises are in the bank per type? Are we reusing them, or is bank-first probability too low?
- Rate-limiter tuning: `middleware/rateLimit.js` — are any legitimate users getting 429'd?

## Phase 4 — OpenAI cost fixes

Per finding: one commit each. Rules:
- Raise bank-first probability for static content (reading, grammar, passages) to 70–80%.
- Prefer seeds (from Pass 2) over AI generation when seed coverage exists.
- Add a circuit breaker on OpenAI endpoints that flips to "bank-only" mode if cost spikes >2× baseline in an hour.
- Remove dead endpoints (`/api/translate-mini` was flagged as dead earlier — verify and remove).
- Boot-log gate: don't log OpenAI keys or prompts in production.

## Quality bar

- Every RLS policy has a supertest proving a student can't read another student's rows.
- Cache hit rate ≥60% on generator endpoints, ≥20% on grader endpoints (after seeding).
- No index scan on hot queries (EXPLAIN ANALYZE each).
- Cost per active user/day measured and reported — target ≤€0.05 at current model pricing.
- No secrets in logs — grep proves it.

## Done

- All migrations applied.
- Cost dashboard (PostHog or a tiny internal page) showing $/day, cache ratios, bank sizes.
- `db/POSTSHIP.md` + `cost/POSTSHIP.md`.
