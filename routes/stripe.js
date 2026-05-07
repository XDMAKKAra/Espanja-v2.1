// L-PRICING-REVAMP-1 — Stripe Checkout + Customer Portal + webhook.
//
// 4 prices / 2 products:
//   Treeni  €9/kk  recurring   → STRIPE_PRICE_TREENI_MONTHLY
//   Treeni  €19    one-time    → STRIPE_PRICE_TREENI_PACKAGE
//   Mestari €19/kk recurring   → STRIPE_PRICE_MESTARI_MONTHLY
//   Mestari €39    one-time    → STRIPE_PRICE_MESTARI_PACKAGE
//
// The `stripe` SDK is loaded lazily so the server still boots in environments
// where the package is not installed yet (CI, local dev). When envs/SDK are
// missing the endpoints return 503 with a friendly Finnish message.
//
// Webhook idempotency: each processed event id is recorded in `stripe_events`
// and re-deliveries are accepted with a 200 no-op.

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import supabase from "../supabase.js";

const router = Router();

const PRICE_MAP = {
  "treeni:monthly":  { env: "STRIPE_PRICE_TREENI_MONTHLY",  mode: "subscription" },
  "treeni:package":  { env: "STRIPE_PRICE_TREENI_PACKAGE",  mode: "payment" },
  "mestari:monthly": { env: "STRIPE_PRICE_MESTARI_MONTHLY", mode: "subscription" },
  "mestari:package": { env: "STRIPE_PRICE_MESTARI_PACKAGE", mode: "payment" },
};

const PACKAGE_DAYS = 56;

let _stripeClient = null;
async function getStripe() {
  if (_stripeClient) return _stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const { default: Stripe } = await import("stripe");
    _stripeClient = new Stripe(key, { apiVersion: "2024-06-20" });
    return _stripeClient;
  } catch (err) {
    console.warn("[stripe] SDK not installed:", err.message);
    return null;
  }
}

function siteUrl() {
  return process.env.PUBLIC_SITE_URL || process.env.SITE_URL || "https://puheo.fi";
}

// POST /checkout-session  body: { tier: 'treeni'|'mestari', billing: 'monthly'|'package' }
router.post("/checkout-session", requireAuth, async (req, res) => {
  const tier = String(req.body?.tier || "").toLowerCase();
  const billing = String(req.body?.billing || "").toLowerCase();
  const key = `${tier}:${billing}`;
  const cfg = PRICE_MAP[key];
  if (!cfg) return res.status(400).json({ error: "invalid_tier_or_billing" });

  const priceId = process.env[cfg.env];
  const stripe = await getStripe();
  if (!stripe || !priceId) {
    return res.status(503).json({
      error: "payment_unavailable",
      message: "Maksutapa ei ole vielä käytössä — yritä myöhemmin uudelleen.",
    });
  }

  // Reuse customer record if we have one already
  let customerId = null;
  try {
    const { data: profile } = await supabase
      .from("user_profile")
      .select("stripe_customer_id, exam_date")
      .eq("user_id", req.user.userId)
      .single();
    customerId = profile?.stripe_customer_id || null;
    req._examDate = profile?.exam_date || null;
  } catch { /* table or row may not exist yet */ }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: cfg.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId || undefined,
      customer_email: customerId ? undefined : req.user.email,
      client_reference_id: req.user.userId,
      success_url: `${siteUrl()}/app.html#/tervetuloa?paid=1`,
      cancel_url: `${siteUrl()}/pricing.html?canceled=1`,
      allow_promotion_codes: true,
      metadata: {
        user_id: req.user.userId,
        tier,
        billing,
      },
      ...(cfg.mode === "subscription"
        ? { subscription_data: { metadata: { user_id: req.user.userId, tier, billing } } }
        : { payment_intent_data: { metadata: { user_id: req.user.userId, tier, billing } } }),
    });
    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("[stripe] checkout-session failed:", err?.message);
    return res.status(500).json({ error: "stripe_error", message: err?.message });
  }
});

// POST /portal-session — returns Customer Portal URL for monthly subscribers
router.post("/portal-session", requireAuth, async (req, res) => {
  const stripe = await getStripe();
  if (!stripe) {
    return res.status(503).json({ error: "payment_unavailable" });
  }
  const { data: profile } = await supabase
    .from("user_profile")
    .select("stripe_customer_id")
    .eq("user_id", req.user.userId)
    .single();
  const customerId = profile?.stripe_customer_id;
  if (!customerId) return res.status(404).json({ error: "no_customer" });

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl()}/app.html#/asetukset`,
    });
    return res.json({ url: portal.url });
  } catch (err) {
    console.error("[stripe] portal-session failed:", err?.message);
    return res.status(500).json({ error: "stripe_error", message: err?.message });
  }
});

// Compatibility: legacy paths still 503 (kept so old clients don't crash)
router.post("/create-checkout-session", requireAuth, (_req, res) =>
  res.status(410).json({ error: "endpoint_renamed", message: "Käytä /api/stripe/checkout-session" })
);
router.post("/create-summer-checkout", requireAuth, (_req, res) =>
  res.status(410).json({ error: "endpoint_removed" })
);

// ---- Webhook ---------------------------------------------------------------

async function alreadyProcessed(eventId) {
  if (!eventId) return false;
  try {
    const { data } = await supabase
      .from("stripe_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}
async function markProcessed(eventId, type) {
  try {
    await supabase.from("stripe_events").insert({ id: eventId, type, processed_at: new Date().toISOString() });
  } catch (err) {
    // Table may not exist yet — log and continue (idempotency degrades gracefully).
    console.warn("[stripe] could not record event id:", err?.message);
  }
}

function packageExpiry(examDate) {
  const base = new Date();
  const pkgEnd = new Date(base.getTime() + PACKAGE_DAYS * 24 * 60 * 60 * 1000);
  if (!examDate) return pkgEnd.toISOString();
  const examPlus7 = new Date(new Date(examDate).getTime() + 7 * 24 * 60 * 60 * 1000);
  return (pkgEnd < examPlus7 ? pkgEnd : examPlus7).toISOString();
}

async function applyCheckoutCompleted(session) {
  const md = session.metadata || {};
  const userId = md.user_id || session.client_reference_id;
  const tier = md.tier;
  const billing = md.billing;
  if (!userId || !tier || !billing) {
    console.warn("[stripe] checkout.completed missing metadata", { id: session.id });
    return;
  }

  const update = {
    subscription_tier: tier,
    subscription_billing: billing,
    subscription_status: "active",
    stripe_customer_id: session.customer || null,
  };

  if (billing === "monthly") {
    update.stripe_subscription_id = session.subscription || null;
    update.subscription_expires_at = null;
  } else {
    let examDate = null;
    try {
      const { data } = await supabase.from("user_profile").select("exam_date").eq("user_id", userId).single();
      examDate = data?.exam_date || null;
    } catch { /* ignore */ }
    update.subscription_expires_at = packageExpiry(examDate);
    update.stripe_subscription_id = null;
  }

  await supabase.from("user_profile").upsert({ user_id: userId, ...update }, { onConflict: "user_id" });
}

async function applySubscriptionUpdate(sub) {
  const userId = sub.metadata?.user_id;
  const status = sub.status;
  const map = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    unpaid: "past_due",
    canceled: "canceled",
    incomplete: "past_due",
    incomplete_expired: "expired",
  };
  const next = map[status] || status;
  const patch = { subscription_status: next };
  if (status === "canceled") {
    // Keep tier until period end so user retains access.
    if (sub.current_period_end) {
      patch.subscription_expires_at = new Date(sub.current_period_end * 1000).toISOString();
    }
  }
  if (userId) {
    await supabase.from("user_profile").update(patch).eq("user_id", userId);
  } else if (sub.customer) {
    await supabase.from("user_profile").update(patch).eq("stripe_customer_id", sub.customer);
  }
}

async function applyInvoiceFailed(invoice) {
  const customer = invoice.customer;
  if (!customer) return;
  await supabase
    .from("user_profile")
    .update({ subscription_status: "past_due" })
    .eq("stripe_customer_id", customer);
}

export async function handleWebhook(req, res) {
  const stripe = await getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return res.status(503).json({ error: "webhook_unavailable" });
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("[stripe] webhook signature verification failed:", err?.message);
    return res.status(400).send(`Webhook signature error: ${err?.message}`);
  }

  if (await alreadyProcessed(event.id)) {
    return res.json({ received: true, idempotent: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await applyCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscriptionUpdate(event.data.object);
        break;
      case "invoice.payment_failed":
        await applyInvoiceFailed(event.data.object);
        break;
      default:
        // unhandled — ignore
        break;
    }
    await markProcessed(event.id, event.type);
    return res.json({ received: true });
  } catch (err) {
    console.error("[stripe] handler failed:", err?.message);
    return res.status(500).json({ error: "handler_failed" });
  }
}

export default router;
