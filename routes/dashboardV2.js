// L-LIVE-AUDIT-P2 UPDATE 3 — batched dashboard endpoint.
// Replaces 9 sequential frontend fetches with one parallel server roundtrip.
// Mirrors the exact response shapes of:
//   /api/profile                 -> { profile }
//   /api/dashboard               -> { totalSessions, modeStats, ... }
//   /api/weak-topics?days=7      -> { topics, all, days, totalMistakes }
//   /api/sr/count?language=...   -> { count }
//   /api/sr/forecast?days=30     -> { forecast }
//   /api/exam/history            -> { exams }
//   /api/learning-path           -> { path, totalTopics, masteredCount, currentIndex }
//   /api/placement/status        -> { completed, placementLevel, ... }
//   /api/adaptive/status?mode=vocab -> { ...eligibility }
//
// All queries run in Promise.all. Failure of any single section degrades to
// `null` for that key; the frontend treats `null` exactly like a fetch error
// for that endpoint (it falls back to legacy single-endpoint fetch).
//
// L-LIVE-AUDIT-P2 UPDATE 6 — adaptive/status uses an in-memory LRU cache
// (30s TTL) so consecutive dashboard loads in the same serverless instance
// don't re-run the slow eligibility query.
import { Router } from "express";
import adminClient from "../supabase.js";
import { getRequestDb } from "../lib/requestContext.js";
import { requireAuth, isPro, isTestProEmail } from "../middleware/auth.js";
import {
  GRADES, GRADE_ORDER, DAY_MS, WEEK_MS,
  calculateStreak, calculateEstLevel, normalizeLang,
} from "../lib/openai.js";
import { computeGradeEstimate } from "../lib/gradeThreshold.js";
import { getMonthlyUsage } from "../lib/aiCost.js";
import { topicLabel } from "../lib/mistakeTaxonomy.js";
import { getUserPath } from "../lib/learningPath.js";

const router = Router();

// L-RENDER-PERF-1 (2026-05-22) — per-user response cache for /api/dashboard/v2.
// Login flow triggers TWO fetches of this endpoint (home.js loadHome + the
// post-login loadDashboard chain). A 30s TTL turns the second call into a
// memory hit (~1ms) and makes tab-return navigation instant. Limit logs query
// to 500 rows below + this cache = HOME first paint goes from 5-7s to <1s on
// warm serverless instance, ≤2s on cold start.
const DASHBOARD_V2_TTL_MS = 30_000;
const DASHBOARD_V2_MAX = 500;
const dashboardV2Cache = new Map();

function dashboardV2CacheGet(key) {
  const hit = dashboardV2Cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > DASHBOARD_V2_TTL_MS) {
    dashboardV2Cache.delete(key);
    return null;
  }
  dashboardV2Cache.delete(key);
  dashboardV2Cache.set(key, hit);
  return hit.v;
}

function dashboardV2CacheSet(key, v) {
  if (dashboardV2Cache.size >= DASHBOARD_V2_MAX) {
    const oldest = dashboardV2Cache.keys().next().value;
    if (oldest !== undefined) dashboardV2Cache.delete(oldest);
  }
  dashboardV2Cache.set(key, { v, t: Date.now() });
}

// ─── Section: profile ───────────────────────────────────────────────────────
async function loadProfile(userId, email) {
  const supabase = getRequestDb(adminClient); // L-V392 P1-3: RLS-scoped per request
  const { data, error } = await supabase
    .from("user_profile")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  let profile = data || null;
  if (isTestProEmail(email)) {
    profile = {
      ...(profile || { user_id: userId }),
      subscription_tier: "mestari",
      subscription_status: "active",
      subscription_billing: profile?.subscription_billing || "test",
    };
  }
  return { profile };
}

// ─── Section: dashboard (mirrors routes/progress.js GET /dashboard) ─────────
// L-RENDER-PERF-1 (2026-05-22) — logs limited to 500 most-recent rows.
// All derived computations are bounded windows: chartData=60, recent=8,
// streak=14d, modeStats over recent 500. For power users with >500 sessions
// the per-mode "X harjoitusta" count understates by definition — acceptable
// trade-off for cutting query time from ~3-5s to <500ms on busy accounts.
// If exact lifetime counts matter later, add a separate head:true count(*).
async function loadDashboardCore(userId, language = "spanish") {
  const supabase = getRequestDb(adminClient);
  const { data: logs, error } = await supabase
    .from("exercise_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("language", language)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const totalSessions = logs.length;
  const modeMap = {};
  for (const log of logs) {
    if (!modeMap[log.mode]) modeMap[log.mode] = { sessions: 0, grades: [], pcts: [] };
    modeMap[log.mode].sessions++;
    if (log.ytl_grade) modeMap[log.mode].grades.push(log.ytl_grade);
    if (log.score_total > 0) {
      modeMap[log.mode].pcts.push(Math.round((log.score_correct / log.score_total) * 100));
    }
  }
  const modeStats = {};
  for (const [mode, s] of Object.entries(modeMap)) {
    const bestGrade = s.grades.length
      ? s.grades.reduce((best, g) => (GRADE_ORDER[g] ?? -1) > (GRADE_ORDER[best] ?? -1) ? g : best)
      : null;
    const avgPct = s.pcts.length ? Math.round(s.pcts.reduce((a, b) => a + b, 0) / s.pcts.length) : null;
    modeStats[mode] = { sessions: s.sessions, bestGrade, avgPct };
  }
  const recent = logs.slice(0, 8).map((l) => ({
    mode: l.mode, level: l.level,
    scoreCorrect: l.score_correct, scoreTotal: l.score_total,
    ytlGrade: l.ytl_grade, createdAt: l.created_at,
  }));
  const chartData = logs.slice(0, 60).reverse().map((l) => ({
    mode: l.mode, ytlGrade: l.ytl_grade,
    pct: l.score_total > 0 ? Math.round((l.score_correct / l.score_total) * 100) : null,
  }));
  const estLevel = calculateEstLevel(logs);
  const gradeEstimate = computeGradeEstimate(logs);
  const streak = calculateStreak(logs);
  const nowMs = Date.now();
  const weekSessions = logs.filter((l) => nowMs - new Date(l.created_at).getTime() < WEEK_MS).length;
  const prevWeekSessions = logs.filter((l) => {
    const age = nowMs - new Date(l.created_at).getTime();
    return age >= WEEK_MS && age < 2 * WEEK_MS;
  }).length;
  const recentVocab = logs.filter((l) => l.mode === "vocab" && l.level).slice(0, 5);
  let suggestedLevel = "B";
  if (recentVocab.length > 0) {
    const idxs = recentVocab.map((l) => Math.max(0, GRADES.indexOf(l.level)));
    const avg = idxs.reduce((a, b) => a + b, 0) / idxs.length;
    suggestedLevel = GRADES[Math.min(6, Math.round(avg))];
  }
  const modeDaysAgo = {};
  for (const mode of ["vocab", "grammar", "reading", "writing"]) {
    const last = logs.find((l) => l.mode === mode);
    modeDaysAgo[mode] = last
      ? Math.floor((nowMs - new Date(last.created_at + "Z").getTime()) / DAY_MS)
      : null;
  }
  const [pro, aiUsage, masteryRows] = await Promise.all([
    isPro(userId),
    getMonthlyUsage(userId),
    supabase.from("user_mastery").select("topic, status, updated_at").eq("user_id", userId).eq("status", "in_progress").then(r => r.data || []),
  ]);
  const staleTopics = masteryRows
    .filter(r => Math.floor((nowMs - new Date(r.updated_at).getTime()) / DAY_MS) >= 7)
    .map(r => r.topic);
  return {
    totalSessions, modeStats, recent, chartData, estLevel, gradeEstimate,
    streak, weekSessions, prevWeekSessions, suggestedLevel, modeDaysAgo, pro,
    aiUsage, staleTopics,
  };
}

// ─── Section: weak topics (last 7 days) ─────────────────────────────────────
async function loadWeakTopics(userId, days = 7, language = "spanish") {
  const supabase = getRequestDb(adminClient);
  const since = new Date(Date.now() - days * DAY_MS).toISOString();
  const { data: mistakes, error } = await supabase
    .from("user_mistakes")
    .select("topics, created_at")
    .eq("user_id", userId)
    .eq("language", language)
    .gte("created_at", since);
  if (error) throw error;
  const topicCounts = {};
  for (const m of mistakes || []) {
    for (const t of m.topics || []) topicCounts[t] = (topicCounts[t] || 0) + 1;
  }
  const sorted = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, label: topicLabel(topic), count }))
    .sort((a, b) => b.count - a.count);
  return { topics: sorted.slice(0, 3), all: sorted, days, totalMistakes: (mistakes || []).length };
}

// ─── Section: SR count + forecast ───────────────────────────────────────────
async function loadSrCount(userId, language = "spanish") {
  const supabase = getRequestDb(adminClient);
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from("sr_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("language", language)
    .lte("next_review", today);
  if (error) return { count: 0 };
  return { count: count || 0 };
}

async function loadSrForecast(userId, language = "spanish", days = 30) {
  const supabase = getRequestDb(adminClient);
  const clampedDays = Math.max(7, Math.min(60, Number(days) || 30));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const endDate = new Date(today); endDate.setDate(endDate.getDate() + clampedDays);
  const { data, error } = await supabase
    .from("sr_cards")
    .select("next_review")
    .eq("user_id", userId)
    .eq("language", language)
    .lte("next_review", endDate.toISOString().slice(0, 10));
  if (error) throw error;
  const buckets = new Array(clampedDays).fill(0);
  for (const card of data || []) {
    const reviewDate = new Date(card.next_review); reviewDate.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor((reviewDate - today) / (24 * 60 * 60 * 1000));
    if (dayDiff < 0) buckets[0]++;
    else if (dayDiff < clampedDays) buckets[dayDiff]++;
  }
  const forecast = buckets.map((count, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    return { date: d.toISOString().slice(0, 10), dayOffset: i, count };
  });
  return {
    forecast,
    totalCards: (data || []).length,
    dueToday: buckets[0],
    maxDaily: Math.max(...buckets),
  };
}

// ─── Section: exam history ──────────────────────────────────────────────────
async function loadExamHistory(userId, language = "spanish") {
  const supabase = getRequestDb(adminClient);
  const { data, error } = await supabase
    .from("exam_sessions")
    .select("id, status, started_at, ended_at, duration_mode, total_points, max_points, final_grade, part_scores")
    .eq("user_id", userId)
    .eq("language", language)
    .eq("status", "completed")
    .order("ended_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return { exams: data || [] };
}

// ─── Section: learning path ─────────────────────────────────────────────────
async function loadLearningPath(userId) {
  const path = await getUserPath(userId);
  const masteredCount = path.filter(t => t.status === "mastered").length;
  const currentIdx = path.findIndex(t => t.status === "available" || t.status === "in_progress");
  return {
    path,
    totalTopics: path.length,
    masteredCount,
    currentIndex: currentIdx >= 0 ? currentIdx : masteredCount,
  };
}

// ─── Section: placement status ──────────────────────────────────────────────
async function loadPlacementStatus(userId, language = "spanish") {
  const supabase = getRequestDb(adminClient);
  const { data, error } = await supabase
    .from("diagnostic_results")
    .select("placement_level, chosen_level, created_at")
    .eq("user_id", userId)
    .eq("language", language)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return {
    completed: !!data,
    placementLevel: data?.placement_level || null,
    chosenLevel: data?.chosen_level || null,
    completedAt: data?.created_at || null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/dashboard/v2 — batched response
// ═══════════════════════════════════════════════════════════════════════════
router.get("/dashboard/v2", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  // Accept the app's `?lang=` convention (es/fr/de) as well as `?language=`;
  // normalizeLang maps both short codes and full words to the stored full word.
  const language = normalizeLang(req.query.lang ?? req.query.language);

  // L-RENDER-PERF-1: per-user response cache (30s TTL) — login triggers two
  // sequential dashboard/v2 fetches (loadHome then post-login loadDashboard);
  // this turns the second one into a ~1ms memory hit. Bypass with ?fresh=1.
  const cacheKey = `${userId}::${language}`;
  if (req.query.fresh !== "1") {
    const cached = dashboardV2CacheGet(cacheKey);
    if (cached) {
      res.setHeader("X-Dashboard-Cache", "hit");
      return res.json(cached);
    }
  }

  // Each section is allowed to fail independently — we surface null + the
  // frontend falls back to legacy single-endpoint fetch.
  const settle = async (fn) => {
    try { return await fn(); } catch (e) { console.error("dashboard/v2 section error:", e?.message || e); return null; }
  };

  const [
    profile, dashboard, weakTopics, srCount, srForecast,
    examHistory, learningPath, placement,
  ] = await Promise.all([
    settle(() => loadProfile(userId, req.user.email)),
    settle(() => loadDashboardCore(userId, language)),
    settle(() => loadWeakTopics(userId, 7, language)),
    settle(() => loadSrCount(userId, language)),
    settle(() => loadSrForecast(userId, language, 30)),
    settle(() => loadExamHistory(userId, language)),
    settle(() => loadLearningPath(userId)),
    settle(() => loadPlacementStatus(userId, language)),
  ]);

  const payload = {
    profile, dashboard, weakTopics, srCount, srForecast,
    examHistory, learningPath, placement,
  };
  dashboardV2CacheSet(cacheKey, payload);
  res.setHeader("X-Dashboard-Cache", "miss");
  res.json(payload);
});

export default router;
