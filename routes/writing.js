import { Router } from "express";
import { callOpenAI, getUserProfileContext, LANGUAGE_META, VALID_LANGUAGES } from "../lib/openai.js";
import { buildGradingPrompt, processGradingResult, computeScoreRange, MICRO_CHAR_FLOOR, SHORT_MAX, LONG_MAX } from "../lib/writingGrading.js";
import { buildFewShotBlock } from "../lib/gradingAnchors.js";
import { requireAuth, requirePro, checkFeatureAccess, incrementFreeUsage } from "../middleware/auth.js";
import { requireSupportedLanguage, resolveLang } from "../middleware/language.js";
import { aiStrictLimiter, aiGlobalDailyLimiter } from "../middleware/rateLimit.js";
import { checkMonthlyCostLimit } from "../middleware/costLimit.js";
import { logAiUsage } from "../lib/aiCost.js";
import { pickWritingTaskFromBank } from "../lib/writingBank.js";

const router = Router();

const VALID_TASK_TYPES = new Set(["short", "long"]);

// L-V354 — graded writing now runs the validated pipeline: gpt-5.4-mini +
// few-shot anchors + native-scale ytl_points. This is the exact pipeline the
// V351 validation data was generated on, which is what makes the coverage-
// calibrated SCORE_RANGE_CAL offsets (lib/writingGrading.js) valid in production.
// The few-shot block is static, so build it once at module load.
const GRADING_MODEL = "gpt-5.4-mini";
const FEWSHOT = buildFewShotBlock();

router.post("/writing-task", requireAuth, aiStrictLimiter, aiGlobalDailyLimiter, checkMonthlyCostLimit, async (req, res) => {
  if (requireSupportedLanguage(req, res)) return;

  const { taskType = "short", topic = "general", language = "spanish", recentWeaknesses = [] } = req.body;
  const lang = resolveLang(req);

  const access = await checkFeatureAccess(req.user.userId, "writing");
  if (!access.allowed) {
    return res.status(403).json({
      error: access.reason,
      tier_required: access.requiredTier || null,
      current_tier: access.currentTier,
      used: access.used,
      limit: access.limit,
    });
  }

  if (!VALID_TASK_TYPES.has(taskType)) return res.status(400).json({ error: "Virheellinen tehtävätyyppi (short/long)" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });

  const langMeta = LANGUAGE_META[language];
  const isShort = taskType === "short";
  const maxPoints = isShort ? SHORT_MAX : LONG_MAX;
  const charRange = isShort ? "160–240" : "300–450";
  const profileCtx = await getUserProfileContext(req.user?.userId);

  // Adaptive nudge — derive from recent error category counts so the next
  // task gently forces the structures the student has been getting wrong.
  // Categories: grammar | vocabulary | spelling | register
  const CATEGORY_NUDGES = {
    grammar:    "tense agreement and verb conjugation choices (preterite/imperfect contrast, ser/estar, subjunctive triggers)",
    vocabulary: "topic-specific vocabulary and avoiding repetition / anglicisms",
    spelling:   "accents, ñ vs n, and frequently miswritten words",
    register:   "formality (tú vs usted), text-type conventions, greeting/closing forms",
  };
  let weaknessLine = "";
  if (Array.isArray(recentWeaknesses) && recentWeaknesses.length > 0) {
    const focuses = recentWeaknesses
      .map(w => CATEGORY_NUDGES[w?.category])
      .filter(Boolean);
    if (focuses.length > 0) {
      weaknessLine = `\nADAPTIVE FOCUS: This student has shown recent weakness in: ${focuses.join("; ")}. Pick a situation that NATURALLY requires these structures, but do NOT mention this to the student.\n`;
    }
  }

  const prompt = `Generate ONE realistic ${langMeta.name} yo-koe writing task for Finnish students (lyhyt oppimäärä, ${langMeta.yearsStudied} of ${langMeta.name}).
${profileCtx}
${weaknessLine}
Task type: ${isShort ? "SHORT task (lyhyt kirjoitelma)" : "LONG task (pitkä kirjoitelma)"}
Character limit: ${charRange} characters (spaces and line breaks NOT counted)
Max points: ${maxPoints}

${isShort ? `SHORT TASK RULES:
- Should be a SHORT practical message/text: email to a stranger, message to a neighbor, short note, social media message, apology, congratulations
- Must have a clear SITUATION and RECIPIENT
- Give 2-3 specific things to mention in the response` : `LONG TASK RULES:
- Should be a LONGER text: forum comment, TripAdvisor review, opinion piece, letter with explanation
- Must require taking a STANCE or sharing multiple perspectives
- Give 2-3 angles to explore`}

Return ONLY JSON:
{
  "taskType": "${taskType}",
  "points": ${maxPoints},
  "charMin": ${isShort ? 160 : 300},
  "charMax": ${isShort ? 240 : 450},
  "situation": "Brief Finnish context sentence explaining the situation (1-2 sentences in Finnish)",
  "prompt": "The actual task instruction in ${langMeta.name} (what they must write)",
  "requirements": ["requirement 1 in Finnish", "requirement 2 in Finnish", "requirement 3 in Finnish"],
  "textType": "e.g. sähköpostiviesti / foorumikommentti / TripAdvisor-arvio"
}`;

  try {
    // Static bank first — pre-generated prompts at
    // data/exam-pools/writing-tasks/{lang}/{type}.json. Zero AI cost.
    // Bank picks weakness-aware when the client passes recentWeaknesses;
    // otherwise random-unseen, falling back to repeat as a last resort.
    const recentIds = Array.isArray(req.body?.recentIds) ? req.body.recentIds : [];
    const banked = pickWritingTaskFromBank({
      language,
      taskType,
      recentIds,
      weaknessCategories: recentWeaknesses,
    });
    if (banked) {
      if (access.tier === "free") await incrementFreeUsage(req.user.userId, "writing");
      return res.json({ task: banked, source: "static-bank" });
    }

    const task = await callOpenAI(prompt, 1000);
    logAiUsage(req.user?.userId, "writing-task", task._usage).catch(() => {});
    delete task._usage;
    if (access.tier === "free") await incrementFreeUsage(req.user.userId, "writing");
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate writing task" });
  }
});

router.post("/grade-writing", requireAuth, aiStrictLimiter, aiGlobalDailyLimiter, checkMonthlyCostLimit, async (req, res) => {
  if (requireSupportedLanguage(req, res)) return;
  const lang = resolveLang(req);

  const { task, studentText } = req.body;

  if (!task || !studentText || typeof studentText !== "string" || studentText.trim().length === 0) {
    return res.status(400).json({ error: "Tehtävä ja vastaus vaaditaan" });
  }

  // L-V346 — student's nickname for humane, name-addressed feedback. Only used
  // to personalise prose, never for auth. Sanitise: first token, letters only,
  // capped, newlines/quotes stripped so it can't escape the prompt.
  const studentName = String(req.body.studentName || "")
    .replace(/[\r\n"'`{}]/g, " ")
    .trim()
    .split(/\s+/)[0]
    .slice(0, 40)
    .replace(/[^\p{L}\p{M}-]/gu, "");
  if (!task.taskType || !task.charMin || !task.charMax || !task.points) {
    return res.status(400).json({ error: "Virheellinen tehtävädata" });
  }

  const access = await checkFeatureAccess(req.user.userId, "writing");
  if (!access.allowed) {
    return res.status(403).json({
      error: access.reason,
      tier_required: access.requiredTier || null,
      current_tier: access.currentTier,
      used: access.used,
      limit: access.limit,
    });
  }

  const isShort = task.taskType === "short";
  const charCount = studentText.replace(/\s/g, "").length;

  // L-V354 — few-shot anchors + native-scale scoring so the model emits
  // ytl_points on the 0–33 / 0–66 scale we build the display range around.
  const prompt = buildGradingPrompt(task, studentText, isShort, lang, studentName, {
    nativeScale: true,
    fewShotBlock: FEWSHOT,
  });

  try {
    // Per puheo-ai-prompt skill: graders force a JSON object response so we don't
    // have to regex strip markdown fences. gpt-5.4-mini ignores temperature (uses
    // its default) — callOpenAI handles the gpt-5 token/temperature differences.
    const aiResult = await callOpenAI(prompt, 2500, {
      temperature: 0.2,
      responseFormat: { type: "json_object" },
      model: GRADING_MODEL,
    });
    logAiUsage(req.user?.userId, "grade-writing", aiResult._usage).catch(() => {});
    delete aiResult._usage;
    const result = processGradingResult(aiResult, charCount, task.charMin, isShort, studentText);
    result.originalText = studentText;

    // Native-scale prediction → coverage-calibrated display range. Trust the
    // model's ytl_points; fall back to rescaling the 0–20 total if it is missing.
    const max = isShort ? 33 : 66;
    let predNative = Number(aiResult.ytl_points);
    if (!Number.isFinite(predNative)) predNative = result.finalScore * (max / 20);
    predNative = Math.max(0, Math.min(max, predNative));

    if (charCount >= MICRO_CHAR_FLOOR) {
      const range = computeScoreRange(predNative, lang, isShort);
      result.scoreRange = range;
      result.ytlGrade = range.band; // de-biased native band is the shown letter
      result._predNative = Math.round(predNative); // debug only
    } else {
      // Below a real kirjotelma attempt → no point range, just the letter.
      result.scoreRange = null;
    }

    if (access.tier === "free") await incrementFreeUsage(req.user.userId, "writing");
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to grade writing" });
  }
});

export default router;
