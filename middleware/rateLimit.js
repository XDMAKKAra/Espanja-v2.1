import { adminClient } from "../supabase.js";

const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;

// ─── In-memory fallback for dev ────────────────────────────────────────────

const _memBuckets = new Map();

function memoryRateLimit(key, windowMs, max) {
  const now = Date.now();
  const entry = _memBuckets.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    _memBuckets.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: max - 1 };
  }
  entry.count++;
  if (entry.count > max) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: max - entry.count };
}

// ─── Supabase-backed rate limiting (sliding window) ────────────────────────

async function supabaseRateLimit(key, windowMs, max) {
  // Single atomic round-trip: the increment_rate_limit RPC bumps the current
  // minute bucket and returns the sliding-window total (see migration
  // 20260601_rate_limit_atomic_increment). This replaces the old read+upsert
  // dance whose upsert overwrote count to 1 on conflict — so concentrated
  // bursts were never counted and the limit never bit (L-V340 finding #1).
  const { data, error } = await adminClient.rpc("increment_rate_limit", {
    p_key: key,
    p_window_ms: windowMs,
  });

  if (error) {
    // RPC errored or isn't present (DB blip, rollback, env without the
    // migration). Don't fall wide open — degrade to the per-instance in-memory
    // sliding window so SOME enforcement always holds. The AI limiters also
    // have the AUTHED_AI_DAILY_CAP backstop above. This makes the limiter
    // robust to the increment_rate_limit RPC being missing for any reason.
    console.error("Rate limit DB error, falling back to in-memory:", error.message);
    return memoryRateLimit(key, windowMs, max);
  }

  const total = Number(data) || 0;
  // The just-counted request is included in `total`, so allow up to `max`.
  return { allowed: total <= max, remaining: Math.max(0, max - total) };
}

// ─── Rate limit check ──────────────────────────────────────────────────────

async function checkRateLimit(key, windowMs, max) {
  if (!isProd) return memoryRateLimit(key, windowMs, max);
  return supabaseRateLimit(key, windowMs, max);
}

// ─── Client IP resolution ──────────────────────────────────────────────────
// We do NOT set Express `trust proxy` globally (it would change keying for
// every existing limiter and can't be safely re-tested here), so on Vercel
// `req.ip` is the platform proxy, not the visitor. Read the left-most
// X-Forwarded-For entry (Vercel sets it to the real client) and fall back to
// req.ip. This is best-effort and spoofable; the global demo cap is the real
// cost backstop.
export function clientIp(req) {
  const xff = req.headers?.["x-forwarded-for"];
  if (xff) {
    const first = (Array.isArray(xff) ? xff[0] : String(xff)).split(",")[0].trim();
    if (first) return first;
  }
  return req.ip || "";
}

// ─── In-memory global daily backstop for authenticated AI (L-V339 P2) ───────
// Both supabaseRateLimit (fail-open on DB error) and checkMonthlyCostLimit
// (fail-open in its catch) drop every cost ceiling for logged-in AI calls when
// Supabase errors. This counter is deliberately DB-independent: even with the
// DB down, once the day's global authed-AI budget is spent the call is
// refused. It lives in module memory per serverless instance (no shared
// state), so it bounds per-instance runaway — the realistic stampede-during-
// outage failure mode — without leaning on the very DB that just failed. The
// per-user aiLimiter (20/h) and monthly cost limit remain the primary gates;
// this only catches the fail-open hole. Tune with AUTHED_AI_DAILY_CAP.
const AUTHED_AI_DAILY_CAP = Number(process.env.AUTHED_AI_DAILY_CAP) || 4000;
let _authedAiDay = "";
let _authedAiCount = 0;
function authedAiBackstopExceeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== _authedAiDay) {
    _authedAiDay = today;
    _authedAiCount = 0;
  }
  _authedAiCount++;
  return _authedAiCount > AUTHED_AI_DAILY_CAP;
}

// ─── Middleware factory ────────────────────────────────────────────────────

// L-V340: when set, every limiter passes straight through. Lets the load test
// measure raw route capacity with zero limiter DB round-trips, as a contrast
// to the limiters-on run. Inert unless explicitly enabled by the load driver.
const LOAD_TEST_RL_OFF = process.env.LOAD_TEST_RL_OFF === "1";

function createLimiter({ windowMs, max, keyGenerator, message, backstop }) {
  const errorMsg = message?.error || "Liian monta pyyntöä. Yritä hetken kuluttua uudelleen.";

  return async (req, res, next) => {
    if (LOAD_TEST_RL_OFF) return next();
    // DB-independent global daily backstop runs first so it still bites when
    // the Supabase-backed limiter below would fail open.
    if (backstop && authedAiBackstopExceeded()) {
      console.error("Authed-AI daily backstop hit:", _authedAiCount, "/", AUTHED_AI_DAILY_CAP);
      return res.status(429).json({ error: errorMsg });
    }

    const key = keyGenerator ? keyGenerator(req) : req.ip;
    const prefixedKey = `rl:${req.path}:${key}`;

    try {
      const { allowed, remaining } = await checkRateLimit(prefixedKey, windowMs, max);

      res.set("X-RateLimit-Limit", String(max));
      res.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));

      if (!allowed) {
        return res.status(429).json({ error: errorMsg });
      }

      next();
    } catch (err) {
      // Fail open on unexpected errors
      console.error("Rate limit error:", err.message);
      next();
    }
  };
}

// ─── Exported limiters (same limits as before) ─────────────────────────────

export const authLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Liian monta pyyntöä. Yritä hetken kuluttua uudelleen." },
});

export const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Liian monta rekisteröintiyritystä. Yritä myöhemmin." },
});

export const forgotPasswordLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Liian monta pyyntöä. Yritä myöhemmin." },
});

export const aiLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Olet käyttänyt tuntikysyntäsi. Yritä myöhemmin." },
  backstop: true,
});

export const aiStrictLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Olet käyttänyt tuntikysyntäsi. Yritä myöhemmin." },
  backstop: true,
});

// Per-user limiter for /report-exercise: prevents abusive bulk-reporting.
// Legit users rarely report more than a handful of exercises per hour.
export const reportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Liian monta raporttia. Yritä myöhemmin." },
});

// Per-IP limiter for unauthenticated public POSTs that accept email
// (waitlist signups). Scoped wider than auth limits because many users may
// legitimately submit from a shared NAT, but tight enough to make spam
// scripted abuse unattractive.
export const waitlistLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Liian monta pyyntöä. Yritä hetken kuluttua uudelleen." },
});

// Per-IP limiter for the anonymous landing writing demo (L-V332). One AI
// grade per device per 24h — the demo is a taste, not a free-tier substitute.
// Keyed by the resolved client IP (X-Forwarded-For aware) so it actually
// distinguishes visitors behind the Vercel proxy. The frontend localStorage
// flag is cosmetic; this + the global cap below are the real abuse gates.
export const demoGradeLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  keyGenerator: clientIp,
  message: { error: "Olet jo kokeillut tänään. Tee oma tili niin saat arvioinnit rajattomasti." },
});

// Global daily cap on demo grades across ALL visitors — the hard cost ceiling.
// Survives IP rotation, X-Forwarded-For spoofing, the per-IP limiter failing
// open on a DB error, and localStorage bypass: every one of those still funnels
// through this single counter. Once the day's budget is spent, the demo pauses
// and points visitors at a real account. Tune with DEMO_GRADE_DAILY_CAP.
const DEMO_DAILY_CAP = Number(process.env.DEMO_GRADE_DAILY_CAP) || 300;
export const demoGradeGlobalLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: DEMO_DAILY_CAP,
  keyGenerator: () => "global",
  message: { error: "Demo on juuri nyt tauolla. Tee oma tili, niin pääset kirjoittamaan heti." },
});
