// @vitest-environment node
//
// RLS lockdown regression test.
//
// Verifies that the tables locked in v260/v261/v262 cannot be read by
// an anon-role client (which is what the publishable key + Data API
// give to anyone on the internet). If a future migration drops or
// loosens the deny policy, these tests catch it before the lint shows
// up in `get_advisors`.
//
// The test hits real Supabase using the env-injected credentials. It
// is skipped when the credentials aren't present, so CI without
// secrets still passes.

import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.SUPABASE_URL;
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const skipIfNoEnv = !url || !publishableKey || !serviceRoleKey;

const lockedTables = [
  "password_resets",
  "email_verifications",
  "ai_cache",
  "rate_limit_buckets",
  "stripe_events",
];

describe.skipIf(skipIfNoEnv)("RLS lockdown — anon cannot read locked tables", () => {
  const anon = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const table of lockedTables) {
    it(`anon SELECT on ${table} returns zero rows`, async () => {
      const { data } = await anon.from(table).select("*").limit(10);
      // RLS deny manifests as empty result (PostgREST returns [] for
      // filtered-out rows rather than an error). The invariant is
      // "anon sees no rows".
      const rowsSeen = Array.isArray(data) ? data.length : 0;
      expect(rowsSeen).toBe(0);
    });
  }
});

describe.skipIf(skipIfNoEnv)("RLS lockdown — service_role still has access", () => {
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const table of lockedTables) {
    it(`service_role SELECT on ${table} succeeds`, async () => {
      const { error } = await admin.from(table).select("*").limit(1);
      expect(error).toBeNull();
    });
  }
});

describe.skipIf(skipIfNoEnv)("waitlist — anon INSERT only", () => {
  const anon = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  it("anon cannot SELECT from waitlist", async () => {
    const { data } = await anon.from("waitlist").select("*").limit(10);
    const rowsSeen = Array.isArray(data) ? data.length : 0;
    expect(rowsSeen).toBe(0);
  });

  it("anon CAN INSERT a valid signup", async () => {
    const testEmail = `rls-lockdown-test-${Date.now()}@example.com`;
    const { error } = await anon.from("waitlist").insert({
      email: testEmail,
      product: "puheo-test",
    });
    expect(error).toBeNull();
    // Cleanup
    await admin.from("waitlist").delete().eq("email", testEmail);
  });

  it("anon INSERT with invalid email is rejected by the policy", async () => {
    const { error } = await anon.from("waitlist").insert({
      email: "no-at-sign",
      product: "puheo",
    });
    expect(error).not.toBeNull();
  });
});
