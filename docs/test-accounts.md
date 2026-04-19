# Test accounts

Puheo flips a user's billing tier for demo/dev purposes via a **committed
JSON file** (`data/test-accounts.json`). Optional Vercel env vars are still
accepted as overrides, but the file is the primary source — it always reaches
runtime, avoiding a Vercel env-var bug we hit on 2026-04-19 where
`TEST_PRO_EMAILS` was set in the dashboard but never propagated to the
serverless function.

The logic lives in [middleware/auth.js](../middleware/auth.js#L20). On every
`isPro()` call we union:

1. `always_pro` / `always_free` lists from `data/test-accounts.json`.
2. `PRO_TEST_LIST` / `TEST_PRO_EMAILS` env vars (comma-separated).
3. `FREE_TEST_LIST` / `TEST_FREE_EMAILS` env vars (comma-separated).

Emails are matched case-insensitively and whitespace-trimmed.

Do **not** flip `subscriptions.active` directly and do not seed a fake Pro
row in the database.

---

## Adding a Pro test account

### 1. Create the account manually via the live signup flow

On the deployed site:

1. Open `/app.html?mode=register` (or click "Rekisteröidy" on the login screen).
2. Register with any email + password you want to remember.
3. Complete the onboarding wizard so `user_profile` gets populated.

Do **not** create the account via SQL or a seed script — the signup route
writes the bcrypt hash, `user_profile` row, and any side-effect rows the
rest of the app expects.

### 2. Add the email to `data/test-accounts.json`

```json
{
  "always_pro": [
    "testpro123@gmail.com",
    "your-new-test@example.com"
  ],
  "always_free": []
}
```

Commit + push to `main`. Vercel redeploys automatically.

### 3. Verify Pro is active

Log in as the test account. Check:

- Dashboard sidebar shows a **PRO** badge (not "Päivitä Pro").
- `GET /api/dashboard` response has `"pro": true` (inspect in DevTools → Network).
- Kirjoittaminen → AI grading returns a full feedback response (not 403).
- Koeharjoitus → täyskoe starts without a paywall modal.

If Pro still doesn't activate:

1. Confirm the deploy that went live matches the commit that added the email
   (DevTools → Network → `/api/health` response has `env: true`; check
   Vercel Deployments for the commit SHA).
2. Hard-reload the browser (Service Worker may cache client state).
3. The email in the file must match exactly what Supabase stores. Supabase
   lowercases emails on signup, and the file loader lowercases too — so
   case mismatches should not be a real risk, but whitespace or accidental
   Unicode (e.g. a smart-quote) will break the match.

---

## Removing Pro status later

1. Delete the email line from `data/test-accounts.json`.
2. Commit + push. Vercel redeploys.
3. The account is now a normal free user. Its exercise history and profile
   are preserved; only the Pro flag changes.

To **delete** the account entirely, use the Supabase dashboard → Authentication
→ Users. Deleting the `auth.users` row cascades to `user_profile`,
`exercise_logs`, etc. via foreign keys.

---

## Why file-based instead of env vars?

Shorter answer: Vercel's env injection is unreliable for some variable name
patterns. On 2026-04-19 we observed:

- `TEST_PRO_EMAILS` added in Vercel dashboard (Production + Preview, not
  Sensitive, correct value visible in the UI) — **did not reach** the
  serverless function at runtime (confirmed via a debug endpoint probing
  `process.env`).
- Other env vars in the same project (`SUPABASE_URL`, `OPENAI_API_KEY`,
  `VERCEL_*`) reached runtime fine.
- Renaming to `PRO_TEST_LIST` (no "EMAIL" substring), fresh git-push-driven
  builds, and build-cache-off redeploys all failed to surface the variable.
- `totalEnvKeys: 55` reached the function, but neither `TEST_*` nor
  `PRO_TEST_*` appeared in that set.

Rather than spend more time pinning down the Vercel-specific cause, we
moved the allowlist into a committed JSON file that is always in the
function bundle (`vercel.json` → `includeFiles`). The env-var path remains
wired up as an optional override for ops convenience; if env injection
starts working reliably for you, you can use either mechanism.

---

## Env-var overrides (optional)

If you prefer env vars (e.g. for per-environment differences), set one or
both of:

- `PRO_TEST_LIST` = `email1@example.com,email2@example.com`
- `TEST_PRO_EMAILS` = same format (legacy name, still accepted)

Or for free overrides: `FREE_TEST_LIST` / `TEST_FREE_EMAILS`.

The file and env lists are unioned — an email in either counts.
