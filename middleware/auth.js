import supabase from "../supabase.js";

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !user) return res.status(401).json({ error: "Invalid token" });
  req.user = { userId: user.id, email: user.email };
  next();
}

// Test accounts loaded from env (comma-separated) — never hardcode emails in source
const ALWAYS_PRO_EMAILS = (process.env.TEST_PRO_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
const ALWAYS_FREE_EMAILS = (process.env.TEST_FREE_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

export async function isPro(userId) {
  // Check test accounts (loaded from env)
  if (ALWAYS_PRO_EMAILS.length || ALWAYS_FREE_EMAILS.length) {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (user?.email) {
      if (ALWAYS_PRO_EMAILS.includes(user.email.toLowerCase())) return true;
      if (ALWAYS_FREE_EMAILS.includes(user.email.toLowerCase())) return false;
    }
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("active")
    .eq("user_id", userId)
    .single();
  return data?.active === true;
}

export async function requirePro(req, res, next) {
  const pro = await isPro(req.user.userId);
  if (!pro) return res.status(403).json({ error: "pro_required", message: "Tämä toiminto vaatii Pro-tilin" });
  next();
}

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
