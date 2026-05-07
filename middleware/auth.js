import supabase from "../supabase.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Load the committed test-accounts file. Env vars (TEST_PRO_EMAILS /
// PRO_TEST_LIST) are still honoured as overrides, but the file is the
// reliable primary source that doesn't depend on Vercel env injection.
let TEST_FILE = { always_pro: [], always_free: [] };
try {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(resolve(__dirname, "../data/test-accounts.json"), "utf8");
  const parsed = JSON.parse(raw);
  TEST_FILE = {
    always_pro: (parsed.always_pro || []).map(e => String(e).trim().toLowerCase()).filter(Boolean),
    always_free: (parsed.always_free || []).map(e => String(e).trim().toLowerCase()).filter(Boolean),
  };
} catch (err) {
  console.warn("[auth] could not load data/test-accounts.json:", err.message);
}

/**
 * Express middleware that requires a valid Bearer token.
 * Sets req.user = { userId, email } on success.
 */
export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !user) return res.status(401).json({ error: "Invalid token" });
  req.user = { userId: user.id, email: user.email };
  next();
}

// Test accounts loaded from env (comma-separated) — never hardcode emails in source.
// Read lazily inside isPro() rather than at module load so env changes on the
// serverless host apply without relying on container recycling.
function parseEmailList(envValue) {
  return (envValue || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
}

/**
 * Check if a user has an active Pro subscription.
 * @param {string} userId - Supabase user ID
 * @returns {Promise<boolean>} True if user is Pro
 */
export async function isPro(userId) {
  // Union of file-based test accounts (data/test-accounts.json) and optional
  // env overrides (PRO_TEST_LIST / TEST_PRO_EMAILS). File is the reliable
  // source — env var support is kept only for future ops convenience.
  const envPro = parseEmailList(process.env.PRO_TEST_LIST || process.env.TEST_PRO_EMAILS);
  const envFree = parseEmailList(process.env.FREE_TEST_LIST || process.env.TEST_FREE_EMAILS);
  const alwaysPro = [...new Set([...TEST_FILE.always_pro, ...envPro])];
  const alwaysFree = [...new Set([...TEST_FILE.always_free, ...envFree])];

  // Check test accounts
  if (alwaysPro.length || alwaysFree.length) {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (user?.email) {
      if (alwaysPro.includes(user.email.toLowerCase())) return true;
      if (alwaysFree.includes(user.email.toLowerCase())) return false;
    }
  }

  // L-PRICING-REVAMP-1 — new tier columns live on `user_profile` (PK user_id).
  const { data: userRow } = await supabase
    .from("user_profile")
    .select("subscription_tier, subscription_billing, subscription_status, subscription_expires_at")
    .eq("user_id", userId)
    .single();
  if (isPayingRow(userRow)) return true;

  // Legacy summer package (one-time purchase with expiry)
  const { data: profile } = await supabase
    .from("user_profile")
    .select("summer_package_expires_at")
    .eq("user_id", userId)
    .single();
  if (profile?.summer_package_expires_at && new Date(profile.summer_package_expires_at) > new Date()) {
    return true;
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("active")
    .eq("user_id", userId)
    .single();
  return data?.active === true;
}

// ─── Tier-aware helpers (L-PRICING-REVAMP-1) ──────────────────────────────

export const FREE_LIMITS = { writing: 1, reading: 1, exam: 1, lessons: 1 };

export const FEATURES = {
  free:    new Set(["writing", "reading", "exam", "lesson"]),
  treeni:  new Set(["writing", "reading", "exam"]),
  mestari: new Set(["writing", "reading", "exam", "lesson", "course", "adaptive", "yo_readiness", "study_plan", "mistake_tracking"]),
};

function isPayingRow(row) {
  if (!row) return false;
  const tier = row.subscription_tier;
  if (!tier || tier === "free") return false;
  if (row.subscription_status === "active") return true;
  if (row.subscription_billing === "package"
      && row.subscription_expires_at
      && new Date(row.subscription_expires_at) > new Date()) return true;
  return false;
}

export async function getUserTier(userId) {
  const { data } = await supabase
    .from("user_profile")
    .select("subscription_tier, subscription_billing, subscription_status, subscription_expires_at")
    .eq("user_id", userId)
    .single();
  if (!isPayingRow(data)) return "free";
  return data.subscription_tier; // 'treeni' | 'mestari'
}

export async function hasFeature(userId, feature) {
  const tier = await getUserTier(userId);
  return FEATURES[tier]?.has(feature) || false;
}

export async function getFreeUsage(userId) {
  const { data } = await supabase
    .from("free_usage")
    .select("writing_count, reading_count, exam_count, lessons_done")
    .eq("user_id", userId)
    .single();
  return {
    writing_count: data?.writing_count || 0,
    reading_count: data?.reading_count || 0,
    exam_count:    data?.exam_count || 0,
    lessons_done:  data?.lessons_done || 0,
  };
}

export async function incrementFreeUsage(userId, feature) {
  const col = ({
    writing: "writing_count",
    reading: "reading_count",
    exam:    "exam_count",
    lessons: "lessons_done",
  })[feature];
  if (!col) return;
  const usage = await getFreeUsage(userId);
  const next = (usage[col] || 0) + 1;
  await supabase
    .from("free_usage")
    .upsert({ user_id: userId, [col]: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

/**
 * Combined gate for paid features. Returns
 *   { allowed: true, tier }
 *   { allowed: false, reason: 'tier_required', requiredTier, currentTier }
 *   { allowed: false, reason: 'free_quota_exceeded', used, limit }
 */
export async function checkFeatureAccess(userId, feature) {
  const tier = await getUserTier(userId);
  const allowedByTier = FEATURES[tier]?.has(feature);
  if (!allowedByTier) {
    const requiredTier = FEATURES.mestari.has(feature) && !FEATURES.treeni.has(feature) ? "mestari" : "treeni";
    return { allowed: false, reason: "tier_required", requiredTier, currentTier: tier };
  }
  if (tier !== "free") return { allowed: true, tier };
  const limitKey = feature === "lesson" ? "lessons" : feature;
  const limit = FREE_LIMITS[limitKey];
  if (limit == null) return { allowed: true, tier };
  const usage = await getFreeUsage(userId);
  const usedCol = limitKey === "lessons" ? "lessons_done" : `${limitKey}_count`;
  const used = usage[usedCol] || 0;
  if (used >= limit) return { allowed: false, reason: "free_quota_exceeded", used, limit, currentTier: tier };
  return { allowed: true, tier, used, limit };
}

/**
 * Express middleware that requires Pro subscription. Must be used after requireAuth.
 */
export async function requirePro(req, res, next) {
  const pro = await isPro(req.user.userId);
  if (!pro) return res.status(403).json({ error: "pro_required", message: "Tämä toiminto vaatii Pro-tilin" });
  next();
}

/**
 * Reading soft→hard gate. Free users get the first 2 reading pieces, then 403.
 * Pro users pass through. Must be used after requireAuth.
 * Successful handlers must call incrementReadingPieces(req.user.userId) after
 * returning a piece so the counter stays in sync with what the user saw.
 */
export const FREE_READING_PIECES = 2;
export async function softReadingGate(req, res, next) {
  const pro = await isPro(req.user.userId);
  if (pro) {
    req.isPro = true;
    return next();
  }
  const { data: profile } = await supabase
    .from("user_profile")
    .select("reading_pieces_consumed")
    .eq("user_id", req.user.userId)
    .single();
  const consumed = Number(profile?.reading_pieces_consumed || 0);
  if (consumed >= FREE_READING_PIECES) {
    return res.status(403).json({
      error: "pro_required",
      reason: "reading_cap_reached",
      consumed,
      limit: FREE_READING_PIECES,
      message: "Olet lukenut 2 ilmaista tekstiä. Pro-tilauksella avaat loput.",
    });
  }
  req.readingPiecesConsumed = consumed;
  next();
}

// Pass 4 Commit 9 — true only when req.user.email is in the TEST_PRO_EMAILS
// union (file + env). Used by /api/config/public to gate the dev-only
// "Flip to Pro" button visible inside the Pro upsell modal.
export function isTestProEmail(email) {
  if (!email) return false;
  const envPro = parseEmailList(process.env.PRO_TEST_LIST || process.env.TEST_PRO_EMAILS);
  const alwaysPro = new Set([...TEST_FILE.always_pro, ...envPro]);
  return alwaysPro.has(String(email).trim().toLowerCase());
}

export async function incrementReadingPieces(userId) {
  const { data: profile } = await supabase
    .from("user_profile")
    .select("reading_pieces_consumed")
    .eq("user_id", userId)
    .single();
  const next = Number(profile?.reading_pieces_consumed || 0) + 1;
  await supabase
    .from("user_profile")
    .upsert({ user_id: userId, reading_pieces_consumed: next }, { onConflict: "user_id" });
  return next;
}

/**
 * Express middleware that checks Pro status if authenticated, but allows unauthenticated requests through.
 * Returns 403 for authenticated non-Pro users.
 */
export async function softProGate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return next();
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !user) return next();
  req.user = { userId: user.id, email: user.email };
  const pro = await isPro(user.id);
  if (!pro) return res.status(403).json({ error: "pro_required", message: "Tämä toiminto vaatii Pro-tilin" });
  next();
}
