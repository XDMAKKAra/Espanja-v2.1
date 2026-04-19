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

  // Check summer package (one-time purchase with expiry)
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

/**
 * Express middleware that requires Pro subscription. Must be used after requireAuth.
 */
export async function requirePro(req, res, next) {
  const pro = await isPro(req.user.userId);
  if (!pro) return res.status(403).json({ error: "pro_required", message: "Tämä toiminto vaatii Pro-tilin" });
  next();
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
