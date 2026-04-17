import { Router } from "express";
import crypto from "crypto";
import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  getCustomer,
} from "@lemonsqueezy/lemonsqueezy.js";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";

lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });

const router = Router();

router.post("/create-checkout-session", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const email = req.user.email;

  try {
    const { data, error } = await createCheckout(process.env.LEMONSQUEEZY_STORE_ID, process.env.LEMONSQUEEZY_VARIANT_ID, {
      checkoutData: {
        email,
        custom: { user_id: userId },
      },
      checkoutOptions: {
        embed: false,
      },
      productOptions: {
        redirectUrl: `${process.env.APP_URL}/app.html?checkout=success`,
      },
    });

    if (error) {
      console.error("LemonSqueezy checkout error:", error);
      return res.status(500).json({ error: "Maksun avaaminen epäonnistui" });
    }

    res.json({ url: data.data.attributes.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Maksun avaaminen epäonnistui" });
  }
});

router.get("/portal-session", requireAuth, async (req, res) => {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("ls_customer_id")
    .eq("user_id", req.user.userId)
    .single();

  if (!sub?.ls_customer_id) {
    return res.status(400).json({ error: "Ei tilausta" });
  }

  try {
    const { data } = await getCustomer(sub.ls_customer_id);
    const portalUrl = data.data.attributes.urls.customer_portal;
    res.json({ url: portalUrl });
  } catch (err) {
    console.error("Portal error:", err);
    res.status(500).json({ error: "Hallintasivun avaaminen epäonnistui" });
  }
});

// Webhook handler — called from server.js with raw body
export async function handleWebhook(req, res) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers["x-signature"];

  if (!signature || !secret) {
    return res.status(401).json({ error: "Missing signature" });
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(req.body);
  const digest = hmac.digest("hex");

  if (digest !== signature) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(req.body);
  const eventName = event.meta.event_name;
  const obj = event.data;
  const attrs = obj.attributes;
  const userId = event.meta.custom_data?.user_id;

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated": {
      const active = attrs.status === "active" || attrs.status === "on_trial";
      const customerId = attrs.customer_id;
      const subscriptionId = obj.id;

      if (userId) {
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            active,
            plan: active ? "pro" : "free",
            ls_customer_id: String(customerId),
            ls_subscription_id: String(subscriptionId),
            current_period_end: attrs.renews_at,
          },
          { onConflict: "user_id" }
        );
      } else {
        // Fallback: update by customer ID
        await supabase
          .from("subscriptions")
          .update({
            active,
            plan: active ? "pro" : "free",
            ls_subscription_id: String(subscriptionId),
            current_period_end: attrs.renews_at,
          })
          .eq("ls_customer_id", String(customerId));
      }
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired": {
      const customerId = attrs.customer_id;
      await supabase
        .from("subscriptions")
        .update({ active: false, plan: "free" })
        .eq("ls_customer_id", String(customerId));
      break;
    }
  }

  res.json({ received: true });
}

export default router;
