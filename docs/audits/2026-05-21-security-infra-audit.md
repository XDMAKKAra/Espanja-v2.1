# Security & Infrastructure Audit — 2026-05-21

Branch: `auto/security-infra-audit` (from `main` @ `cbea30b`)
Scope: A–K per audit brief. Phase 1 = data gathering only. No code changes.

Risk levels:
- **P0** — exploitable now; can leak data or spend real money. Fix before anything else.
- **P1** — must be fixed before public launch (or before any growth). Can wait briefly behind per-request-supabase-refactor if no active exploitation.
- **P2** — operational hardening. Schedule, don't block.

---

## A. Supabase

### A1. RLS policies with `USING (true)` / `WITH CHECK (true)` — **P1**
Advisor `rls_policy_always_true` flags 6 tables:
- `public.ai_cache` — policy `ai_cache_all` (ALL, true/true)
- `public.email_verifications` — `email_verifications_all` (ALL, true/true)
- `public.password_resets` — `password_resets_all` (ALL, true/true)
- `public.rate_limit_buckets` — `rate_limit_buckets_all` (ALL, true/true)
- `public.stripe_events` — `stripe_events_all` (ALL, true/true) — even has comment "Service role only" but policy contradicts it
- `public.waitlist` — `waitlist_all` (ALL, true/true)

Mitigating: each policy has empty `roles` (`[-]`) and the app only ever touches these tables through the service-role client (which bypasses RLS anyway). So an `anon` JWT cannot currently exploit these because no role is granted.

**Risk:** the moment someone (loop, migration, refactor) re-issues `GRANT … TO anon`, every row in `password_resets` / `email_verifications` / `waitlist` becomes world-readable + writable. `password_resets.token` lets an attacker reset any account.

**Fix:** rewrite to explicit `service_role`-only policies (or drop the policies and rely on default-deny + service-role bypass). Defense in depth — the table comment already says "Service role only".

### A2. Auth: leaked-password protection disabled — **P2**
`auth_leaked_password_protection` WARN. HaveIBeenPwned check off. Two clicks in Supabase dashboard. Worth enabling before launch.

### A3. RLS `auth.<fn>()` re-evaluated per row — **P2**
`auth_rls_initplan` WARN on `free_usage` (3 policies) and `translation_accepted` (1). Swap `auth.uid() = user_id` → `(SELECT auth.uid()) = user_id`. Purely perf, no security impact.

### A4. Unindexed foreign keys — **P2**
`translation_accepted_user_id_fkey`, `user_curriculum_progress_kurssi_key_fkey`. Add covering indexes when these tables grow.

### A5. `auth.users` ↔ `public.user_profile` orphan check — **deferred / P2**
Not exhaustively queried in this audit. Sample of 6 rows in `user_profile`; spot-check next time `gdpr-delete` ships.

### A6. RLS coverage — **OK**
All 32 tables in `public` schema report `rls_enabled: true`. No exposed-schema tables without RLS.

---

## B. Stripe webhook — **NO FINDING ✅**

`routes/stripe.js:245-262` verifies `stripe-signature` via `stripe.webhooks.constructEvent(req.body, sig, secret)`. `server.js:97-98` mounts `express.raw({ type: "application/json" })` BEFORE `express.json()` so the raw bytes are preserved. Both `/api/stripe/webhook` and legacy `/api/payments/webhook` route through the same handler.

Idempotency: `stripe_events` table records each `event.id`; duplicates return 200 no-op. Missing `STRIPE_WEBHOOK_SECRET` returns 410 (correct — discourages retry by stale dashboards).

**Verify**: `STRIPE_WEBHOOK_SECRET` actually set in Vercel env (Vercel MCP `list_projects` returned schema error without `teamId`; not blocking — check `vercel env ls` manually before launch).

---

## C. CORS

### C1. Wildcard fallback when `ALLOWED_ORIGINS` empty — **P0 (conditional)**
`server.js:84-91` and `api/index.js:29-36`:
```js
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || "").split(",")...
app.use(cors(allowedOrigins.length ? { … strict … } : undefined));
```
If neither env var is set in prod, `cors(undefined)` = default = `Access-Control-Allow-Origin: *` (no credentials). Combined with `credentials: true` in the strict branch, the intent is clearly "fail closed" but the code fails open.

**Severity:** P0 if `ALLOWED_ORIGINS` is unset in Vercel prod; P2 if set. Need to verify Vercel env state to grade — for now mark P0 with caveat. Either way the fallback should be fail-closed (single allow-list or block).

**Fix:** default to `["https://puheo.fi"]` (or block entirely) when env is empty.

---

## D. Email verification + password reset

### D1. Register auto-confirms email — **P1**
`routes/auth.js:29-33` creates user with `email_confirm: true`, then ALSO sends a verification email. The "verification" link is decorative — user already has an active session and confirmed email. Cannot prevent fake-email signup, cannot prevent account-spam.

**Fix:** set `email_confirm: false`, gate `requireAuth` (or feature access) on `user.email_confirmed_at`, redirect unverified users to "check your inbox" screen. Or remove the verification flow entirely if the product doesn't need it.

### D2. No rate limit on `/reset-password` or `/verify-email` — **P1**
Tokens are 64 hex chars (32 bytes) so brute-force is not realistic, but lack of rate limit means an attacker can flood the endpoint and DoS DB lookups. Add `forgotPasswordLimiter` (or equivalent per-IP) to both.

### D3. `forgot-password` does `listUsers()` → fetches every user — **P2 (perf, not security)**
`routes/auth.js:102`. Acceptable at 6 users; will blow up at 10k+. Replace with admin filter API or query `auth.users` directly.

### D4. Password reset token lifecycle — **OK**
1h expiry ✓, deleted after successful use ✓, single-use enforced by upsert ✓.

### D5. Password validation — **OK**
8+ chars, requires upper, lower, digit. Could add HaveIBeenPwned (see A2).

---

## E. Rate limit audit

### E1. Coverage — **mostly OK**
`middleware/rateLimit.js` exports `authLimiter` (10/min IP), `registerLimiter` (5/hr IP), `forgotPasswordLimiter` (3/hr IP), `aiLimiter` (20/hr user-or-IP), `aiStrictLimiter` (10/hr user-or-IP), `reportLimiter` (10/hr user), `waitlistLimiter` (20/hr IP). All AI endpoints in `exercises.js` + `writing.js` use `aiLimiter`/`aiStrictLimiter`. Sliding-window via `rate_limit_buckets` in prod, in-memory in dev.

### E2. Fail-open on DB error — **P2**
`rateLimit.js:36-40, 113-117`. If Supabase is unreachable, all requests pass. Acceptable trade-off (don't lock out users during incident) but means an attacker who knocks out the DB temporarily can spam AI calls. Combine with E3 below.

### E3. `aiLimiter` missing on optional-auth AI routes — **see F2**
Tracked under cost-cap bypass below.

### E4. Global kill-switch — **OK**
`lib/featureFlags.js isOpenAIDisabled()` exists (exam-week kill). All `callOpenAI` calls honor it. Good.

---

## F. OpenAI budget

### F1. Per-user monthly cap — **OK**
`middleware/costLimit.js` + `lib/aiCost.js`. Free $0.50/mo, Pro $5/mo. Token usage logged to `ai_usage`. Cost computed per gpt-4o-mini pricing.

### F2. Cost-cap bypass on several AI endpoints — **P1**
`checkMonthlyCostLimit` is applied across `routes/exercises.js` (every endpoint) and `routes/writing.js`. NOT applied on:
- `routes/adaptive.js:129` `/adaptive/mastery-test/start` → `callOpenAI(prompt, 3000)`. `requireAuth + aiLimiter` only. Capped at 20/hr, but unmetered against $-cap.
- `routes/curriculum.js:499` teaching-page AI → mounted under `optionalAuth` so an UNAUTHENTICATED visitor can trigger it. `callOpenAI(prompt, maxTok)`. **Potentially P0** depending on how aggressively the path is reachable; needs spot-check.
- `routes/curriculum.js:853` tutor-message inside `/complete` (`requireAuth` only).
- `routes/curriculum.js:1029` `/tutor-message` GET — `optionalAuth`, no rate limit, no cost cap, `callOpenAI(aiPrompt, 80)`. Cheap per call but unmetered + unauth = stranger can burn quota.

**Fix:** add `aiLimiter + checkMonthlyCostLimit` to every `callOpenAI` callsite; for `optionalAuth` routes, either tighten to `requireAuth` or fall back to anon IP rate-limit + a per-IP daily cap.

### F3. No global monthly $-cap — **P1**
Per-user caps exist. No "if total this month > $X, return 429" envelope. One compromised pro account at $5/mo isn't catastrophic, but a leaked OpenAI key or runaway loop is. Add a global cap (env-configurable) read inside `checkMonthlyCostLimit`.

### F4. Token logging — **OK**
`logAiUsage` writes `(user_id, endpoint, input_tokens, output_tokens, cost_usd, created_at)` to `ai_usage`. RLS allows users to SELECT their own; service-role writes.

---

## G. PII in logs

`console.log/error/warn` grep across `routes/`, `middleware/`, `lib/`, `api/` (n ≈ 110 calls).

### G1. Generally OK ✅
Most log only `err.message` or generic strings (`"Mistake error:"`, `"[stripe] webhook signature verification failed:"`). No password, no JWT, no studentText logged routinely.

### G2. Email leaked to logs — **P2**
- `routes/email.js:141` `console.error("Streak reminder failed for", user.email, err)` — logs email in Vercel logs.
- `routes/onboarding.js:80, 113, 154` could surface email indirectly through error context.

**Fix:** hash or truncate email before logging (e.g. `user.email.slice(0,3) + "***"`).

### G3. Full error object dump on writing routes — **P2**
- `routes/writing.js:110, 158` — `console.error(err)` (raw err). If the OpenAI call throws after constructing a prompt that includes `studentText`, the err stack may surface text. Low likelihood (errors are timeout/HTTP, not prompt-bound), but switch to `console.error(err.message)` for consistency.

### G4. Placement / profile detailed error logs — **OK risk-wise, noisy**
`routes/placement.js:133-189` logs `{ user_id, mode, code, message }`. user_id is UUID, no name/email. Acceptable.

### G5. Vercel logs are not a GDPR store
PII (email) appearing in logs creates a retention obligation. Move to structured Sentry events with PII-scrubbing, or stop logging email at all.

---

## H. `.env` + git history — **CLEAN ✅**

- `.gitignore` includes `.env`, `.env.local`, `.env.*.local`, `.env.production`, `.env.development`, `*.pem`, `*.key`.
- `git log --all --diff-filter=A --name-only | grep .env` → only `.env.example` ever added (no secrets in it; confirmed it's referenced as "example" in commit messages).
- `git log -p --all -- .env .env.local .env.production .env.development` → empty.

No rotation needed.

---

## I. `npm audit` — **mixed**

10 vulnerabilities total (2 high, 4 moderate visible in first 300 lines; full run truncated). Breakdown:

### I1. Production-runtime — **P1**
- `express-rate-limit` 8.0.1-8.5.0 → via `ip-address` XSS (CVE GHSA-v2v4-37r5-5v8g, moderate). Direct dep. `npm audit fix` available. **Fix.**
- `brace-expansion` 5.0.2-5.0.5 → DoS (moderate). Transitive; `npm audit fix` resolves.

### I2. Dev-only — **P2**
- `pa11y-ci` → `lodash` Code Injection / Prototype Pollution (high). Dev/CI only, no prod exposure. Schedule upgrade.
- `@protobufjs/utf8`, `protobufjs` <=7.5.5 (high, multiple CVEs) — transitive via dev tooling (likely `@google-cloud/*` or similar). Verify not in prod bundle, then dev-only fix.
- `basic-ftp` <=5.3.0 high — transitive, likely dev only.

**Action:** run `npm audit fix` (non-breaking) + audit which deps are in `dependencies` vs `devDependencies` to confirm classification.

---

## J. GDPR — user deletion — **P1 (blocker for public launch)**

No `DELETE /me` or equivalent. Only sub-resource deletes exist:
- `routes/digikirja.js:66` `DELETE /itsearvio`
- `routes/digikirja.js:173` `DELETE /progress`

`auth.users` has cascading deletes for several tables via FK, but not all `user_id` columns are FK-constrained (e.g. `exercise_logs`, `ai_usage`, `user_mistakes`). Manual cascade required.

**Fix:** add `DELETE /api/auth/me` that:
1. Authenticates current user.
2. Deletes from `user_profile`, `user_level`, `user_curriculum_progress`, `exam_sessions`, `sr_cards`, `ai_usage`, `exercise_logs`, `user_mistakes`, `user_session_state`, `user_lesson_progress`, `user_self_assessments`, `user_mastery`, `seen_exercises`, `seen_seed_items`, `hint_events`, `free_usage`, `push_subscriptions`, `email_preferences`, `password_resets`, `email_verifications`, `subscriptions`.
3. Calls `supabase.auth.admin.deleteUser(userId)`.
4. Triggers Stripe cancel-subscription on `stripe_customer_id` if present.

Add Playwright test that creates a user, completes a lesson, deletes account, then verifies all rows gone + login fails.

---

## K. Backup — **P1 (unknown / probably none)**

`list_projects` reports project `teovmfkoebnghqmbtycj` on EU-Central-1, status `ACTIVE_HEALTHY`, Postgres 17.6. **Tier not visible from MCP** — free-tier projects do NOT have PITR; daily snapshots only on paid tiers.

No backup script in `scripts/` ships SQL dumps to S3. No cron in `routes/`.

**Action:**
1. Verify Supabase tier via dashboard. If free → upgrade or accept loss-window risk.
2. Add a daily `pg_dump` GitHub Action that writes to a private S3-compatible bucket (R2/Backblaze).

---

## Triage summary

### P0 — fix before anything else
- **C1** CORS wildcard fallback if `ALLOWED_ORIGINS` empty in prod. Verify env first; if unset → real P0, if set → demote to P2 (fix default).
- **F2 (partial)** `/api/curriculum/.../tutor-message` is `optionalAuth` + unmetered AI. Unauthenticated stranger can burn OpenAI quota. Verify reachability; if exposed → P0.

### P1 — fix before public launch (this audit's recommended fix order)
1. **A1** Rewrite `USING(true)` policies to explicit `service_role`-only on `password_resets`, `email_verifications`, `waitlist`, `stripe_events`, `ai_cache`, `rate_limit_buckets`. Migration via MCP `apply_migration`.
2. **F2 / F3** Add `aiLimiter + checkMonthlyCostLimit` to all `callOpenAI` callsites in `adaptive.js` and `curriculum.js`. Add global monthly $-envelope.
3. **D1** Disable `email_confirm: true` on register; gate features on `email_confirmed_at`. Or remove verification flow.
4. **D2** Rate-limit `/reset-password` and `/verify-email`.
5. **I1** `npm audit fix` for `express-rate-limit` + `brace-expansion`.
6. **J** Implement `DELETE /api/auth/me` with full cascade + Playwright regression.
7. **K** Verify Supabase tier; set up backup if absent.

### P2 — schedule, don't block
- **A2** Enable HaveIBeenPwned in Supabase dashboard.
- **A3** Rewrite `auth.uid() = user_id` → `(SELECT auth.uid()) = user_id` in 4 policies.
- **A4** Add covering indexes for 2 unindexed FKs.
- **A5** Spot-check for `user_profile` orphans after J ships.
- **D3** Replace `listUsers()` with filtered query in forgot-password.
- **E2** Document fail-open behavior; consider stricter mode under attack.
- **G2 / G3 / G5** Strip email + raw err from logs; PII-scrub Sentry.
- **I2** Schedule dev-dep upgrades (`pa11y-ci`, protobufjs transitives).

---

## Recommended Phase-3 ordering

If user approves the full P0+P1 list, the planning brief should produce ~7 commits (one per P0/P1 numbered item). Each commit must ship with:
- Vitest unit OR Playwright regression that proves the bug existed and is now fixed.
- `npm test` + `npm audit` clean.
- Migrations via Supabase MCP `apply_migration` (no SQL-editor-to-user handoff).

P1 items D1 + J are independently testable end-to-end via the existing testpro123 account. P0 items C1 + F2 need a prod-env spot-check (Vercel MCP or user-confirmation) to determine real severity before the fix-or-document call.
