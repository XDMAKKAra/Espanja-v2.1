import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import {
  computeEligibility,
  scoreMasteryTest,
  LEVEL_ORDER,
  PROMOTION_THRESHOLDS,
} from "../lib/adaptive.js";
import {
  callOpenAI,
  LEVEL_DESCRIPTIONS,
  TOPIC_CONTEXT,
  LANGUAGE_META,
} from "../lib/openai.js";

const router = Router();

const VALID_MODES = new Set(["vocab", "grammar", "reading"]);

// ─── Helper: fetch or init user_level_progress ─────────────────────────────

async function getOrCreateProgress(userId, mode) {
  const { data, error } = await supabase
    .from("user_level_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("mode", mode)
    .single();

  if (data) return data;

  // Create default row
  const row = {
    user_id: userId,
    mode,
    current_level: "B",
    level_started_at: new Date().toISOString(),
    questions_at_level: 0,
    mastery_test_eligible_at: null,
    last_demotion_at: null,
    adaptive_enabled: true,
  };
  const { data: created, error: insertErr } = await supabase
    .from("user_level_progress")
    .upsert(row)
    .select()
    .single();

  return created || row;
}

// ─── Helper: fetch recent session percentages ──────────────────────────────

async function getSessionPcts(userId, mode, level, limit = 20) {
  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("score_correct, score_total, created_at")
    .eq("user_id", userId)
    .eq("mode", mode)
    .eq("level", level)
    .gt("score_total", 0)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!logs || logs.length === 0) return [];
  return logs.map((l) => Math.round((l.score_correct / l.score_total) * 100));
}

// ─── Helper: count sessions at level ───────────────────────────────────────

async function countSessionsAtLevel(userId, mode, level, since) {
  const { count } = await supabase
    .from("exercise_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("mode", mode)
    .eq("level", level)
    .gte("created_at", since);
  return count || 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/adaptive/status?mode=vocab
// ═══════════════════════════════════════════════════════════════════════════

router.get("/adaptive/status", requireAuth, async (req, res) => {
  const { mode } = req.query;
  if (!mode || !VALID_MODES.has(mode)) {
    return res.status(400).json({ error: "Virheellinen mode" });
  }

  try {
    const progress = await getOrCreateProgress(req.user.userId, mode);
    const sessionPcts = await getSessionPcts(req.user.userId, mode, progress.current_level);
    const sessionsAtLevel = await countSessionsAtLevel(
      req.user.userId, mode, progress.current_level, progress.level_started_at
    );

    const eligibility = computeEligibility({
      currentLevel: progress.current_level,
      sessionPcts,
      questionsAtLevel: progress.questions_at_level,
      levelStartedAt: new Date(progress.level_started_at),
      masteryTestEligibleAt: progress.mastery_test_eligible_at
        ? new Date(progress.mastery_test_eligible_at)
        : null,
      lastDemotionAt: progress.last_demotion_at
        ? new Date(progress.last_demotion_at)
        : null,
      sessionsAtLevel,
      adaptiveEnabled: progress.adaptive_enabled,
    });

    res.json(eligibility);
  } catch (err) {
    console.error("Adaptive status error:", err.message);
    res.status(500).json({ error: "Tilan haku epäonnistui" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/adaptive/mastery-test/start { mode }
// (Renamed from /mastery-test/start to avoid collision with
//  routes/exercises.js's learning-path mastery-test endpoint.)
// ═══════════════════════════════════════════════════════════════════════════

router.post("/adaptive/mastery-test/start", requireAuth, aiLimiter, async (req, res) => {
  const { mode } = req.body;
  if (!mode || !VALID_MODES.has(mode)) {
    return res.status(400).json({ error: "Virheellinen mode" });
  }

  try {
    const progress = await getOrCreateProgress(req.user.userId, mode);
    const sessionPcts = await getSessionPcts(req.user.userId, mode, progress.current_level);
    const sessionsAtLevel = await countSessionsAtLevel(
      req.user.userId, mode, progress.current_level, progress.level_started_at
    );

    const eligibility = computeEligibility({
      currentLevel: progress.current_level,
      sessionPcts,
      questionsAtLevel: progress.questions_at_level,
      levelStartedAt: new Date(progress.level_started_at),
      masteryTestEligibleAt: progress.mastery_test_eligible_at
        ? new Date(progress.mastery_test_eligible_at)
        : null,
      lastDemotionAt: progress.last_demotion_at
        ? new Date(progress.last_demotion_at)
        : null,
      sessionsAtLevel,
      adaptiveEnabled: progress.adaptive_enabled,
    });

    if (eligibility.status !== "ready_for_mastery_test") {
      return res.status(400).json({ error: "Et ole vielä valmis tasokokeeseen", status: eligibility.status });
    }

    const currentLevel = progress.current_level;
    const nextLevel = eligibility.nextLevel;
    const lang = LANGUAGE_META["spanish"];
    const currentDesc = LEVEL_DESCRIPTIONS[currentLevel];
    const nextDesc = LEVEL_DESCRIPTIONS[nextLevel];

    // Generate 10 questions: 6 at next level, 4 at current level
    const prompt = `You are generating a mastery test (tasokoe) for a Finnish student studying ${lang.name} (yo-koe, lyhyt oppimäärä).

This test determines if the student can advance from level ${currentLevel} to level ${nextLevel}.

Generate EXACTLY 10 vocabulary exercises:
- Questions 1-6: Level ${nextLevel} (${nextDesc}) — HARDER questions at the target level
- Questions 7-10: Level ${currentLevel} (${currentDesc}) — questions at the current level

Each question must have a "isHigherLevel" field: true for questions 1-6, false for questions 7-10.

Use a MIX of types: "context", "translate", "gap", "meaning"

TYPE "context": Show a ${lang.name} sentence with a target word. Ask what it means.
TYPE "translate": Finnish word/phrase → which ${lang.name} option is correct.
TYPE "gap": ${lang.name} sentence with ___ blank → fill correctly.
TYPE "meaning": ${lang.name} word → what does it mean in Finnish.

Rules:
- Options labeled A) B) C) D)
- Difficulty MUST match the level descriptions
- Explanations brief in Finnish
- Shuffle question types — don't group all of one type together

Return ONLY a JSON array (no markdown):
[
  {
    "id": 1,
    "type": "context",
    "isHigherLevel": true,
    "question": "Lauseessa '...' — mitä tarkoittaa '...'?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": "A",
    "explanation": "..."
  }
]`;

    const exercises = await callOpenAI(prompt, 3000);

    // Ensure isHigherLevel flags
    const tagged = (Array.isArray(exercises) ? exercises : []).map((ex, i) => ({
      ...ex,
      isHigherLevel: ex.isHigherLevel ?? i < 6,
    }));

    // Save attempt to DB
    const { data: attempt, error: attemptErr } = await supabase
      .from("mastery_test_attempts")
      .insert({
        user_id: req.user.userId,
        mode,
        from_level: currentLevel,
        to_level: nextLevel,
        score_pct: 0,
        higher_level_score_pct: 0,
        passed: false,
      })
      .select()
      .single();

    if (attemptErr) {
      console.error("Failed to create mastery test attempt:", attemptErr.message);
      return res.status(500).json({ error: "Tasokokeen luonti epäonnistui" });
    }

    res.json({
      exercises: tagged,
      attemptId: attempt.id,
      fromLevel: currentLevel,
      toLevel: nextLevel,
    });
  } catch (err) {
    console.error("Mastery test start error:", err.message);
    res.status(500).json({ error: err.message || "Tasokokeen luonti epäonnistui" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/adaptive/mastery-test/submit { attemptId, answers }
// ═══════════════════════════════════════════════════════════════════════════

router.post("/adaptive/mastery-test/submit", requireAuth, async (req, res) => {
  const { attemptId, answers } = req.body;

  if (!attemptId || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Virheelliset tiedot" });
  }

  try {
    // Fetch the attempt
    const { data: attempt } = await supabase
      .from("mastery_test_attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("user_id", req.user.userId)
      .single();

    if (!attempt) {
      return res.status(404).json({ error: "Tasokoeyritysta ei löytynyt" });
    }

    // Score using pure function
    const { passed, scorePct, higherLevelPct } = scoreMasteryTest(answers);

    // Update attempt record
    await supabase
      .from("mastery_test_attempts")
      .update({
        score_pct: scorePct,
        higher_level_score_pct: higherLevelPct,
        passed,
      })
      .eq("id", attemptId);

    const mode = attempt.mode;
    let newLevel = attempt.from_level;

    if (passed) {
      // Promote: update user_level_progress
      newLevel = attempt.to_level;
      await supabase
        .from("user_level_progress")
        .update({
          current_level: newLevel,
          level_started_at: new Date().toISOString(),
          questions_at_level: 0,
          mastery_test_eligible_at: null,
        })
        .eq("user_id", req.user.userId)
        .eq("mode", mode);
    } else {
      // Failed: set cooldown of 3 days
      const cooldown = new Date();
      cooldown.setDate(cooldown.getDate() + 3);
      await supabase
        .from("user_level_progress")
        .update({
          mastery_test_eligible_at: cooldown.toISOString(),
        })
        .eq("user_id", req.user.userId)
        .eq("mode", mode);
    }

    res.json({ passed, scorePct, higherLevelPct, newLevel });
  } catch (err) {
    console.error("Mastery test submit error:", err.message);
    res.status(500).json({ error: "Tasokokeen arviointi epäonnistui" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/adaptive/dismiss { mode }
// ═══════════════════════════════════════════════════════════════════════════

router.post("/adaptive/dismiss", requireAuth, async (req, res) => {
  const { mode } = req.body;
  if (!mode || !VALID_MODES.has(mode)) {
    return res.status(400).json({ error: "Virheellinen mode" });
  }

  try {
    const cooldown = new Date();
    cooldown.setDate(cooldown.getDate() + 7);

    await supabase
      .from("user_level_progress")
      .update({
        mastery_test_eligible_at: cooldown.toISOString(),
      })
      .eq("user_id", req.user.userId)
      .eq("mode", mode);

    res.json({ ok: true });
  } catch (err) {
    console.error("Adaptive dismiss error:", err.message);
    res.status(500).json({ error: "Virhe" });
  }
});

export default router;
