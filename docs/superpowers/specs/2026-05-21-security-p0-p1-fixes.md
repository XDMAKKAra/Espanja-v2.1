# Security P0/P1 fixes — 2026-05-21

## Background

Two findings from the security audit:

1. **Supabase advisor (security):** six tables in `public` have RLS policies that evaluate `USING (true) WITH CHECK (true)` for `ALL` commands. Anon/authenticated roles (anyone with the publishable key) can read/write these tables through the Data API.
   - `password_resets` — active reset tokens (compromise = vault-of-passwords)
   - `email_verifications` — verification tokens
   - `ai_cache` — backend-internal cache
   - `rate_limit_buckets` — backend-internal counters
   - `stripe_events` — webhook idempotency log
   - `waitlist` — public form; needs anon INSERT but no read

   Plus one auth-config warning: leaked-password-protection is disabled. Dashboard toggle only — no code/MCP fix.

2. **npm audit (production deps):** 6 vulnerabilities (5 moderate + 1 high). All fixable via `npm audit fix`.
   - `protobufjs` (high — code injection / DoS)
   - `ws` (moderate — uninitialized memory disclosure)
   - `ip-address` (moderate, via `express-rate-limit`)
   - `brace-expansion`, `@protobufjs/utf8` (moderate)

## Correction to brief framing

The original brief framed the singleton `supabase.js` import in `middleware/auth.js` as a "JWT-leak vector" caused by session sharing across concurrent requests. Reading the code, that framing is technically incorrect:

- `supabase.js` builds its client with `SUPABASE_SERVICE_ROLE_KEY` and `persistSession: false`.
- `supabase.auth.getUser(jwt)` is a stateless RPC — it takes the JWT as an argument and returns the decoded user; no session is stored on the client object.
- `supabase.auth.admin.getUserById(userId)` is likewise stateless.

So the singleton cannot leak per-user JWT state because it stores no per-user state. What *can* go wrong is a developer forgetting `.eq("user_id", userId)` on a query — at which point service-role bypasses RLS and returns every user's rows. That's a real defense-in-depth concern but a different threat than the brief described.

The middleware refactor (P0.1) is therefore re-scoped from "fix critical JWT-leak vector" → "add per-request user-scoped Supabase client so RLS catches accidental missing `user_id` filters as a safety net." Same code change, accurate motivation.

## Scope

### P0 — actually critical (this loop)
- **P0.A** Lock RLS on `password_resets` (anon can currently read every active reset token).
- **P0.B** Lock RLS on `email_verifications` (anon can currently read every active verification token).

### P1 — strongly recommended (this loop)
- **P1.A** Lock RLS on `ai_cache`, `rate_limit_buckets`, `stripe_events`. Backend-internal; anon/authenticated have no business reading them.
- **P1.B** Narrow RLS on `waitlist` to anon-INSERT-only (frontend posts here; nobody should be able to enumerate the list).
- **P1.C** `npm audit fix --omit=dev`. Verify build + tests still pass.
- **P1.D** Defense-in-depth: add `lib/supabase.js` with `createUserClient(jwt)` + `adminClient`. Refactor `middleware/auth.js` so `requireAuth` attaches `req.supabase = createUserClient(jwt)` and routes can opt into RLS-enforced queries. Migrate route files away from the singleton; remove the default export.

### P1.E — non-code, must hand off
- Enable "Leaked password protection" in Supabase Auth dashboard.
  https://supabase.com/dashboard/project/teovmfkoebnghqmbtycj/auth/policies

## Migration design

### `password_resets` and `email_verifications` (P0.A, P0.B)

Drop the permissive `*_all` policy. Replace with a deny-all policy for `anon, authenticated`. Service-role bypasses RLS by default (no policy needed for it). Backend code in `routes/auth.js` already uses the service-role singleton for these tables, so functionally nothing changes for the server. The Data API stops being a token vault.

```sql
DROP POLICY IF EXISTS password_resets_all ON public.password_resets;
CREATE POLICY password_resets_deny_all ON public.password_resets
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
```

Identical pattern for `email_verifications`.

### `ai_cache`, `rate_limit_buckets`, `stripe_events` (P1.A)

Same deny-all pattern. All three are backend-internal; service-role writes/reads them.

### `waitlist` (P1.B)

Drop `waitlist_all`. Add anon-INSERT-only (the landing form posts here as anon; that has to keep working). No SELECT/UPDATE/DELETE for anon. Service-role bypasses RLS for admin reads.

```sql
DROP POLICY IF EXISTS waitlist_all ON public.waitlist;
CREATE POLICY waitlist_anon_insert ON public.waitlist
  FOR INSERT TO anon WITH CHECK (true);
```

## Code-side changes

### `lib/supabase.js` (new)

```js
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;

export const adminClient = url
  ? createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const publishable =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

export function createUserClient(jwt) {
  if (!url || !publishable) return adminClient;
  return createClient(url, publishable, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}
```

### `middleware/auth.js` refactor

- Import `{ adminClient, createUserClient }` from `lib/supabase.js`.
- `requireAuth` validates JWT via `adminClient.auth.getUser(jwt)`, then attaches `req.supabase = createUserClient(jwt)` and `req.adminClient = adminClient` for explicit admin work.
- Helpers (`isPro`, `getUserTier`, `getFreeUsage`, `incrementFreeUsage`, `incrementReadingPieces`, `softReadingGate`, `isTestProEmail`) keep their existing signatures and use `adminClient` directly. They cross user boundaries (lookup by userId, listUsers, etc.), so RLS is not the right tool here.
- `softProGate` validates via `adminClient` and also attaches `req.supabase`.

### `middleware/rateLimit.js` refactor

`rate_limit_buckets` is backend-internal. Switch to `adminClient`.

### Routes / lib / server (~24 files): DEFERRED to follow-up loop

Attempted import-alias sweep (`import { adminClient as supabase } from "../lib/supabase.js"`). It parsed but broke 86 vitest tests across 13 files because mocks target `"../supabase.js"` and vitest resolves mocks per module path — the refactored code's `"../lib/supabase.js"` resolves to a different module and is not intercepted.

Updating the 18 affected test mocks is a meaningful refactor on its own (different mock shapes, mock factory bodies that include logic, dynamic `const { default: router } = await import(...)` destructures that would collide with a naive rename). To keep this loop honest, the sweep is deferred.

**This loop ships:**
- `supabase.js` becomes a thin re-export of `lib/supabase.js`. The default export still resolves to `adminClient`. Named exports `adminClient` and `createUserClient` are forwarded.
- `middleware/auth.js` and `middleware/rateLimit.js` import named exports from the compat path `../supabase.js`. Only `tests/middleware-auth.test.js` was updated to add `adminClient` + `createUserClient` alongside `default` in its mock factory return.
- All 24 other source files unchanged — their `import supabase from "../supabase.js"` keeps working but now resolves to `adminClient` re-exported from `lib/supabase.js`. No service-role client is constructed directly in `supabase.js` anymore.

**Follow-up loop scope:** migrate the 24 remaining callers to `import { adminClient } from "../lib/supabase.js"` (or to `req.supabase` where user-scoped); update all 18 test mocks; delete `supabase.js`. Estimated 3–5 hours; needs its own loop because the bulk of the work is test infrastructure, not security.

### `supabase.js` default export removal: DEFERRED (same reason)

## Regression tests

### vitest — `tests/security/rls-lockdown.test.js`

For each locked table:
1. Construct an anon client (publishable key, no JWT). Try `SELECT *` → expect 0 rows (or a permission error). Try `INSERT` → expect failure (except waitlist, where INSERT should succeed).
2. Construct an admin client (service-role). Try `SELECT *` → expect success.

### vitest — `tests/security/cross-user-isolation.test.js`

Mocked at the route level: prove that helper functions (`isPro`, `getFreeUsage`, etc.) called with userA's id never read userB's row. This tests the existing contract, not the new client architecture, and catches regressions if someone removes a `.eq("user_id", ...)` filter.

### Playwright — `tests/playwright/cross-user.spec.js`

Out of scope for this loop unless a second real test account is provisioned. The brief asked for `testpro_other@gmail.com`. Creating a real Supabase auth user from this loop is possible via `adminClient.auth.admin.createUser`, but the user has not confirmed they want a second long-lived test account. Note in handoff; defer.

## Commit plan

| Commit | What |
|---|---|
| v260 | Migration: harden_password_resets_rls (MCP) |
| v261 | Migration: harden_email_verifications_rls (MCP) |
| v262 | Migrations: ai_cache + rate_limit_buckets + stripe_events + waitlist (MCP, 4 in one commit) |
| v263 | `lib/supabase.js` with `adminClient` + `createUserClient` |
| v264 | `middleware/auth.js` — `req.supabase` attached, helpers use `adminClient` |
| v265 | `middleware/rateLimit.js` — `adminClient` |
| v266 | `routes/*.js` sweep + lib internal files: `supabase` → `adminClient` |
| v267 | Delete `supabase.js` default export; verify `grep "import supabase from" = 0` |
| v268 | Regression tests (RLS lockdown + cross-user isolation) |
| v269 | `npm audit fix --omit=dev` + final verification |

Per-commit gate: `npm test` passes, `node --check` on every edited file, migrations show advisor delta.

## Out-of-scope (handoff)

- Enable leaked-password-protection in Supabase dashboard (link above).
- Optional follow-up loop: migrate user-scoped route queries from `adminClient` to `req.supabase` so RLS catches missing `user_id` filters as a safety net. Needs its own spec because it touches every user-data route.
- Provision a second long-lived test account if real-browser cross-user Playwright coverage is wanted.
