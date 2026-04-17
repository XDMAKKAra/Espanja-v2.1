import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth, isPro } from "../middleware/auth.js";
import { GRADES, GRADE_ORDER, DAY_MS, WEEK_MS, calculateStreak, calculateEstLevel } from "../lib/openai.js";
import { computeEligibility, LEVEL_ORDER } from "../lib/adaptive.js";

const router = Router();

const VALID_MODES = new Set(["vocab", "grammar", "reading", "writing", "exam"]);
const ADAPTIVE_MODES = new Set(["vocab", "grammar", "reading"]);

router.post("/progress", requireAuth, async (req, res) => {
  const { mode, level, scoreCorrect, scoreTotal, ytlGrade } = req.body;

  if (!mode || !VALID_MODES.has(mode)) {
    return res.status(400).json({ error: "Virheellinen harjoittelutapa" });
  }

  const { error } = await supabase.from("exercise_logs").insert({
    user_id: req.user.userId,
    mode,
    level: level ?? null,
    score_correct: scoreCorrect ?? null,
    score_total: scoreTotal ?? null,
    ytl_grade: ytlGrade ?? null,
  });
  if (error) return res.status(500).json({ error: "Failed to save progress" });

  // ─── Adaptive: increment questions_at_level + compute status ────────────
  let adaptive = null;
  if (ADAPTIVE_MODES.has(mode) && scoreTotal > 0) {
    try {
      // Increment questions_at_level
      const { data: ulp } = await supabase
        .from("user_level_progress")
        .select("*")
        .eq("user_id", req.user.userId)
        .eq("mode", mode)
        .single();

      if (ulp) {
        await supabase
          .from("user_level_progress")
          .update({ questions_at_level: ulp.questions_at_level + (scoreTotal || 0) })
          .eq("user_id", req.user.userId)
          .eq("mode", mode);

        // Fetch recent session pcts for current level
        const { data: logs } = await supabase
          .from("exercise_logs")
          .select("score_correct, score_total")
          .eq("user_id", req.user.userId)
          .eq("mode", mode)
          .eq("level", ulp.current_level)
          .gt("score_total", 0)
          .order("created_at", { ascending: false })
          .limit(20);

        const sessionPcts = (logs || []).map((l) =>
          Math.round((l.score_correct / l.score_total) * 100)
        );

        const { count: sessionsAtLevel } = await supabase
          .from("exercise_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", req.user.userId)
          .eq("mode", mode)
          .eq("level", ulp.current_level)
          .gte("created_at", ulp.level_started_at);

        adaptive = computeEligibility({
          currentLevel: ulp.current_level,
          sessionPcts,
          questionsAtLevel: ulp.questions_at_level + (scoreTotal || 0),
          levelStartedAt: new Date(ulp.level_started_at),
          masteryTestEligibleAt: ulp.mastery_test_eligible_at
            ? new Date(ulp.mastery_test_eligible_at)
            : null,
          lastDemotionAt: ulp.last_demotion_at
            ? new Date(ulp.last_demotion_at)
            : null,
          sessionsAtLevel: sessionsAtLevel || 0,
          adaptiveEnabled: ulp.adaptive_enabled,
        });

        // Handle silent demotion
        if (adaptive.status === "needs_demotion") {
          const prevLevel = LEVEL_ORDER[LEVEL_ORDER.indexOf(ulp.current_level) - 1];
          if (prevLevel) {
            await supabase
              .from("user_level_progress")
              .update({
                current_level: prevLevel,
                level_started_at: new Date().toISOString(),
                questions_at_level: 0,
                last_demotion_at: new Date().toISOString(),
              })
              .eq("user_id", req.user.userId)
              .eq("mode", mode);
            adaptive.demotedTo = prevLevel;
          }
        }
      }
    } catch { /* don't break progress saving */ }
  }

  res.json({ ok: true, adaptive });
});

router.get("/dashboard", requireAuth, async (req, res) => {
  const userId = req.user.userId;

  const { data: logs, error } = await supabase
    .from("exercise_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to load dashboard" });

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
    mode: l.mode,
    level: l.level,
    scoreCorrect: l.score_correct,
    scoreTotal: l.score_total,
    ytlGrade: l.ytl_grade,
    createdAt: l.created_at,
  }));

  const chartData = logs.slice(0, 60).reverse().map((l) => ({
    mode: l.mode,
    ytlGrade: l.ytl_grade,
    pct: l.score_total > 0 ? Math.round((l.score_correct / l.score_total) * 100) : null,
  }));

  const estLevel = calculateEstLevel(logs);
  const streak = calculateStreak(logs);

  const nowMs = Date.now();
  const weekSessions = logs.filter(
    (l) => nowMs - new Date(l.created_at).getTime() < WEEK_MS
  ).length;
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

  const pro = await isPro(userId);

  res.json({
    totalSessions, modeStats, recent, chartData, estLevel,
    streak, weekSessions, prevWeekSessions, suggestedLevel, modeDaysAgo, pro,
  });
});

export default router;
