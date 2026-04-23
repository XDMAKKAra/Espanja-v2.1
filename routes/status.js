// Pass 6 C17 — /api/status endpoint for /status.html dashboard.
//
// Public (no auth) — returns only health state and timing, no PII and no
// error message bodies. On-call uses this during exam week (see
// testing/EXAM-WEEK.md) to spot degradation in seconds.

import { Router } from "express";
import supabase from "../supabase.js";
import { __memCacheInternals } from "../lib/openai.js";

const router = Router();

// ── In-memory observability ───────────────────────────────────────────────
// Lightweight ring buffer for last error timestamps. Independent of Sentry
// so the /status endpoint still works if Sentry is dark.
const _errorRing = { last: null, lastMs: null, count24h: 0, bucketStart: Date.now() };

export function recordError() {
  const now = Date.now();
  // Roll 24h bucket
  if (now - _errorRing.bucketStart > 24 * 60 * 60 * 1000) {
    _errorRing.count24h = 0;
    _errorRing.bucketStart = now;
  }
  _errorRing.count24h += 1;
  _errorRing.lastMs = now;
  _errorRing.last = new Date(now).toISOString();
}

// Cache OpenAI ping for 60s so /status doesn't blow through quota.
let _openaiPing = { ok: null, checkedAt: 0, latencyMs: null };
async function pingOpenAI() {
  const TTL = 60_000;
  const now = Date.now();
  if (now - _openaiPing.checkedAt < TTL) return _openaiPing;

  if (!process.env.OPENAI_API_KEY) {
    _openaiPing = { ok: false, checkedAt: now, latencyMs: null, reason: "no_key" };
    return _openaiPing;
  }

  const t0 = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(3000),
    });
    _openaiPing = {
      ok: res.ok,
      checkedAt: now,
      latencyMs: Date.now() - t0,
      status: res.status,
    };
  } catch {
    _openaiPing = { ok: false, checkedAt: now, latencyMs: Date.now() - t0, reason: "timeout" };
  }
  return _openaiPing;
}

async function pingSupabase() {
  const t0 = Date.now();
  try {
    // Cheap HEAD-like query
    const { error } = await supabase
      .from("user_profile")
      .select("user_id", { count: "exact", head: true })
      .limit(1);
    return { ok: !error, latencyMs: Date.now() - t0 };
  } catch {
    return { ok: false, latencyMs: Date.now() - t0 };
  }
}

router.get("/", async (_req, res) => {
  const [db, ai] = await Promise.all([pingSupabase(), pingOpenAI()]);
  const cacheSize = __memCacheInternals.cache.size;
  const uptimeSec = Math.round(process.uptime());

  const healthy = db.ok && (ai.ok || process.env.EXAM_WEEK === "true"); // AI not required during exam week

  res.json({
    ok: healthy,
    ts: new Date().toISOString(),
    build: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_SHA || "dev",
    env: process.env.NODE_ENV || "development",
    examWeek: process.env.EXAM_WEEK === "true",
    uptimeSec,
    db: { ok: db.ok, latencyMs: db.latencyMs },
    openai: { ok: ai.ok, latencyMs: ai.latencyMs, reason: ai.reason || null },
    cache: { size: cacheSize, max: __memCacheInternals.max },
    errors: {
      last: _errorRing.last,
      lastMsAgo: _errorRing.lastMs ? Date.now() - _errorRing.lastMs : null,
      count24h: _errorRing.count24h,
    },
  });
});

export default router;
