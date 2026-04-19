# Test accounts (TEST_PRO_EMAILS / TEST_FREE_EMAILS)

Puheo uses two comma-separated env vars to flip a user's billing tier without
touching the database. This is the **only** supported way to give a developer
or demo account Pro access — do not edit `subscriptions.active` directly and
do not seed a fake Pro row.

- `TEST_PRO_EMAILS` — any listed email is treated as Pro by `middleware/auth.js`.
- `TEST_FREE_EMAILS` — any listed email is forced to the free tier, overriding
  a real Pro subscription. Useful for testing paywall copy.

The check lives in [middleware/auth.js:17–18](../middleware/auth.js#L17) and
runs on every request that hits `isPro()` (including `requirePro`,
`softProGate`, dashboard Pro-badge). The match is case-insensitive and
whitespace-trimmed.

---

## Creating `testpro123@gmail.com` as the standard Pro test account

### 1. Create the account manually via the live signup flow

On the deployed site:

1. Open `/app.html?mode=register` (or click "Rekisteröidy" on the login screen).
2. Register with:
   - Email: `testpro123@gmail.com`
   - Password: `Testpro123`
3. Complete the onboarding wizard so `user_profile` gets populated.

Do **not** create the account via a SQL insert or a seed script — the signup
route writes the bcrypt hash, `user_profile` row, and any side-effect rows
(e.g. `user_level`, mastery scaffolding) that the rest of the app expects.
A hand-rolled row will be missing those.

### 2. Add the email to `TEST_PRO_EMAILS` in Vercel

Vercel dashboard → project → **Settings** → **Environment Variables**.

Find `TEST_PRO_EMAILS`. If empty, set it to:

```
testpro123@gmail.com
```

If it already has values, comma-append:

```
someoneelse@example.com,testpro123@gmail.com
```

**Apply the change to all three environments** — Production, Preview,
Development — so the account works in local dev, branch previews, and prod.

### 3. Redeploy

Vercel env-var changes do **not** take effect on existing deployments.
Either:

- Trigger a redeploy from the Deployments tab (⋯ menu → Redeploy), or
- Push any commit to `main` to rebuild Production.

### 4. Verify Pro is active

Log in as `testpro123@gmail.com`. Check:

- Dashboard shows the `PRO` badge (not a "Päivitä Pro" button).
- `/app.html` → Kirjoittaminen → AI grading returns a full writing feedback
  response (403 `pro_required` means Pro is NOT active).
- `/app.html` → Koeharjoitus → täyskoe starts without a paywall modal.
- No rate-limit error on repeated `/api/generate` calls (free tier has a
  tighter daily cap).

If any of those gate the user out, the env var is wrong — double-check that
you redeployed after the env change (the most common miss).

---

## Removing Pro status later

1. Edit `TEST_PRO_EMAILS` in Vercel → remove the email.
2. Redeploy.
3. The account is now a normal free user. Its exercise history and profile
   are preserved; only the Pro flag changes.

To **delete** the account entirely, use the Supabase dashboard → Authentication
→ Users. Deleting the `auth.users` row cascades to `user_profile`,
`exercise_logs`, etc. via the foreign keys defined in `migrations/001_full_setup.sql`.

---

## Why not flip `subscriptions.active` instead?

Three reasons the env-var pattern is the standard:

1. **Reversibility.** Env-var change + redeploy is faster and less risky than
   a DB write, especially under prod Supabase row-level security rules.
2. **No drift.** The test account can't accidentally be billed — it has no
   Stripe/LemonSqueezy customer ID at all.
3. **Shareable without leaking creds.** This doc commits the convention; the
   actual email and password stay in Vercel env + 1Password.

If you catch yourself about to write a migration to grant Pro, stop and
update the env var instead.
