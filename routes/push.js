import { Router } from "express";
import webpush from "web-push";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Configure web-push with VAPID keys (set in env)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_FROM || "noreply@puheo.fi"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

// ─── GET /api/push/vapid-key ───────────────────────────────────────────────

router.get("/vapid-key", (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || null });
});

// ─── POST /api/push/subscribe ──────────────────────────────────────────────

router.post("/subscribe", requireAuth, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: "Virheellinen subscription" });
  }

  try {
    await supabase.from("push_subscriptions").upsert({
      user_id: req.user.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, { onConflict: "endpoint" });

    res.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err.message);
    res.status(500).json({ error: "Tilaus epäonnistui" });
  }
});

// ─── POST /api/push/unsubscribe ────────────────────────────────────────────

router.post("/unsubscribe", requireAuth, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: "endpoint vaaditaan" });

  try {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", req.user.userId);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Peruutus epäonnistui" });
  }
});

// ─── Send push to a user (internal helper) ─────────────────────────────────

export async function sendPushToUser(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !supabase) return 0;

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return 0;

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err) {
      // 410 Gone or 404 = subscription expired, clean up
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }
  return sent;
}

export default router;
