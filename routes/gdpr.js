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

// Every table that stores data keyed by the user's id. Deletion walks these;
// export reads them. Order matters for deletion only loosely (child rows
// first, profile last), but each delete is independent and filtered by user_id.
const USER_TABLES = [
  "exercise_logs",
  "user_mistakes",
  "user_mastery",
  "user_level_progress",
  "diagnostic_results",
  "exam_sessions",
  "email_preferences",
  "user_curriculum_progress",
  "user_self_assessments",
  "user_lesson_progress",
  "user_onboarding_diagnostic",
  "mini_yo_progress",
  "sr_cards",
  "mastery_test_attempts",
  "push_subscriptions",
  "free_usage",
  "seen_seed_items",
  "seen_exercises",
  "translation_accepted",
  "subscriptions",
  "user_profile",
];

// GET /api/gdpr/export — returns the caller's data as a downloadable JSON file.
router.get("/export", requireAuth, async (req, res) => {
  const { userId, email } = req.user;
  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: userId, email },
    data: {},
  };

  for (const table of USER_TABLES) {
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

  for (const table of USER_TABLES) {
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
