import { Router } from "express";
import { callOpenAI, getUserProfileContext, LANGUAGE_META, VALID_LANGUAGES } from "../lib/openai.js";
import { buildGradingPrompt, processGradingResult, SHORT_MAX, LONG_MAX } from "../lib/writingGrading.js";
import { requireAuth, requirePro, checkFeatureAccess, incrementFreeUsage } from "../middleware/auth.js";
import { requireSupportedLanguage, resolveLang } from "../middleware/language.js";
import { aiStrictLimiter, demoGradeLimiter, demoGradeGlobalLimiter, clientIp } from "../middleware/rateLimit.js";
import { checkMonthlyCostLimit } from "../middleware/costLimit.js";
import { logAiUsage } from "../lib/aiCost.js";
import { pickWritingTaskFromBank } from "../lib/writingBank.js";
import {
  buildDemoGradingPrompt, shapeDemoResult,
  DEMO_MIN_CHARS, DEMO_MAX_CHARS, DEMO_VALID_LANGS,
} from "../lib/demoGrading.js";
import { createHash } from "node:crypto";

const router = Router();

const VALID_TASK_TYPES = new Set(["short", "long"]);

// ─── Anonymous landing writing demo (L-V332) ────────────────────────────────
// One slim AI grade per device per 24h. No auth, no DB write of user text —
// only a budget-monitoring log line so a bot spike is visible. Sits BEFORE the
// requireAuth routes below. Three gates, in order:
//   1. validateDemoInput — reject bad input before any limiter counts it.
//   2. demoGradeLimiter   — per-IP, 1/24h (the per-visitor taste limit).
//   3. demoGradeGlobalLimiter — global daily cap, the hard cost ceiling that
//      survives IP rotation / spoofing / DB fail-open. Runs AFTER the per-IP
//      gate so a single hammering IP can't drain the global budget for others.
//
// Test/dev escape hatch: DEMO_GRADE_FAKE=1 returns a canned grade without
// calling OpenAI, so rate-limit / validation tests cost nothing.
// Validate BEFORE the limiters so a malformed request never burns the one
// daily grade. Stashes the cleaned lang/text on req for the handler.
function validateDemoInput(req, res, next) {
  const lang = String(req.body?.lang || "").trim();
  const rawText = typeof req.body?.text === "string" ? req.body.text : "";
  const text = rawText.trim().slice(0, DEMO_MAX_CHARS);

  if (!DEMO_VALID_LANGS.has(lang)) {
    return res.status(400).json({ error: "Virheellinen kieli." });
  }
  if (text.length < DEMO_MIN_CHARS) {
    return res.status(400).json({ error: "Kirjoita vähintään 80 merkkiä, niin arvio on luotettava." });
  }
  req.demo = { lang, text };
  next();
}

router.post("/writing/demo-grade", validateDemoInput, demoGradeLimiter, demoGradeGlobalLimiter, async (req, res) => {
  const { lang, text } = req.demo;

  // Budget-monitoring log: language + timestamp + salted IP-hash only.
  // No raw IP, no student text — enough to spot a bot spike in the logs.
  const ipHash = createHash("sha256").update(clientIp(req)).digest("hex").slice(0, 12);
  console.log("[demo-grade]", JSON.stringify({ lang, ts: new Date().toISOString(), ipHash }));

  if (process.env.DEMO_GRADE_FAKE === "1") {
    return res.json(shapeDemoResult({
      score: 12,
      errors: [{ excerpt: text.slice(0, 12), corrected: "—", explanation_fi: "Demo-tila: esimerkkivirhe." }],
    }));
  }

  try {
    const prompt = buildDemoGradingPrompt(lang, text);
    const aiResult = await callOpenAI(prompt, 700, {
      temperature: 0.2,
      responseFormat: { type: "json_object" },
    });
    logAiUsage(null, "demo-grade", aiResult._usage).catch(() => {});
    delete aiResult._usage;
    return res.json(shapeDemoResult(aiResult));
  } catch (err) {
    console.error("demo-grade error:", err.message);
    return res.status(502).json({ error: "Arviointi ei nyt onnistunut. Kokeile hetken päästä uudelleen tai tee tili." });
  }
});

router.post("/writing-task", requireAuth, aiStrictLimiter, checkMonthlyCostLimit, async (req, res) => {
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

router.post("/grade-writing", requireAuth, aiStrictLimiter, checkMonthlyCostLimit, async (req, res) => {
  if (requireSupportedLanguage(req, res)) return;
  const lang = resolveLang(req);

  const { task, studentText } = req.body;

  if (!task || !studentText || typeof studentText !== "string" || studentText.trim().length === 0) {
    return res.status(400).json({ error: "Tehtävä ja vastaus vaaditaan" });
  }
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

  const prompt = buildGradingPrompt(task, studentText, isShort, lang);

  try {
    // Per puheo-ai-prompt skill: graders use temp 0.2 for determinism + force
    // JSON object response so we don't have to regex strip markdown fences.
    const aiResult = await callOpenAI(prompt, 2500, {
      temperature: 0.2,
      responseFormat: { type: "json_object" },
    });
    logAiUsage(req.user?.userId, "grade-writing", aiResult._usage).catch(() => {});
    delete aiResult._usage;
    const result = processGradingResult(aiResult, charCount, task.charMin, isShort, studentText);
    result.originalText = studentText;
    if (access.tier === "free") await incrementFreeUsage(req.user.userId, "writing");
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to grade writing" });
  }
});

export default router;
