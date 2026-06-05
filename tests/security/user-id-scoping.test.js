// L-V392 P1-3 guardrail. Static scan: every query against a user-owned table in
// routes/ must scope to the caller — either an explicit .eq("user_id", ...) (or
// .eq("id", ...) on a row already fetched under a user_id filter) within the
// query chain, OR sit in a file that routes user data through the per-request
// RLS client (req.supabase). Catches a dropped user_id filter before it ships.
//
// This is a guardrail, not a substitute for RLS — see tests/verify-rls-net.mjs
// (live proof that RLS scopes the client even with no app filter).
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES_DIR = resolve(__dirname, "..", "..", "routes");

// Tables whose rows belong to a single user and must never be returned across users.
const USER_OWNED = [
  "exercise_logs", "user_mistakes", "user_mastery", "user_level", "diagnostic_results",
  "exam_sessions", "email_preferences", "user_curriculum_progress", "user_self_assessments",
  "user_lesson_progress", "user_onboarding_diagnostic", "mini_yo_progress", "sr_cards",
  "push_subscriptions", "free_usage", "seen_seed_items", "seen_exercises",
  "user_session_state", "hint_events", "user_profile",
];

// A query is considered user-scoped if any `user_id` reference appears in the
// query chain — covers .eq("user_id"), an upsert payload `{ user_id: ... }`,
// onConflict: "user_id,...", or .eq("id", <row fetched under user_id>). This is
// a coarse net for the gross "forgot to scope entirely" case; RLS (verify-rls-net)
// is the real guarantee.
const SCOPE_SIGNAL = "user_id";

// Server-trust / cron / webhook / health files: not per-user-request scoped by
// design (Stripe webhook keys on stripe_customer_id, status is a head-count ping,
// email/gdpr act across users via the admin client). Audited separately in L-V392.
const ADMIN_FILES = new Set(["stripe.js", "status.js", "email.js", "gdpr.js", "config.js"]);

function routeFiles() {
  return readdirSync(ROUTES_DIR)
    .filter((f) => f.endsWith(".js") && !ADMIN_FILES.has(f))
    .map((f) => join(ROUTES_DIR, f));
}

describe("L-V392 P1-3 — user-owned tables are user-scoped in every route", () => {
  const offenders = [];
  for (const file of routeFiles()) {
    const src = readFileSync(file, "utf8");
    for (const table of USER_OWNED) {
      const needle = `.from("${table}")`;
      let idx = src.indexOf(needle);
      while (idx !== -1) {
        // Look at the query chain following the .from( call.
        const window = src.slice(idx, idx + 600);
        // `RLS-OK` is an explicit, documented exemption for a query scoped by a
        // pre-authorized id (a row already fetched under user_id) or a globally
        // unique key — and still RLS-guarded. Look just before the .from() too.
        const around = src.slice(Math.max(0, idx - 400), idx + 600);
        const scoped = window.includes(SCOPE_SIGNAL) || around.includes("RLS-OK");
        if (!scoped) {
          const line = src.slice(0, idx).split("\n").length;
          offenders.push(`${file.split(/[\\/]/).pop()}:${line} .from("${table}") not user-scoped`);
        }
        idx = src.indexOf(needle, idx + 1);
      }
    }
  }

  it("has no unscoped user-owned-table query", () => {
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
