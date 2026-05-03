// Payment provider placeholder. LemonSqueezy was removed in L-CLEANUP-1
// (2026-05-03); Stripe migration will land in a future L-STRIPE-1 loop.
// Until then, every checkout endpoint returns 503 and the webhook handler
// no-ops. UI surfaces the waitlist modal instead via window.__WAITLIST_MODE.

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const NOT_AVAILABLE = {
  status: 503,
  body: { error: "Maksu ei ole vielä käytössä — liity jonotuslistalle." },
};

router.post("/create-checkout-session", requireAuth, (_req, res) =>
  res.status(NOT_AVAILABLE.status).json(NOT_AVAILABLE.body)
);

router.post("/create-summer-checkout", requireAuth, (_req, res) =>
  res.status(NOT_AVAILABLE.status).json(NOT_AVAILABLE.body)
);

router.get("/portal-session", requireAuth, (_req, res) =>
  res.status(NOT_AVAILABLE.status).json(NOT_AVAILABLE.body)
);

export async function handleWebhook(_req, res) {
  res.status(410).json({ error: "Payment webhook disabled" });
}

export default router;
