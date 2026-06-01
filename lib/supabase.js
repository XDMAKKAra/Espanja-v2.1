// lib/supabase.js — explicit Supabase clients.
//
// adminClient
//   Service-role client. Bypasses RLS. Use for:
//     - Webhooks (Stripe events)
//     - Cron jobs
//     - Cross-user admin work (listUsers, getUserById, password reset
//       token lookup by token, etc.)
//     - Backend-internal tables (ai_cache, rate_limit_buckets,
//       stripe_events, password_resets, email_verifications)
//
// createUserClient(jwt)
//   Per-request user-scoped client. RLS enforces user isolation. Use
//   for user-data queries inside authenticated routes so RLS catches
//   accidental missing `.eq("user_id", userId)` filters as a safety
//   net. Falls back to adminClient when SUPABASE_PUBLISHABLE_KEY (or
//   SUPABASE_ANON_KEY) is not set so dev/test environments still work.
//
// Both clients are configured with autoRefreshToken/persistSession off
// because this is the server — no browser session to manage.

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  null;

// Match supabase.js's original null-check: build the client whenever
// SUPABASE_URL is set, even if the service-role key isn't (some test
// environments expose only the URL and rely on mocks for query results).
export const adminClient = url
  ? createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// authClient — dedicated client for password/session operations
// (signInWithPassword, refreshSession). MUST be a separate instance from
// adminClient. supabase-js stores the signed-in session ON THE CLIENT and then
// sends THAT user's access_token as the PostgREST Authorization header,
// silently demoting the client from service-role to the last-logged-in user
// (persistSession:false only disables disk storage, not the in-memory
// session). If sign-in ran on adminClient, every later adminClient data query
// would execute as whoever logged in most recently, RLS-scoped — a cross-user
// data bleed under concurrency (two users sharing one warm serverless
// instance). This client is never used for data queries, so its session being
// overwritten by a concurrent login is harmless: callers read the session
// straight from the signIn/refresh return value, never from client state.
export const authClient = url
  ? createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export function createUserClient(jwt) {
  if (!url || !publishableKey) return adminClient;
  if (!jwt) return adminClient;
  return createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}
