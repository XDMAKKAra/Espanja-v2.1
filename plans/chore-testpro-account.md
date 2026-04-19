# Chore — Set up testpro123@gmail.com as a Pro test account

You are working in `C:\Users\marce\OneDrive\Documents\espanja paska\`. This is a small chore, not a pass. No branch, no gates, single commit if any.

## What marcel wants

An account with:
- Email: `testpro123@gmail.com`
- Password: `Testpro123`

...that is treated as Pro automatically when logged in, without any payment flowing.

## How the system already works

Look at `middleware/auth.js:17`:

```js
const ALWAYS_PRO_EMAILS = (process.env.TEST_PRO_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
```

Any email listed in the `TEST_PRO_EMAILS` environment variable (comma-separated) is automatically treated as Pro by the auth middleware. **No code changes needed** to give `testpro123@gmail.com` Pro status — just add it to the env var.

## What you need to do

1. **Do NOT create the account from code.** marcel creates it manually via the signup flow on the live site so the `user_profile` + `auth.users` rows exist properly with a real bcrypt password hash.

2. **Update `.env.example`** to document this test account clearly. Find the line `TEST_PRO_EMAILS=` and change the comment above it (or add one) so future-marcel-or-claude-code remembers the convention:

```
# Comma-separated list of emails that bypass paywall checks and are always Pro.
# Use for dev testing and demos. Example: testpro123@gmail.com,other@test.com
TEST_PRO_EMAILS=
```

Do NOT put the real test email in `.env.example` — keep that file free of actual values, only placeholders and docs.

3. **Write marcel step-by-step instructions** in a new file `docs/test-accounts.md` covering:
   - How to create the test account on the live site (signup flow).
   - Where to add the email in Vercel dashboard (Settings → Environment Variables → TEST_PRO_EMAILS).
   - That all three environments (Production, Preview, Development) need the value.
   - That Vercel requires a redeploy for env changes to take effect.
   - How to verify: log in as testpro123@gmail.com, open the app, verify Pro-only features (writing AI grading, unlimited exercises, exam simulator) are unlocked.
   - How to remove the account's Pro status later (remove from env var + redeploy).

4. **One commit, straight to main:** `chore(docs): document TEST_PRO_EMAILS convention + test account setup`.

## What NOT to do

- Don't hardcode the test email anywhere in the source.
- Don't write a migration that flips `is_pro = true` in Supabase — that defeats the purpose of the env-var pattern.
- Don't touch `middleware/auth.js` — the logic is already correct.
- Don't write a seeding script that creates the account automatically — marcel needs to do the signup manually so the auth flow is exercised end-to-end.

## Done

- `.env.example` has a clear comment explaining TEST_PRO_EMAILS.
- `docs/test-accounts.md` exists with step-by-step setup.
- One commit merged.
