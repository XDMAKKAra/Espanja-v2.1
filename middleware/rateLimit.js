import supabase from "../supabase.js";

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
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Count requests in the current window
  const { data, error } = await supabase
    .from("rate_limit_buckets")
    .select("count")
    .eq("key", key)
    .gte("window_start", windowStart.toISOString());

  if (error) {
    // On DB error, allow the request (fail open)
    console.error("Rate limit DB error:", error.message);
    return { allowed: true, remaining: max };
  }

  const totalCount = (data || []).reduce((sum, row) => sum + row.count, 0);

  if (totalCount >= max) {
    return { allowed: false, remaining: 0 };
  }

  // Round to nearest minute for bucket grouping
  const bucketStart = new Date(Math.floor(now.getTime() / 60000) * 60000).toISOString();

  // Upsert: increment counter for current minute bucket
  await supabase.rpc("increment_rate_limit", undefined).catch(() => null);
  // Fallback: direct upsert
  const { error: upsertErr } = await supabase
    .from("rate_limit_buckets")
    .upsert(
      { key, window_start: bucketStart, count: 1 },
      { onConflict: "key,window_start", ignoreDuplicates: false }
    );

  if (upsertErr) {
    // Try increment instead
    const { data: existing } = await supabase
      .from("rate_limit_buckets")
      .select("count")
      .eq("key", key)
      .eq("window_start", bucketStart)
      .single();

    if (existing) {
      await supabase
        .from("rate_limit_buckets")
        .update({ count: existing.count + 1 })
        .eq("key", key)
        .eq("window_start", bucketStart);
    } else {
      await supabase
        .from("rate_limit_buckets")
        .insert({ key, window_start: bucketStart, count: 1 });
    }
  }

  return { allowed: true, remaining: max - totalCount - 1 };
}

// ─── Rate limit check ──────────────────────────────────────────────────────

async function checkRateLimit(key, windowMs, max) {
  if (!isProd) return memoryRateLimit(key, windowMs, max);
  return supabaseRateLimit(key, windowMs, max);
}

// ─── Middleware factory ────────────────────────────────────────────────────

function createLimiter({ windowMs, max, keyGenerator, message }) {
  const errorMsg = message?.error || "Liian monta pyyntöä. Yritä hetken kuluttua uudelleen.";

  return async (req, res, next) => {
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
});

export const aiStrictLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Olet käyttänyt tuntikysyntäsi. Yritä myöhemmin." },
});
