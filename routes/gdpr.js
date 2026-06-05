// GDPR rights endpoints — data export (Art. 20) and account deletion (Art. 17).
//
// Both routes are auth-gated and act ONLY on req.user.userId. There is no
// caller-supplied target id, so a user can never reach another user's data:
// isolation is structural, not RLS-policy-dependent. We use adminClient
// (service role) because deletion spans ~20 tables and must succeed even where
// a per-user DELETE policy doesn't exist.

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { adminClient } from "../supabase.js";

const router = express.Router();

// Tables that store data keyed by the user's id. Resolved DYNAMICALLY from the
// live schema (any public table with a `user_id` column) via the
// list_user_owned_tables() RPC, so this never drifts when a new user table is
// added — a silent GDPR gap otherwise. FALLBACK_USER_TABLES is the complete
// list as of L-V392 and is used only if the RPC is unavailable. Each delete is
// independent and filtered by user_id, so order doesn't matter (every FK points
// at auth.users, not at another public table).
const FALLBACK_USER_TABLES = [
  "ai_usage",
  "diagnostic_results",
  "email_preferences",
  "exam_sessions",
  "exercise_logs",
  "free_usage",
  "hint_events",
  "mini_yo_progress",
  "push_subscriptions",
  "seen_exercises",
  "seen_seed_items",
  "sr_cards",
  "subscriptions",
  "translation_accepted",
  "user_curriculum_progress",
  "user_lesson_progress",
  "user_level",
  "user_mastery",
  "user_mistakes",
  "user_onboarding_diagnostic",
  "user_profile",
  "user_self_assessments",
  "user_session_state",
];

// Memoized per process — the schema doesn't change between requests, and
// export/delete are rare. Falls back to the static list if the RPC fails.
let _userTablesCache = null;
async function getUserTables() {
  if (_userTablesCache) return _userTablesCache;
  try {
    const { data, error } = await adminClient.rpc("list_user_owned_tables");
    if (!error && Array.isArray(data) && data.length) {
      _userTablesCache = data.map((r) => (typeof r === "string" ? r : r.list_user_owned_tables)).filter(Boolean);
      return _userTablesCache;
    }
  } catch (err) {
    console.warn("[gdpr] list_user_owned_tables RPC failed, using fallback:", err?.message || err);
  }
  return FALLBACK_USER_TABLES;
}

// GET /api/gdpr/export — returns the caller's data as a downloadable JSON file.
router.get("/export", requireAuth, async (req, res) => {
  const { userId, email } = req.user;
  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: userId, email },
    data: {},
  };

  const tables = await getUserTables();
  for (const table of tables) {
    try {
      const { data, error } = await adminClient
        .from(table)
        .select("*")
        .eq("user_id", userId);
      if (!error && data) payload.data[table] = data;
    } catch {
      // Table missing or lacks user_id — skip it, don't fail the whole export.
    }
  }

  const filename = `puheo-tietosi-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(JSON.stringify(payload, null, 2));
});

// POST /api/gdpr/delete-account — erases the caller's data and auth account.
router.post("/delete-account", requireAuth, async (req, res) => {
  const { userId, email } = req.user;
  const failed = [];

  const tables = await getUserTables();
  for (const table of tables) {
    try {
      const { error } = await adminClient.from(table).delete().eq("user_id", userId);
      if (error) failed.push(table);
    } catch {
      failed.push(table);
    }
  }

  // Email-keyed rows that don't carry user_id.
  if (email) {
    const lower = String(email).toLowerCase().trim();
    for (const table of ["waitlist", "password_resets", "email_verifications"]) {
      try { await adminClient.from(table).delete().eq("email", lower); } catch { /* ignore */ }
    }
  }

  // Finally remove the auth account. This also invalidates its sessions.
  try {
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      console.error("[gdpr] auth deleteUser failed:", error.message);
      return res.status(500).json({ error: "account_delete_failed" });
    }
  } catch (err) {
    console.error("[gdpr] auth deleteUser threw:", err?.message || err);
    return res.status(500).json({ error: "account_delete_failed" });
  }

  if (failed.length) {
    // Auth user is gone, but log any table that resisted so we can follow up.
    console.warn("[gdpr] account deleted with residual rows in:", failed.join(", "));
  }
  res.json({ ok: true });
});

export default router;
