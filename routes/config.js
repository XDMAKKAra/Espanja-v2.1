// Pass 4 Commit 9 — public-ish config + dev Pro-flip for test accounts.
// Kept minimal: a single GET for the client to hydrate feature flags, and
// a POST gated on TEST_PRO_EMAILS membership for marcel-only dev use.

import express from "express";
import { requireAuth, isTestProEmail } from "../middleware/auth.js";
import supabase from "../supabase.js";

const router = express.Router();

// GET /api/config/public — requires auth so we can branch per-user on
// whether the Pro-flip dev button should render.
router.get("/public", requireAuth, (req, res) => {
  res.json({
    // Flip to false when live LemonSqueezy checkout is wired after y-tunnus.
    waitlist_mode: true,
    // Only true for TEST_PRO_EMAILS accounts; the [Flip to Pro (dev)]
    // button reads this to decide whether to render.
    dev_pro_enabled: isTestProEmail(req.user?.email),
  });
});

// POST /api/dev/grant-pro — flips subscriptions.active = true for the
// calling test user. Guarded by TEST_PRO_EMAILS membership; a forged
// client-side __DEV_PRO_ENABLED flag cannot call this.
router.post("/grant-pro", requireAuth, async (req, res) => {
  if (!isTestProEmail(req.user?.email)) {
    return res.status(403).json({ error: "not_a_test_account" });
  }
  const userId = req.user.userId;
  try {
    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        { user_id: userId, active: true, plan: "dev-grant" },
        { onConflict: "user_id" }
      );
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("grant-pro error:", err.message);
    res.status(500).json({ error: "grant_failed" });
  }
});

export default router;
