import { Router } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import supabase from "../supabase.js";
import { callOpenAI, LANG_LABEL } from "../lib/openai.js";
import { requireAuth, checkFeatureAccess, incrementFreeUsage } from "../middleware/auth.js";
import { requireSupportedLanguage, resolveLang } from "../middleware/language.js";
import { pointsToYoGrade } from "../lib/grading.js";

const router = Router();

const MAX_POINTS = 199; // 60 reading + 40 structure + 33 short + 66 long

// ─── Pre-generated exam content pools ──────────────────────────────────────
// Loaded once at server start. To expand the pools, add items to the JSON
// files in /data/examPools/. No code changes required.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadPool(name) {
  try {
    const raw = readFileSync(join(__dirname, "..", "data", "examPools", `${name}.json`), "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to load exam pool '${name}':`, err.message);
    return [];
  }
}

const POOLS = {
  reading: loadPool("reading"),
  structure: loadPool("structure"),
  shortWriting: loadPool("shortWriting"),
  longWriting: loadPool("longWriting"),
};

console.info(
  `[exam] Pools loaded — reading: ${POOLS.reading.length}, structure: ${POOLS.structure.length}, ` +
    `shortWriting: ${POOLS.shortWriting.length}, longWriting: ${POOLS.longWriting.length}`
);

// ─── Random pickers ────────────────────────────────────────────────────────

function pickOne(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  if (!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function buildReadingPart() {
  // Pick 1 text per level (C/M/E) for proper YO-koe difficulty progression
  const byLevel = { C: [], M: [], E: [] };
  for (const t of POOLS.reading) {
    if (byLevel[t.level]) byLevel[t.level].push(t);
  }

  const texts = [];
  if (byLevel.C.length) texts.push(pickOne(byLevel.C));
  if (byLevel.M.length) texts.push(pickOne(byLevel.M));
  if (byLevel.E.length) texts.push(pickOne(byLevel.E));

  // Safety: if any level is missing, fill from whole pool
  if (texts.length < 3 && POOLS.reading.length >= 3) {
    const used = new Set(texts.map((t) => t?.id));
    for (const t of POOLS.reading) {
      if (texts.length >= 3) break;
      if (!used.has(t.id)) { texts.push(t); used.add(t.id); }
    }
  }

  return { type: "reading", texts: texts.filter(Boolean), maxPoints: 60 };
}

function buildStructurePart() {
  const exercises = pickN(POOLS.structure, 20);
  return { type: "structure", exercises, maxPoints: 40 };
}

function buildShortWritingPart() {
  const task = pickOne(POOLS.shortWriting);
  return { type: "shortWriting", task, maxPoints: 33 };
}

function buildLongWritingPart() {
  const task = pickOne(POOLS.longWriting);
  return { type: "longWriting", task, maxPoints: 66 };
}

// Grade mapping comes from lib/grading.js (pointsToYoGrade). Delegating here
// so vocab /grade and full-exam grading share the same thresholds.
function pointsToGrade(points) {
  return pointsToYoGrade(points, MAX_POINTS);
}

// ─── Grade reading answers ─────────────────────────────────────────────────

function gradeReading(partsData, answers) {
  const readingData = partsData[0];
  let totalCorrect = 0;
  let totalQuestions = 0;

  for (let ti = 0; ti < readingData.texts.length; ti++) {
    const text = readingData.texts[ti];
    for (let qi = 0; qi < text.questions.length; qi++) {
      const q = text.questions[qi];
      const key = `1_${ti}_${qi}`;
      const userAnswer = (answers[key] || "").trim().toUpperCase();
      totalQuestions++;

      if (q.type === "multiple_choice") {
        if (userAnswer === (q.correct || "").trim().toUpperCase()) totalCorrect++;
      } else if (q.type === "true_false") {
        const correct = q.correct === true ? "TRUE" : "FALSE";
        if (userAnswer === correct) totalCorrect++;
      } else if (q.type === "short_answer") {
        const accepted = (q.acceptedAnswers || []).map(a => a.trim().toLowerCase());
        if (accepted.some(a => userAnswer.toLowerCase().includes(a) || a.includes(userAnswer.toLowerCase()))) {
          totalCorrect++;
        }
      }
    }
  }

  const score = Math.round((totalCorrect / Math.max(totalQuestions, 1)) * 60);
  return { score, maxPoints: 60, correct: totalCorrect, total: totalQuestions };
}

// ─── Grade structure answers ────────────────────────────────────────────────

function gradeStructure(partsData, answers) {
  const structData = partsData[1];
  let correct = 0;

  for (let i = 0; i < structData.exercises.length; i++) {
    const q = structData.exercises[i];
    const key = `2_${i}`;
    const userAnswer = (answers[key] || "").trim().toUpperCase();
    if (userAnswer === (q.correct || "").trim().toUpperCase()) correct++;
  }

  const score = correct * 2;
  return { score, maxPoints: 40, correct, total: structData.exercises.length };
}

// ─── Grade writing with AI ──────────────────────────────────────────────────

async function gradeWriting(task, studentText, isShort, lang = "es") {
  const maxScore = isShort ? 33 : 66;
  const charCount = studentText.replace(/\s/g, "").length;
  const langLabel = LANG_LABEL[lang] || LANG_LABEL.es;
  const langEn = langLabel.en;

  const shortSteps = [0, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33];
  const longSteps = [0, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66];
  const validSteps = isShort ? shortSteps : longSteps;

  if (!studentText || studentText.trim().length < 5) {
    return { finalScore: 0, maxScore, ytlGrade: "I", overallFeedback: "Vastausta ei annettu tai se oli liian lyhyt." };
  }

  // YTL lyhyt oppimäärä does not penalise exceeding the upper char limit —
  // the limit is guidance, not a deduction rule. Soft-cap: no extra points
  // past max, but no penalty either. (Previously we deducted 3/6 pts.)
  const prompt = `You are grading a Finnish high school student's ${langEn} writing for the yo-koe exam (lyhyt oppimäärä).

TASK:
${task.situation}
Instructions: ${task.prompt}
Requirements: ${(task.requirements || []).join(", ")}
Task type: ${isShort ? "Short task (max 33 points)" : "Long task (max 66 points)"}

STUDENT'S TEXT (${charCount} chars without spaces):
"""
${studentText}
"""

VALID SCORE STEPS: ${validSteps.join(" — ")}

Grade using YTL criteria: viestinnällisyys, tehtävänanto, kielelliset resurssit. Do NOT penalise exceeding the character guideline — that is guidance, not a deduction rule.

Return ONLY JSON:
{
  "rawScore": <valid step>,
  "finalScore": <same as rawScore, nearest valid step>,
  "maxScore": ${maxScore},
  "ytlGrade": "<I/A/B/C/M/E/L>",
  "overallFeedback": "<2-3 sentences in Finnish>"
}`;

  try {
    const result = await callOpenAI(prompt, 1000);
    // Recompute ytlGrade server-side from finalScore to guarantee consistency
    // with the shared threshold table in lib/grading.js. Trust but verify.
    if (result && typeof result.finalScore === "number") {
      result.ytlGrade = pointsToYoGrade(result.finalScore, maxScore);
    }
    return result;
  } catch {
    const ratio = Math.min(charCount / task.charMax, 1);
    const est = Math.round(ratio * maxScore * 0.5);
    const closest = validSteps.reduce((prev, curr) => Math.abs(curr - est) < Math.abs(prev - est) ? curr : prev);
    return { finalScore: closest, maxScore, ytlGrade: pointsToYoGrade(closest, maxScore), overallFeedback: "Arviointi epäonnistui, tulos on arvio." };
  }
}

// ─── POST /api/exam/start ──────────────────────────────────────────────────

router.post("/start", requireAuth, async (req, res) => {
  if (requireSupportedLanguage(req, res)) return;

  const { durationMode = "demo" } = req.body;
  const userId = req.user.userId;

  const examAccess = await checkFeatureAccess(userId, "exam");
  if (!examAccess.allowed) {
    return res.status(403).json({
      error: examAccess.reason,
      tier_required: examAccess.requiredTier || null,
      current_tier: examAccess.currentTier,
      used: examAccess.used,
      limit: examAccess.limit,
    });
  }

  try {
    const { data: active } = await supabase
      .from("exam_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .limit(1);

    if (active && active.length > 0) {
      return res.status(409).json({ error: "active_session", sessionId: active[0].id, message: "Sinulla on jo aktiivinen koe." });
    }

    // Sanity check — if any pool is empty, we can't build a full exam
    if (!POOLS.reading.length || !POOLS.structure.length || !POOLS.shortWriting.length || !POOLS.longWriting.length) {
      return res.status(503).json({ error: "Koesisältö ei ole saatavilla. Yritä myöhemmin uudelleen." });
    }

    // Assemble 4 parts from pre-generated pools (instant, no AI call)
    const parts = [
      buildReadingPart(),
      buildStructurePart(),
      buildShortWritingPart(),
      buildLongWritingPart(),
    ];

    const secondsRemaining = durationMode === "full" ? 6 * 60 * 60 : 2 * 60 * 60;

    const { data: session, error } = await supabase
      .from("exam_sessions")
      .insert({
        user_id: userId,
        status: "in_progress",
        duration_mode: durationMode === "full" ? "full" : "demo",
        seconds_remaining: secondsRemaining,
        current_part: 1,
        parts_data: parts,
        answers: {},
        max_points: MAX_POINTS,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ sessionId: session.id, partsData: parts, secondsRemaining });
  } catch (err) {
    console.error("Exam start error:", err.message);
    res.status(500).json({ error: err.message || "Kokeen luonti epäonnistui" });
  }
});

// ─── POST /api/exam/save ───────────────────────────────────────────────────

router.post("/save", requireAuth, async (req, res) => {
  const { sessionId, answers, secondsRemaining, currentPart } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId vaaditaan" });

  try {
    const { error } = await supabase
      .from("exam_sessions")
      .update({ answers: answers || {}, seconds_remaining: secondsRemaining, current_part: currentPart })
      .eq("id", sessionId)
      .eq("user_id", req.user.userId)
      .eq("status", "in_progress");

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("Exam save error:", err.message);
    res.status(500).json({ error: "Tallennus epäonnistui" });
  }
});

// ─── POST /api/exam/resume ─────────────────────────────────────────────────

router.post("/resume", requireAuth, async (req, res) => {
  try {
    const { data: session, error } = await supabase
      .from("exam_sessions")
      .select("*")
      .eq("user_id", req.user.userId)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !session) return res.json({ active: false });

    res.json({
      active: true,
      sessionId: session.id,
      partsData: session.parts_data,
      answers: session.answers,
      secondsRemaining: session.seconds_remaining,
      currentPart: session.current_part,
      durationMode: session.duration_mode,
    });
  } catch {
    res.json({ active: false });
  }
});

// ─── POST /api/exam/submit ─────────────────────────────────────────────────

router.post("/submit", requireAuth, async (req, res) => {
  if (requireSupportedLanguage(req, res)) return;
  const lang = resolveLang(req);

  const { sessionId, answers } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId vaaditaan" });

  try {
    const { data: session, error: fetchErr } = await supabase
      .from("exam_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", req.user.userId)
      .single();

    if (fetchErr || !session) return res.status(404).json({ error: "Koetta ei löytynyt" });

    const partsData = session.parts_data;
    const finalAnswers = answers || session.answers || {};

    const readingResult = gradeReading(partsData, finalAnswers);
    const structureResult = gradeStructure(partsData, finalAnswers);

    const shortText = finalAnswers["3_writing"] || "";
    const shortResult = await gradeWriting(partsData[2].task, shortText, true, lang);

    const longText = finalAnswers["4_writing"] || "";
    const longResult = await gradeWriting(partsData[3].task, longText, false, lang);

    const partScores = {
      reading: readingResult,
      structure: structureResult,
      shortWriting: { score: shortResult.finalScore, maxPoints: 33, feedback: shortResult.overallFeedback },
      longWriting: { score: longResult.finalScore, maxPoints: 66, feedback: longResult.overallFeedback },
    };

    const totalPoints = readingResult.score + structureResult.score + shortResult.finalScore + longResult.finalScore;
    const finalGrade = pointsToGrade(totalPoints);

    const { error: updateErr } = await supabase
      .from("exam_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        answers: finalAnswers,
        part_scores: partScores,
        total_points: totalPoints,
        max_points: MAX_POINTS,
        final_grade: finalGrade,
      })
      .eq("id", sessionId)
      .eq("user_id", req.user.userId);

    if (updateErr) throw updateErr;

    // Increment free usage after all AI grading has succeeded and the session
    // has been persisted. checkFeatureAccess is cheap (single DB read) — we
    // repeat it here because /submit is independent of /start and a user
    // could theoretically submit an old session after upgrading.
    {
      const access = await checkFeatureAccess(userId, "exam");
      if (access.tier === "free") await incrementFreeUsage(userId, "exam");
    }

    res.json({ totalPoints, maxPoints: MAX_POINTS, finalGrade, partScores });
  } catch (err) {
    console.error("Exam submit error:", err.message);
    res.status(500).json({ error: err.message || "Arviointi epäonnistui" });
  }
});

// ─── POST /api/exam/discard-active ─────────────────────────────────────────
// L-LIVE-AUDIT-P0 UPDATE 1 — Pro user with an in-progress session previously
// got blocked by `409 active_session` when they tried to start a fresh exam.
// The brief replaces the native window.confirm() umpikuja with a branded
// modal that offers "Jatka kesken olevaa" or "Aloita uusi koe"; this endpoint
// is what the secondary action calls. Idempotent: returns 200 even when no
// active session exists. The row stays in the DB with status='abandoned' so
// history remains audit-accurate.
router.post("/discard-active", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  try {
    const { data, error } = await supabase
      .from("exam_sessions")
      .update({ status: "abandoned", ended_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .select("id");

    if (error) throw error;
    res.json({ ok: true, abandoned: data?.length || 0 });
  } catch (err) {
    console.error("Exam discard error:", err.message);
    res.status(500).json({ error: err.message || "Kokeen hylkäys epäonnistui" });
  }
});

// ─── GET /api/exam/history ─────────────────────────────────────────────────

router.get("/history", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("exam_sessions")
      .select("id, status, started_at, ended_at, duration_mode, total_points, max_points, final_grade, part_scores")
      .eq("user_id", req.user.userId)
      .eq("status", "completed")
      .order("ended_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ exams: data || [] });
  } catch (err) {
    console.error("Exam history error:", err.message);
    res.status(500).json({ error: "Historia ei saatavilla" });
  }
});

export default router;
