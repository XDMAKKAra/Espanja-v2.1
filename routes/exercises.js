import { Router } from "express";
import supabase from "../supabase.js";
import {
  callOpenAI, coerceArrayResponse, getUserProfileContext,
  LEVEL_DESCRIPTIONS, TOPIC_CONTEXT, LANGUAGE_META,
  GRAMMAR_TOPIC_DESCS, READING_LEVEL_DESCS, READING_TOPIC_CONTEXTS,
  GRADES, GRADE_ORDER,
  VALID_LEVELS, VALID_VOCAB_TOPICS, VALID_GRAMMAR_TOPICS,
  VALID_READING_TOPICS, VALID_READING_LEVELS, VALID_LANGUAGES,
} from "../lib/openai.js";
import { requireAuth, requirePro, softReadingGate, incrementReadingPieces } from "../middleware/auth.js";
import { aiLimiter, aiStrictLimiter, reportLimiter } from "../middleware/rateLimit.js";
import { checkMonthlyCostLimit } from "../middleware/costLimit.js";
import { logAiUsage } from "../lib/aiCost.js";
import { getUserLevel, refreshUserLevel, processCheckpointResult, progressToNextLevel } from "../lib/levelEngine.js";
import { pointsToYoGrade } from "../lib/grading.js";
import { dispatchGrade } from "../lib/grading/dispatcher.js";
import { validateGrammarBatch } from "../lib/grammarScope.js";
import { getSessionState, processAnswer, describeScaffold } from "../lib/scaffoldEngine.js";
import { pickExerciseType, composePrompt, getMaxTokens } from "../lib/exerciseComposer.js";
import { pickFromSeed, seedCounts } from "../lib/seedBank.js";
import { topicLabel, VALID_TOPICS } from "../lib/mistakeTaxonomy.js";
import { getUserPath, recordMasteryAttempt, getTopicByKey, getMasteredTopics, LEARNING_PATH, MASTERY_TEST_SIZE } from "../lib/learningPath.js";
import { composeSession } from "../lib/sessionComposer.js";
import {
  resolveLessonContext,
  curriculumFocusInstruction,
  curriculumTestInstruction,
} from "../lib/lessonContext.js";

// L-PLAN-3 — when the client sends `{ lesson: { kurssiKey, lessonIndex } }`
// in the request body, route the exercise generation through curriculum
// context: focus, level, count come from the lesson definition.
//
// L-PLAN-6 — count is now `adjusted_exercise_count` (baseline ×
// target-grade multiplier). resolveLessonContext loads the user's
// `target_grade` from `user_profile` and exposes the adjusted count +
// levelDirective on the returned ctx.
async function applyLessonContext(reqBody, defaults, kind, userId = null) {
  if (!reqBody?.lesson) return { ctx: null, ...defaults };
  const lessonPayload = { ...reqBody.lesson };
  if (reqBody.mode === "deepen") lessonPayload.mode = "deepen";
  const ctx = await resolveLessonContext(lessonPayload, userId);
  if (!ctx) return { ctx: null, ...defaults };
  const out = { ctx, ...defaults };
  // Level override — kurssi.level is one of A/B/C/M/E. Reading endpoint can
  // only handle B/C/M/E/L so an A-level reading is not requested by the
  // curriculum (kurssi 1/2 have no reading lessons until later in the kurssi
  // and they are still B-level for reading purposes).
  if (kind === "reading" && ctx.kurssi.level === "A") out.level = "B";
  else out.level = ctx.kurssi.level;
  // Vocab topic override — kurssi.vocab_theme is already a VALID_VOCAB_TOPIC key.
  if (kind === "vocab" && ctx.kurssi.vocab_theme) out.topic = ctx.kurssi.vocab_theme;
  // Count override — for kertaustesti use the adjusted count (baseline 15
  // ramped per target_grade); for deepen it's a fixed 4; otherwise the
  // lesson's adjusted count.
  out.count = ctx.lesson.adjusted_exercise_count || ctx.lesson.exercise_count || defaults.count;
  return out;
}

const router = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

// ─── Seed-item deduplication helpers ──────────────────────────────────────

const SEEN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

async function getSeenSeedIds(userId) {
  if (!userId) return [];
  const since = new Date(Date.now() - SEEN_WINDOW_MS).toISOString();
  const { data } = await supabase
    .from("seen_seed_items")
    .select("item_id")
    .eq("user_id", userId)
    .gte("seen_at", since);
  return (data || []).map(r => r.item_id);
}

async function recordSeenSeedItems(userId, itemIds) {
  if (!userId || !itemIds.length) return;
  const now = new Date().toISOString();
  await supabase
    .from("seen_seed_items")
    .upsert(
      itemIds.map(item_id => ({ user_id: userId, item_id, seen_at: now })),
      { onConflict: "user_id,item_id" }
    );
}

// ─── Exercise bank helpers ─────────────────────────────────────────────────

async function getUserId(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !user) return null;
  return user.id;
}

async function tryBankExercise(mode, level, topic, language, userId) {
  // Always try the bank first. Candidates are filtered by seen_exercises so
  // a user who has already seen everything will still fall through to AI.
  // Prior code rolled a 50% dice here for "freshness" — removed to cut
  // OpenAI spend + latency roughly in half on hot combos.
  let query = supabase
    .from("exercise_bank")
    .select("id, payload")
    .eq("mode", mode)
    .eq("level", level)
    .eq("topic", topic)
    .eq("language", language)
    .gt("quality_score", 0);

  // Exclude exercises this user has seen in the last 30 days
  if (userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: seenRows } = await supabase
      .from("seen_exercises")
      .select("exercise_id")
      .eq("user_id", userId)
      .gte("seen_at", thirtyDaysAgo);

    const seenIds = (seenRows || []).map(r => r.exercise_id);
    if (seenIds.length > 0) {
      query = query.not("id", "in", `(${seenIds.join(",")})`);
    }
  }

  const { data: candidates, error } = await query.limit(10);
  if (error || !candidates?.length) return null;

  // Pick random from candidates
  const pick = candidates[Math.floor(Math.random() * candidates.length)];

  // Update last_used_at
  await supabase
    .from("exercise_bank")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", pick.id);

  // Record seen
  if (userId) {
    await supabase
      .from("seen_exercises")
      .upsert({ user_id: userId, exercise_id: pick.id, seen_at: new Date().toISOString() });
  }

  return { bankId: pick.id, payload: pick.payload };
}

async function saveToBankBulk(mode, level, topic, language, exercises) {
  // exercises is an array — save each as a separate bank entry
  const rows = (Array.isArray(exercises) ? exercises : [exercises]).map(ex => ({
    mode,
    level,
    topic,
    language,
    payload: Array.isArray(exercises) ? exercises : ex,
    quality_score: 1.0,
  }));

  // For vocab/grammar: save the whole batch as one entry
  if (Array.isArray(exercises)) {
    await supabase.from("exercise_bank").insert({
      mode, level, topic, language,
      payload: exercises,
      quality_score: 1.0,
    });
  } else {
    await supabase.from("exercise_bank").insert({
      mode, level, topic, language,
      payload: exercises,
      quality_score: 1.0,
    });
  }
}

// ─── Vocab exercises ───────────────────────────────────────────────────────

router.post("/generate", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const reqLevel = req.body?.level ?? "B";
  const reqTopic = req.body?.topic ?? "general vocabulary";
  const reqCount = req.body?.count ?? 4;
  const language = req.body?.language ?? "spanish";
  const recentlyShown = req.body?.recentlyShown ?? [];

  // L-PLAN-3 — curriculum lesson context overrides level/topic/count when set.
  // L-PLAN-6 — userId threaded through so target_grade-aware multiplier applies.
  const applied = await applyLessonContext(
    req.body,
    { level: reqLevel, topic: reqTopic, count: reqCount },
    "vocab",
    req.user?.userId || null,
  );
  const { ctx: lessonCtx, level, topic, count } = applied;

  if (!VALID_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_VOCAB_TOPICS.has(topic)) return res.status(400).json({ error: "Virheellinen aihe" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  // Curriculum lessons can request up to 20 (kertaustesti = 15, mixed = 10).
  const maxCount = lessonCtx ? 20 : 10;
  const clampedCount = Math.max(1, Math.min(maxCount, Number(count) || 4));

  // Sanitize anti-repetition list: array of lowercase strings, ≤40 chars,
  // ≤30 entries. Used only to nudge the model — bank exercises already
  // de-dup via the seen_exercises table.
  const recentList = Array.isArray(recentlyShown)
    ? recentlyShown
        .filter((s) => typeof s === "string")
        .map((s) => s.toLowerCase().trim().slice(0, 40))
        .filter(Boolean)
        .slice(-30)
    : [];

  try {
    // Try bank first — skip when curriculum context is active so the AI can
    // honour the lesson focus rather than serve a generic banked batch.
    const userId = await getUserId(req);
    if (!lessonCtx) {
      const banked = await tryBankExercise("vocab", level, topic, language, userId);
      if (banked) {
        return res.json({ exercises: banked.payload, bankId: banked.bankId });
      }
    }

    // Generate with AI
    const lang = LANGUAGE_META[language];
    const levelDesc = LEVEL_DESCRIPTIONS[level];
    const topicContext = TOPIC_CONTEXT[topic];
    const profileCtx = await getUserProfileContext(userId);
    const baseLessonBlock = lessonCtx
      ? (lessonCtx.isKertaustesti ? curriculumTestInstruction(lessonCtx) : curriculumFocusInstruction(lessonCtx))
      : "";

    // Hotfix L-PLAN5: callOpenAI defaults to response_format=json_object, so a
    // top-level JSON array prompt comes back wrapped (e.g. {"exercises":[...]})
    // and validateVocabBatch then rejects it as malformed. Ask explicitly for
    // the wrapper shape and unwrap with coerceArrayResponse so older cached
    // bare-array responses still work.
    const buildPrompt = (lessonBlock) => `You are generating vocabulary exercises for Finnish high school students taking the ${lang.name} "lyhyt oppimäärä" yo-koe (matriculation exam). Students have studied ${lang.name} for about ${lang.yearsStudied}.
${profileCtx}${lessonBlock}
TARGET LEVEL: ${level} = ${levelDesc}

TOPIC: ${topicContext}

Generate ${clampedCount} exercises. You MUST use a DIFFERENT type for each question. Cycle through these types:

TYPE 1 — "context": Show a realistic ${lang.name} sentence containing a target word/phrase. Ask what the highlighted word means in that context. Question format: "Lauseessa '...el alcalde anunció...' — mitä tarkoittaa 'el alcalde'?"
TYPE 2 — "translate": Give a Finnish word or short phrase. Ask which ${lang.name} option is the correct translation. Question: "Miten sanotaan espanjaksi: 'kaupungintalo'?" Options are in ${lang.name}.
TYPE 3 — "gap": Show a ${lang.name} sentence with ___ blank. Ask which word/phrase fills the gap correctly. Question: "Täydennä: 'Mañana vamos a ___ con nuestros amigos.'" Options are ${lang.name} words.
TYPE 4 — "meaning": Classic format — show a ${lang.name} word, ask what it means. "¿Qué significa 'el ayuntamiento'?" Options in Finnish.

Rules:
- Each question MUST have a "type" field with one of: "context", "translate", "gap", "meaning"
- Options labeled A) B) C) D)
- For "translate" type: options must be in ${lang.name}
- For "context", "meaning" types: options in Finnish
- For "gap" type: options in ${lang.name}
- Difficulty MUST match the level description exactly
- For level B-C: words from real yo-koe reading texts (daily life, travel, culture)
- For level E-L: nuanced vocabulary, near-synonyms, register differences
- Explanations brief: give both ${lang.name} meaning AND Finnish translation
- Context sentences must be realistic, like from a yo-koe text

HARD REQUIREMENTS (enforced server-side):
- EVERY item MUST include a non-empty "context" field: a realistic ${lang.name} sentence of at least 6 words that uses the target word/phrase. This applies to ALL four types, not just "context". For "translate" and "meaning" the context sentence models how the word is used; for "gap" the context is the full sentence with the blank filled in.
- All four options A-D MUST share the same part of speech as the target word. If the target is a verb, all four options must be verbs in the same tense/mood. If the target is a noun, all four must be nouns (same singular/plural and, when relevant, the same gender). Mixing a verb with a noun, or a singular with a plural, is forbidden.
- Within this batch of ${clampedCount} items, NO target headword (Spanish lemma) may repeat. Use distinct words for every item.
${recentList.length ? `- ANTI-REPETITION: the student has already seen these target headwords this session — do NOT use any of them as a target word in this batch (variation in options is fine, but pick fresh target lemmas):\n  ${recentList.join(", ")}\n` : ""}
Return ONLY a JSON object with shape {"exercises":[ ... ]}, no markdown. Example:
{"exercises":[
  {
    "id": 1,
    "type": "context",
    "question": "Lauseessa 'El alcalde anunció nuevas medidas' — mitä tarkoittaa 'el alcalde'?",
    "context": "El alcalde anunció nuevas medidas para reducir la contaminación.",
    "options": ["A) pormestari", "B) opettaja", "C) lääkäri", "D) poliisi"],
    "correct": "A",
    "explanation": "el alcalde = pormestari (mayor). Anunciar = ilmoittaa, medidas = toimenpiteet."
  },
  {
    "id": 2,
    "type": "translate",
    "question": "Miten sanotaan espanjaksi: 'ympäristö'?",
    "options": ["A) el medio ambiente", "B) el ayuntamiento", "C) el paisaje", "D) el desarrollo"],
    "correct": "A",
    "explanation": "el medio ambiente = ympäristö (environment). el paisaje = maisema, el desarrollo = kehitys."
  }
]}`;

    const warnings = [];

    async function generateOnce(lessonBlock) {
      const raw = await callOpenAI(buildPrompt(lessonBlock), 2000);
      const usage = raw && raw._usage;
      logAiUsage(userId, "generate", usage).catch(() => {});
      const arr = coerceArrayResponse(raw);
      return Array.isArray(arr) ? arr : null;
    }

    let exercises = await generateOnce(baseLessonBlock);

    // L-PLAN5 fallback: if the lesson-constrained generation came back empty
    // or malformed, retry once without the curriculum focus block so the
    // student still gets a usable batch on the lesson's vocab theme. The
    // retry's exercises are tagged so logs / future filters can see they
    // skipped the lesson-specific constraint.
    if (lessonCtx && (!exercises || exercises.length === 0)) {
      console.warn(`/api/generate lesson fallback activated — kurssi=${lessonCtx.kurssi.key} lesson=${lessonCtx.lesson.sort_order} focus="${lessonCtx.lesson.focus}" reason=empty-or-malformed-AI-response`);
      warnings.push("lesson-fallback-generic");
      exercises = await generateOnce("");
    }

    if (!exercises || exercises.length === 0) {
      // Both the primary and (when applicable) fallback came back empty —
      // surface a 502 so the client retries instead of silently rendering an
      // empty list. The frontend skeleton + retry button handles this.
      return res.status(502).json({
        error: "AI ei pystynyt luomaan tehtäviä juuri nyt. Yritä hetken päästä uudelleen.",
        warnings,
      });
    }

    // Single validation pass. Prior code retried on failure (doubled latency
    // + cost) but most validation issues are heuristic false-positives
    // (e.g. the headword-duplicate check). Ship the result with warnings;
    // only skip the bank save when genuinely malformed.
    const validation = validateVocabBatch(exercises);
    if (!validation.ok) warnings.push(...validation.issues);

    // Save to bank (fire-and-forget) — only for fully-valid batches AND only
    // when not in curriculum context (curriculum batches are focus-specific
    // and would skew bank serving for generic free-practice users).
    if (validation.ok && !lessonCtx) saveToBankBulk("vocab", level, topic, language, exercises).catch(() => {});

    res.json({ exercises, ...(warnings.length ? { warnings } : {}) });
  } catch (err) {
    console.error("Generate exercises error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate exercises" });
  }
});

// ─── Vocab batch validator (Commit 4) ─────────────────────────────────────
// Runs on OpenAI output: non-empty context per item + no duplicate Spanish
// headwords in the batch. Word-class consistency is heuristic because we
// don't have a POS tagger on the server — we approximate via presence of
// Spanish articles (el/la/un/una/los/las) across options for nouns.
function validateVocabBatch(exercises) {
  const issues = [];
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return { ok: false, issues: ["empty-or-malformed-batch"] };
  }
  const seenHeadwords = new Set();
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (!ex || typeof ex !== "object") { issues.push(`item-${i}-not-object`); continue; }
    if (!ex.context || String(ex.context).trim().length < 10) {
      issues.push(`item-${i}-missing-context`);
    }
    // Headword de-dup heuristic: derive from `context` by stripping punctuation
    // and quoting the first Spanish-looking capitalised word pair, falling back
    // to the correct option letter's text.
    const key = extractHeadwordKey(ex);
    if (key && seenHeadwords.has(key)) issues.push(`item-${i}-duplicate-headword:${key}`);
    if (key) seenHeadwords.add(key);
  }
  return { ok: issues.length === 0, issues };
}

function extractHeadwordKey(ex) {
  // Take the option string matched by `correct` (e.g. "A" → options[0]) and
  // strip the "A) " prefix + any article.
  try {
    if (!ex?.correct || !Array.isArray(ex.options)) return null;
    const idx = "ABCDEFGH".indexOf(String(ex.correct).trim().toUpperCase());
    if (idx < 0 || idx >= ex.options.length) return null;
    const raw = String(ex.options[idx] || "")
      .replace(/^[A-H]\)\s*/, "")
      .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, "")
      .toLowerCase()
      .trim();
    return raw || null;
  } catch { return null; }
}

// ─── Grade ─────────────────────────────────────────────────────────────────

router.post("/grade", async (req, res) => {
  const { correct, total } = req.body;

  if (typeof correct !== "number" || typeof total !== "number" || total <= 0) {
    return res.status(400).json({ error: "Virheelliset pisteet" });
  }

  const pct = Math.round((correct / total) * 100);
  // Single source of truth — official YTL bands. Vocab and full-exam now agree.
  const grade = pointsToYoGrade(correct, total);

  res.json({ grade, pct, correct, total });
});

// ─── Per-item grading dispatcher ───────────────────────────────────────────
// Authoritative for all registered types — the server computes `correct`,
// never echoes it from the client submission.
//
// Registered types (lib/grading/dispatcher.js):
//   monivalinta   — advisory (indices supplied by client; no server-stored answer)
//   aukkotehtava  — authoritative (looks up answer from seed bank by ID)
//   yhdistaminen  — authoritative (looks up correct pairs from seed bank by IDs)
router.post("/grade/advisory", (req, res) => {
  const { type, exerciseId, payload } = req.body || {};
  if (typeof type !== "string" || !type) {
    return res.status(400).json({ error: "Virheellinen tyyppi" });
  }
  const result = dispatchGrade({ type, exerciseId, payload });
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  // Forward all grader fields. Each grader defines its own response shape;
  // the common fields (correct, band, score, maxScore) are always present.
  const { ok: _ok, ...body } = result;
  res.json(body);
});

// ─── Seed-based exercise endpoints ────────────────────────────────────────
//
// These serve from the curated JSON seed bank.  The correct answer is NEVER
// included in the HTTP response — grading goes through /api/grade/advisory
// which looks up the answer server-side via seedBank.getSeedItemById.
//
// Endpoint contract:
//   request:  { topic?, cefr?, count? }
//   response: { exercises: [...], source: "seed" }

// POST /api/aukkotehtava
// Returns gap-fill items.  Fields stripped from response: answer, alt_answers,
// explanation_fi (revealed by the grader response after submission).
router.post("/aukkotehtava", requireAuth, async (req, res) => {
  const { topic, cefr, count = 5 } = req.body;
  const clamp = Math.max(1, Math.min(20, Number(count) || 5));
  const userId = req.user.userId;
  const excludeIds = await getSeenSeedIds(userId);
  const items = pickFromSeed("aukkotehtava", { topic, cefr, count: clamp, excludeIds });
  if (!items.length) return res.status(404).json({ error: "Ei sopivia aukkotehtäviä" });
  recordSeenSeedItems(userId, items.map(x => x.id)).catch(() => {});
  res.json({
    exercises: items.map(({ id, topic, cefr, sentence, hint_fi }) =>
      ({ id, topic, cefr, sentence, hint_fi })
    ),
    source: "seed",
  });
});

// POST /api/yhdistaminen
// Returns a set of matching pairs.  The Finnish options are shuffled so the
// client can render them in a different order from the Spanish column.
// Fields stripped: nothing structural, but the grader re-verifies from seed.
router.post("/yhdistaminen", requireAuth, async (req, res) => {
  const { topic, cefr, pairCount = 5 } = req.body;
  const clamp = Math.max(2, Math.min(8, Number(pairCount) || 5));
  const userId = req.user.userId;
  const excludeIds = await getSeenSeedIds(userId);
  const items = pickFromSeed("matching", { topic, cefr, count: clamp, excludeIds });
  if (!items.length) return res.status(404).json({ error: "Ei sopivia pareja" });
  recordSeenSeedItems(userId, items.map(x => x.id)).catch(() => {});
  const shuffledFi = [...items.map(x => x.fi)].sort(() => Math.random() - 0.5);
  res.json({
    items: items.map(({ id, topic, cefr, es }) => ({ id, topic, cefr, es })),
    shuffledFi,
    source: "seed",
  });
});

// POST /api/kaannos
// Returns Finnish→Spanish translation prompts.  answer and alt_answers are
// withheld; grading uses /api/grade-translate (AI) or a future kaannos grader.
router.post("/kaannos", requireAuth, async (req, res) => {
  const { topic, cefr, count = 3 } = req.body;
  const clamp = Math.max(1, Math.min(10, Number(count) || 3));
  const userId = req.user.userId;
  const excludeIds = await getSeenSeedIds(userId);
  const items = pickFromSeed("translation", { topic, cefr, count: clamp, excludeIds });
  if (!items.length) return res.status(404).json({ error: "Ei sopivia käännöstehtäviä" });
  recordSeenSeedItems(userId, items.map(x => x.id)).catch(() => {});
  res.json({
    exercises: items.map(({ id, topic, cefr, prompt_fi, hint_fi }) =>
      ({ id, topic, cefr, prompt_fi, hint_fi })
    ),
    source: "seed",
  });
});

// POST /api/lauseen-muodostus
// Returns sentence-construction prompts.  sample_answer is withheld.
// Grading: client submits via /api/grade-translate (AI evaluates free text).
router.post("/lauseen-muodostus", requireAuth, async (req, res) => {
  const { topic, cefr, count = 3 } = req.body;
  const clamp = Math.max(1, Math.min(10, Number(count) || 3));
  const userId = req.user.userId;
  const excludeIds = await getSeenSeedIds(userId);
  const items = pickFromSeed("sentenceConstruction", { topic, cefr, count: clamp, excludeIds });
  if (!items.length) return res.status(404).json({ error: "Ei sopivia lauseenmuodostustehtäviä" });
  recordSeenSeedItems(userId, items.map(x => x.id)).catch(() => {});
  res.json({
    exercises: items.map(({ id, topic, cefr, required_words, prompt_fi, hint_fi }) =>
      ({ id, topic, cefr, required_words, prompt_fi, hint_fi })
    ),
    source: "seed",
  });
});

// POST /api/correction
// Serves one correction exercise. correct_sentence is withheld; grading goes
// through POST /api/grade/advisory with type "correction".
router.post("/correction", requireAuth, async (req, res) => {
  const { topic, cefr, error_category } = req.body;
  const userId = req.user.userId;
  const excludeIds = await getSeenSeedIds(userId);
  const items = pickFromSeed("correction", { topic, cefr, count: 1, excludeIds });
  if (!items.length) return res.status(404).json({ error: "Ei sopivia korjaustehtäviä" });
  recordSeenSeedItems(userId, [items[0].id]).catch(() => {});
  const { id, type: itype, subtype, topic: itopic, cefr: icefr, erroneous_sentence, hint_fi, error_category: icat } = items[0];
  res.json({
    exercise: { id, type: itype, subtype, topic: itopic, cefr: icefr, erroneous_sentence, hint_fi, error_category: icat },
    source: "seed",
  });
});

// GET /api/seed-counts — diagnostics / health
router.get("/seed-counts", requireAuth, (_req, res) => {
  res.json(seedCounts);
});

// ─── Grammar exercises ─────────────────────────────────────────────────────

router.post("/grammar-drill", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const reqTopic = req.body?.topic ?? "mixed";
  const reqLevel = req.body?.level ?? "C";
  const reqCount = req.body?.count ?? 6;
  const language = req.body?.language ?? "spanish";
  const recentlyShown = req.body?.recentlyShown ?? [];

  // L-PLAN-3 — curriculum lesson context overrides level + count when set.
  // Topic stays as whatever the client sent (default "mixed") — kurssi
  // grammar_focus[] keys (preterite / subjunctive_present / …) belong to
  // a different vocabulary than VALID_GRAMMAR_TOPICS, but the lesson focus
  // we inject into the prompt is the real scope constraint.
  // L-PLAN-6 — userId threaded through so target_grade-aware multiplier applies.
  const applied = await applyLessonContext(
    req.body,
    { level: reqLevel, topic: reqTopic, count: reqCount },
    "grammar",
    req.user?.userId || null,
  );
  const { ctx: lessonCtx, level, count } = applied;
  const topic = reqTopic;

  if (!VALID_GRAMMAR_TOPICS.has(topic)) return res.status(400).json({ error: "Virheellinen kielioppiaihe" });
  if (!VALID_READING_LEVELS.has(level) && !VALID_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  const maxCount = lessonCtx ? 20 : 10;
  const clampedCount = Math.max(1, Math.min(maxCount, Number(count) || 6));

  // Anti-repetition list of rule labels (e.g. "ser/estar", "imperfekti").
  // Only meaningful for mixed topic — client already gates this — but we
  // still sanitise defensively.
  const recentRules = Array.isArray(recentlyShown)
    ? recentlyShown
        .filter((s) => typeof s === "string")
        .map((s) => s.toLowerCase().trim().slice(0, 40))
        .filter(Boolean)
        .slice(-20)
    : [];

  try {
    const userId = await getUserId(req);
    if (!lessonCtx) {
      const banked = await tryBankExercise("grammar", level, topic, language, userId);
      if (banked) {
        return res.json({ exercises: banked.payload, bankId: banked.bankId });
      }
    }

    const lang = LANGUAGE_META[language];
    const topicDesc = GRAMMAR_TOPIC_DESCS[topic];
    const profileCtx = await getUserProfileContext(userId);
    const lessonBlock = lessonCtx
      ? (lessonCtx.isKertaustesti ? curriculumTestInstruction(lessonCtx) : curriculumFocusInstruction(lessonCtx))
      : "";

    const prompt = `You are generating ${lang.name} grammar exercises for Finnish high school students (yo-koe, lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).
${profileCtx}${lessonBlock}
GRAMMAR FOCUS: ${topicDesc}
LEVEL: ${level} — appropriate difficulty for this yo-koe level
COUNT: ${clampedCount} exercises

Generate ${clampedCount} exercises. Use AT LEAST 3 different types from below:

TYPE "gap": Sentence with ___ blank — choose the correct ${lang.name} form.
  instruction: "Täydennä aukko oikealla muodolla."

TYPE "correction": Show a sentence WITH an error. Student must identify the corrected version.
  instruction: "Mikä on oikea muoto? Lauseessa on virhe."

TYPE "transform": Give a correct sentence and ask the student to transform it (change tense, mood, person). Show 4 versions, only one correct.
  instruction: "Muuta lause [target form, e.g. imperfektiin / subjunktiiviin / konditionaaliin]."

TYPE "pick_rule": Show a correct sentence and ask WHICH grammar rule explains why it's correct. Tests metalinguistic awareness.
  instruction: "Miksi lause on oikein? Valitse sääntö."

REQUIREMENTS:
- Each exercise MUST have "type" field: "gap", "correction", "transform", or "pick_rule"
- Sentences must look like real yo-koe essay sentences (messages, opinions, descriptions)
- Distractors must be plausible near-misses students actually make
- Explanations in Finnish, SHORT and memorable — state the RULE (≤160 chars, 1–2 sentences)
- "rule" field: short label like "ser/estar", "ojalá+subj.", "konditionaali", "pretériti/imperfekti", "hay+artikkeli", "relatiivi"

YTL LYHYT OPPIMÄÄRÄ SCOPE — MANDATORY:
- Stay inside B1 / lyhyt oppimäärä scope. Allowed structures: present, preterite, imperfect, present perfect, future (simple), conditional (simple), present subjunctive (ojalá/para que/querer que), ser vs estar, hay vs estar, relative pronouns (que/quien/donde), pronoun order.
- DO NOT generate items that test: conditional perfect (habría hecho), past subjunctive / imperfect subjunctive (-ara/-iese forms), future subjunctive (-are/-iere), passive voice with ser + por. These are OUT OF SCOPE.
- When topic=mixed, ensure the batch covers AT LEAST 3 distinct grammar rules (e.g. one ser/estar + one preterite/imperfect + one subjunctive) — not three of the same rule with different exercise formats.
${topic === "mixed" && recentRules.length ? `- ANTI-REPETITION: the student has already drilled these grammar rules in earlier batches this session — strongly prefer DIFFERENT rules in this batch (variety builds confidence; revisiting the same rule batch-after-batch feels stale):\n  ${recentRules.join(", ")}\n` : ""}
Return ONLY a JSON object with shape {"exercises":[ ... ]} (no markdown):
{"exercises":[
  {
    "id": 1,
    "type": "gap",
    "instruction": "Täydennä aukko oikealla muodolla.",
    "sentence": "Cuando era pequeño, siempre ___ al parque con mis amigos.",
    "options": ["A) iba", "B) fui", "C) voy", "D) iré"],
    "correct": "A",
    "rule": "imperfekti",
    "explanation": "iba = imperfekti. Siempre (aina) + toistuva menneisyys → imperfekti. fui = preteriti (yksittäinen teko)."
  },
  {
    "id": 2,
    "type": "correction",
    "instruction": "Lauseessa on virhe. Valitse oikea muoto.",
    "sentence": "Ojalá te gustará mi regalo.",
    "options": ["A) guste", "B) gustará", "C) gustaba", "D) gustaría"],
    "correct": "A",
    "rule": "ojalá+subj.",
    "explanation": "Ojalá vaatii AINA subjunktiivin: ojalá te guste. gustará (futuuri) on virhe."
  },
  {
    "id": 3,
    "type": "transform",
    "instruction": "Muuta lause konditionaaliin.",
    "sentence": "Quiero viajar a España.",
    "options": ["A) Querría viajar a España.", "B) Quise viajar a España.", "C) Quería viajar a España.", "D) Quiera viajar a España."],
    "correct": "A",
    "rule": "konditionaali",
    "explanation": "Querría = konditionaali (haluaisin). Quise = preteriti, Quería = imperfekti, Quiera = subjunktiivi."
  }
]}`;

    const warnings = [];
    const raw = await callOpenAI(prompt, 2500);
    logAiUsage(userId, "grammar-drill", raw && raw._usage).catch(() => {});
    // Hotfix L-PLAN5: callOpenAI now defaults to JSON-object response_format
    // so a top-level array prompt comes back wrapped (e.g. {"exercises":[...]}).
    let exercises = coerceArrayResponse(raw) || [];

    // Single validation pass (prior code retried; doubled latency + spend).
    // When validation fails we still keep the in-scope items so the user gets
    // something useful rather than a 500 or a second 10-second wait.
    const validation = validateGrammarBatch(exercises, { topic });
    if (!validation.ok) {
      const { checkGrammarItemScope } = await import("../lib/grammarScope.js");
      exercises = (Array.isArray(exercises) ? exercises : [])
        .filter((ex) => checkGrammarItemScope(ex).length === 0);
      warnings.push(...validation.issues);
    }

    if (validation.ok && !lessonCtx) saveToBankBulk("grammar", level, topic, language, exercises).catch(() => {});
    res.json({ exercises, ...(warnings.length ? { warnings } : {}) });
  } catch (err) {
    console.error("Grammar drill error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate grammar exercises" });
  }
});

// ─── Reading exercises ─────────────────────────────────────────────────────

router.post("/reading-task", requireAuth, softReadingGate, aiStrictLimiter, checkMonthlyCostLimit, async (req, res) => {
  const reqLevel = req.body?.level ?? "C";
  const reqTopic = req.body?.topic ?? "animals and nature";
  const language = req.body?.language ?? "spanish";
  const recentlyShown = req.body?.recentlyShown ?? [];

  // L-PLAN-3 — curriculum lesson context overrides level when set. The
  // reading topic stays as whatever the client picked; the lesson focus
  // we inject into the prompt narrows the angle further.
  // L-PLAN-6 — userId threaded through so target_grade-aware level directive applies.
  const applied = await applyLessonContext(
    req.body,
    { level: reqLevel, topic: reqTopic, count: 0 },
    "reading",
    req.user?.userId || null,
  );
  const { ctx: lessonCtx, level } = applied;
  const topic = reqTopic;

  if (!VALID_READING_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_READING_TOPICS.has(topic)) return res.status(400).json({ error: "Virheellinen aihe" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });

  // Anti-repetition: list of recent text titles. Capped tighter than the
  // vocab/grammar lists because each title is a much longer string and the
  // reading-task prompt is already 100+ tokens.
  const recentTitles = Array.isArray(recentlyShown)
    ? recentlyShown
        .filter((s) => typeof s === "string")
        .map((s) => s.toLowerCase().trim().slice(0, 80))
        .filter(Boolean)
        .slice(-10)
    : [];

  try {
    const userId = await getUserId(req);
    if (!lessonCtx) {
      const banked = await tryBankExercise("reading", level, topic, language, userId);
      if (banked) {
        if (!req.isPro) await incrementReadingPieces(userId);
        return res.json({ reading: banked.payload, bankId: banked.bankId });
      }
    }

    const lang = LANGUAGE_META[language];
    const levelDesc = READING_LEVEL_DESCS[level];
    const topicContext = READING_TOPIC_CONTEXTS[topic];
    const profileCtx = await getUserProfileContext(userId);
    const lessonBlock = lessonCtx ? curriculumFocusInstruction(lessonCtx) : "";

    const prompt = `Generate a reading comprehension exercise for Finnish students taking the ${lang.name} yo-koe (lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).
${profileCtx}${lessonBlock}
Text level: ${level} — ${levelDesc}
Topic: ${topicContext}

Make the text feel like a REAL source: a blog post, news snippet, interview excerpt, or webpage. Give it a realistic title and source.
${recentTitles.length ? `\nANTI-REPETITION: the student has already read texts with these titles in earlier sessions — choose a CLEARLY different angle, subject, and title (don't recycle the same scenarios or tropes):\n  ${recentTitles.join("; ")}\n` : ""}

Generate EXACTLY 4 questions after the text:
1. Multiple choice (monivalinta) — 4 options, 1 correct
2. Multiple choice (monivalinta) — 4 options, 1 correct
3. True/false (oikein/väärin) — a statement to evaluate, plus a direct quote from the text as justification
4. Short factual answer in Finnish — something specific and findable in the text (1-5 word answer)

Return ONLY this JSON (no markdown):
{
  "title": "Title of the text in Spanish",
  "text": "Full text in Spanish...",
  "source": "Fictitious source, e.g. 'El País Digital, 2024' or 'Blog: Hola Helsinki, 2024'",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Kysymys suomeksi?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "A",
      "explanation": "Lyhyt selitys suomeksi"
    },
    {
      "id": 2,
      "type": "multiple_choice",
      "question": "Kysymys suomeksi?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": "B",
      "explanation": "Lyhyt selitys suomeksi"
    },
    {
      "id": 3,
      "type": "true_false",
      "statement": "Väite suomeksi (arvioitava oikein/väärin)",
      "correct": true,
      "justification": "Exact quote from the text that proves this",
      "explanation": "Lyhyt selitys suomeksi"
    },
    {
      "id": 4,
      "type": "short_answer",
      "question": "Tarkka faktakysymys suomeksi?",
      "acceptedAnswers": ["primary answer", "alternative phrasing"],
      "explanation": "Lyhyt selitys suomeksi"
    }
  ]
}`;

    const reading = await callOpenAI(prompt, 3000);
    logAiUsage(userId, "reading-task", reading._usage).catch(() => {});
    delete reading._usage;
    if (!lessonCtx) saveToBankBulk("reading", level, topic, language, reading).catch(() => {});
    if (!req.isPro) await incrementReadingPieces(userId);
    res.json({ reading });
  } catch (err) {
    console.error("Reading task error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate reading task" });
  }
});

// ─── Report exercise ───────────────────────────────────────────────────────

router.post("/report-exercise", requireAuth, reportLimiter, async (req, res) => {
  const { bankId } = req.body;
  if (!bankId) return res.status(400).json({ error: "bankId vaaditaan" });

  const { data, error } = await supabase
    .from("exercise_bank")
    .select("reported_count")
    .eq("id", bankId)
    .single();

  if (error || !data) return res.status(404).json({ error: "Tehtävää ei löytynyt" });

  const newCount = (data.reported_count || 0) + 1;
  const updates = { reported_count: newCount };

  // Auto-disable after 3 reports
  if (newCount > 3) updates.quality_score = 0;

  await supabase
    .from("exercise_bank")
    .update(updates)
    .eq("id", bankId);

  res.json({ ok: true, reported_count: newCount });
});

// ─── Admin: flagged exercises ──────────────────────────────────────────────

router.get("/admin/flagged-exercises", requireAuth, async (req, res) => {
  if (!ADMIN_EMAILS.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ error: "Ei oikeutta" });
  }

  const { data, error } = await supabase
    .from("exercise_bank")
    .select("id, mode, level, topic, language, payload, quality_score, reported_count, created_at")
    .gt("reported_count", 0)
    .order("reported_count", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ exercises: data });
});

// ─── Admin: AI costs by user ───────────────────────────────────────────────

router.get("/admin/costs-by-user", requireAuth, async (req, res) => {
  if (!ADMIN_EMAILS.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ error: "Ei oikeutta" });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const { data, error } = await supabase
      .from("ai_usage")
      .select("user_id, cost_usd, input_tokens, output_tokens")
      .gte("created_at", startOfMonth.toISOString());

    if (error) throw error;

    // Aggregate by user
    const userMap = {};
    for (const row of (data || [])) {
      const uid = row.user_id || "anonymous";
      if (!userMap[uid]) userMap[uid] = { userId: uid, totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0, callCount: 0 };
      userMap[uid].totalCost += Number(row.cost_usd || 0);
      userMap[uid].totalInputTokens += row.input_tokens || 0;
      userMap[uid].totalOutputTokens += row.output_tokens || 0;
      userMap[uid].callCount++;
    }

    const sorted = Object.values(userMap)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 20)
      .map((u) => ({ ...u, totalCost: Math.round(u.totalCost * 10000) / 10000 }));

    res.json({ users: sorted, month: startOfMonth.toISOString().slice(0, 7) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Gap-fill exercises (write the missing word) ─────────────────────────────

router.post("/gap-fill", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { level = "B", count = 6, language = "spanish" } = req.body;

  if (!VALID_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  const clampedCount = Math.max(1, Math.min(10, Number(count) || 6));

  try {
    const userId = await getUserId(req);
    const lang = LANGUAGE_META[language];
    const levelDesc = LEVEL_DESCRIPTIONS[level];
    const profileCtx = await getUserProfileContext(userId);

    const prompt = `Generate ${clampedCount} gap-fill exercises for Finnish students studying ${lang.name} (yo-koe, lyhyt oppimäärä).
${profileCtx}
LEVEL: ${level} = ${levelDesc}

Each exercise has a ${lang.name} sentence with ONE blank (___). A hint is given in parentheses: either the Finnish meaning or the ${lang.name} infinitive form. The student must type the correct word.

REQUIREMENTS:
- Sentences must be realistic yo-koe level
- Hints: use infinitive + grammatical hint, e.g. "(ser, imperfekti)" or "(hablar, subjunktiivi)"
- correctAnswer: the exact word that fills the blank
- alternativeAnswers: array of acceptable variants (accent errors, synonyms)
- Level ${level}: match difficulty exactly

Return ONLY JSON array:
[
  {
    "id": 1,
    "type": "gap_fill",
    "sentence": "Cuando ___ pequeño, jugaba al fútbol todos los días.",
    "hint": "(ser, imperfekti)",
    "correctAnswer": "era",
    "alternativeAnswers": ["era"],
    "explanation": "Ser imperfektissä: era (olin). Imperfekti = toistuva/kuvaava menneisyys."
  }
]`;

    const exercises = await callOpenAI(prompt, 2000);
    logAiUsage(userId, "gap-fill", exercises._usage).catch(() => {});
    delete exercises._usage;
    res.json({ exercises });
  } catch (err) {
    console.error("Gap-fill error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate gap-fill" });
  }
});

// ─── Matching exercises (connect pairs) ──────────────────────────────────────

router.post("/matching", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { level = "B", language = "spanish" } = req.body;

  if (!VALID_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });

  try {
    const userId = await getUserId(req);
    const lang = LANGUAGE_META[language];
    const levelDesc = LEVEL_DESCRIPTIONS[level];
    const profileCtx = await getUserProfileContext(userId);

    const prompt = `Generate a matching exercise for Finnish students studying ${lang.name} (yo-koe, lyhyt oppimäärä).
${profileCtx}
LEVEL: ${level} = ${levelDesc}

Create 6 ${lang.name} words/phrases and their Finnish translations. Student must match each ${lang.name} word to its Finnish meaning.

REQUIREMENTS:
- Words must be appropriate for level ${level}
- Include a mix: nouns, verbs, adjectives, expressions
- No cognates (too easy) unless level is A
- Distractors should be semantically related (same topic area)

Return ONLY JSON:
{
  "type": "matching",
  "pairs": [
    { "spanish": "el ayuntamiento", "finnish": "kaupungintalo" },
    { "spanish": "sin embargo", "finnish": "kuitenkin" },
    { "spanish": "desarrollar", "finnish": "kehittää" },
    { "spanish": "la huella", "finnish": "jälki" },
    { "spanish": "imprescindible", "finnish": "välttämätön" },
    { "spanish": "fomentar", "finnish": "edistää" }
  ]
}`;

    const exercise = await callOpenAI(prompt, 1000);
    logAiUsage(userId, "matching", exercise._usage).catch(() => {});
    delete exercise._usage;
    exercise.type = "matching";
    res.json({ exercise });
  } catch (err) {
    console.error("Matching error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate matching" });
  }
});

// ─── Reorder exercises (arrange words into sentence) ─────────────────────────

router.post("/reorder", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { level = "B", count = 4, language = "spanish" } = req.body;

  if (!VALID_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  const clampedCount = Math.max(1, Math.min(8, Number(count) || 4));

  try {
    const userId = await getUserId(req);
    const lang = LANGUAGE_META[language];
    const levelDesc = LEVEL_DESCRIPTIONS[level];
    const profileCtx = await getUserProfileContext(userId);

    const prompt = `Generate ${clampedCount} word-reorder exercises for Finnish students studying ${lang.name} (yo-koe, lyhyt oppimäärä).
${profileCtx}
LEVEL: ${level} = ${levelDesc}

Each exercise: give a Finnish translation and the ${lang.name} words in SCRAMBLED order. Student arranges them into the correct sentence.

Focus on tricky word order: adjective placement, pronoun position before verbs, clitic doubling, negation placement.

REQUIREMENTS:
- Sentences 4-8 words (short enough to reorder)
- finnishHint: the Finnish meaning
- scrambled: array of words in random order
- correct: array of words in correct order
- Level ${level} appropriate

Return ONLY JSON array:
[
  {
    "id": 1,
    "type": "reorder",
    "finnishHint": "En pidä kylmästä vedestä.",
    "scrambled": ["gusta", "fría", "el", "no", "me", "agua"],
    "correct": ["No", "me", "gusta", "el", "agua", "fría"],
    "explanation": "No me gusta + artikkeli + substantiivi + adjektiivi. Espanjassa adjektiivi tulee substantiivin jälkeen."
  }
]`;

    const exercises = await callOpenAI(prompt, 1500);
    logAiUsage(userId, "reorder", exercises._usage).catch(() => {});
    delete exercises._usage;
    res.json({ exercises });
  } catch (err) {
    console.error("Reorder error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate reorder" });
  }
});

// ─── Translate-mini (short Finnish→Spanish, AI-graded) ───────────────────────

router.post("/translate-mini", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { level = "B", count = 3, language = "spanish" } = req.body;

  if (!VALID_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  const clampedCount = Math.max(1, Math.min(6, Number(count) || 3));

  try {
    const userId = await getUserId(req);
    const lang = LANGUAGE_META[language];
    const levelDesc = LEVEL_DESCRIPTIONS[level];
    const profileCtx = await getUserProfileContext(userId);

    const prompt = `Generate ${clampedCount} mini-translation exercises for Finnish students studying ${lang.name} (yo-koe, lyhyt oppimäärä).
${profileCtx}
LEVEL: ${level} = ${levelDesc}

Each exercise: a SHORT Finnish sentence (5-12 words) that the student translates to ${lang.name}.

REQUIREMENTS:
- Finnish sentence tests specific grammar: ser/estar, subjunctive, preterite vs imperfect, etc.
- acceptedTranslations: array of 2-4 valid ${lang.name} translations
- grammarFocus: what grammar point this tests
- Level ${level} appropriate

Return ONLY JSON array:
[
  {
    "id": 1,
    "type": "translate_mini",
    "finnishSentence": "Haluaisin matkustaa Espanjaan ensi kesänä.",
    "acceptedTranslations": [
      "Me gustaría viajar a España el próximo verano.",
      "Querría viajar a España el verano que viene.",
      "Me gustaría ir a España el próximo verano."
    ],
    "grammarFocus": "konditionaali",
    "explanation": "Me gustaría / Querría = haluaisin (konditionaali). El próximo verano = ensi kesänä."
  }
]`;

    const exercises = await callOpenAI(prompt, 1500);
    logAiUsage(userId, "translate-mini", exercises._usage).catch(() => {});
    delete exercises._usage;
    res.json({ exercises });
  } catch (err) {
    console.error("Translate-mini error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate translate-mini" });
  }
});

// ─── Grade translate-mini (AI grading for free-text) ─────────────────────────

router.post("/grade-translate", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { userAnswer, acceptedTranslations, finnishSentence } = req.body;

  if (!userAnswer || !acceptedTranslations || !finnishSentence) {
    return res.status(400).json({ error: "Puuttuvia kenttiä" });
  }

  try {
    const userId = await getUserId(req);

    const prompt = `You are grading a Finnish student's Spanish translation.

FINNISH ORIGINAL: "${finnishSentence}"
STUDENT'S ANSWER: "${userAnswer}"
ACCEPTED TRANSLATIONS: ${JSON.stringify(acceptedTranslations)}

Grade 0-3:
3 = Perfect or near-perfect (minor accent errors OK)
2 = Understandable, correct grammar, minor word choice issues
1 = Partially correct, some grammar/vocabulary errors
0 = Incorrect or incomprehensible

Return ONLY JSON:
{
  "score": 2,
  "maxScore": 3,
  "correct": false,
  "feedback": "Lyhyt palaute suomeksi — mitä oli oikein, mitä väärin",
  "bestTranslation": "Me gustaría viajar a España el próximo verano.",
  "explanation": "Lyhyt selitys avainrakenteista suomeksi"
}`;

    const result = await callOpenAI(prompt, 500);
    logAiUsage(userId, "grade-translate", result._usage).catch(() => {});
    delete result._usage;
    result.correct = result.score >= 2;
    res.json(result);
  } catch (err) {
    console.error("Grade translate error:", err.message);
    res.status(500).json({ error: err.message || "Failed to grade translation" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTIVE EXERCISE SYSTEM
// Level = slow/persistent, Scaffold = session-internal, Type = variety
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Get user's adaptive state ───────────────────────────────────────────────

router.get("/adaptive-state", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const levelData = await refreshUserLevel(userId);
    const progress = progressToNextLevel(
      levelData.rolling_accuracy_30d,
      levelData.rolling_sessions_30d
    );

    res.json({
      level: levelData.current_level,
      levelSince: levelData.level_since,
      rollingAccuracy: Math.round(levelData.rolling_accuracy_30d * 100),
      rollingSessions: levelData.rolling_sessions_30d,
      canCheckpoint: levelData.canCheckpoint,
      nextLevel: levelData.nextLevel,
      progressToNext: progress,
      shouldWarnDown: levelData.shouldWarnDown,
    });
  } catch (err) {
    console.error("Adaptive state error:", err.message);
    res.status(500).json({ error: "Failed to get adaptive state" });
  }
});

// ─── Generate adaptive exercise ─────────────────────────────────────────────

router.post("/adaptive-exercise", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { topic: reqTopic, count = 4, language = "spanish", recentTypes = [], mode = "normaali" } = req.body;

  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  const clampedCount = Math.max(1, Math.min(8, Number(count) || 4));

  try {
    const userId = req.user.userId;

    // 1. Get persistent level
    const levelData = await getUserLevel(userId);
    const level = levelData.current_level;

    // 2. Resolve topic — use composer when caller doesn't specify one
    let topic = reqTopic;
    if (!topic) {
      const { slots } = await composeSession({ userId, mode, forceTopic: null });
      const newSlot = slots.find(s => s.type === "new") || slots[0];
      topic = newSlot?.topic || "vocab";
    }

    // 3. Get session scaffold state
    const sessionState = await getSessionState(userId, topic, level);
    const scaffoldLevel = sessionState.scaffold_level;
    const scaffold = describeScaffold(scaffoldLevel);

    // 3. Pick exercise type
    const type = pickExerciseType(topic, recentTypes);

    // 4. Build prompt
    const profileCtx = await getUserProfileContext(userId);
    const prompt = composePrompt({
      level,
      type,
      scaffoldLevel,
      topic,
      count: clampedCount,
      language,
      profileContext: profileCtx,
    });

    // 5. Generate
    const maxTokens = getMaxTokens(type, clampedCount);
    const result = await callOpenAI(prompt, maxTokens);
    logAiUsage(userId, "adaptive-exercise", result._usage).catch(() => {});
    delete result._usage;

    // Normalize result
    const exercises = Array.isArray(result) ? result : result.pairs ? [result] : [result];

    res.json({
      exercises,
      meta: {
        level,
        scaffoldLevel,
        scaffold,
        type,
        topic,
      },
    });
  } catch (err) {
    console.error("Adaptive exercise error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate adaptive exercise" });
  }
});

// ─── Report answer (updates scaffold) ───────────────────────────────────────

router.post("/adaptive-answer", requireAuth, async (req, res) => {
  const { topic, isCorrect } = req.body;
  if (typeof isCorrect !== "boolean" || !topic) {
    return res.status(400).json({ error: "topic and isCorrect required" });
  }

  try {
    const userId = req.user.userId;
    const levelData = await getUserLevel(userId);
    const result = await processAnswer(userId, topic, isCorrect, levelData.current_level);

    res.json({
      scaffoldLevel: result.scaffoldLevel,
      scaffoldChanged: result.scaffoldChanged,
      direction: result.direction,
      scaffold: describeScaffold(result.scaffoldLevel),
    });
  } catch (err) {
    console.error("Adaptive answer error:", err.message);
    res.status(500).json({ error: "Failed to process answer" });
  }
});

// ─── Checkpoint test (20 questions, next level, no scaffolding) ─────────────

router.post("/checkpoint/start", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { language = "spanish" } = req.body;

  try {
    const userId = req.user.userId;
    const levelData = await refreshUserLevel(userId);

    if (!levelData.canCheckpoint) {
      return res.status(400).json({
        error: "Et ole vielä valmis checkpointiin",
        reason: !levelData.nextLevel ? "max_level" : "not_eligible",
      });
    }

    const nextLevel = levelData.nextLevel;
    const lang = LANGUAGE_META[language] || LANGUAGE_META.spanish;
    if (!nextLevel) {
      return res.status(400).json({ error: "Ei seuraavaa tasoa saatavilla" });
    }
    const profileCtx = await getUserProfileContext(userId);

    // Checkpoint = 20 questions at next level with NO scaffolding.
    // Before Commit 8 this made 4 sequential OpenAI calls of 5 questions
    // each (~$0.008/checkpoint). Now 2 calls of 10 (~$0.004/checkpoint).
    // Split vocab vs grammar across the two calls; keep type variety by
    // using multichoice for vocab (10) and gap_fill for grammar (10).
    const exercises = [];
    const tokensBefore = { input: 0, output: 0 };

    // Call 1: 10 vocab multichoice items
    {
      const prompt = composePrompt({
        level: nextLevel,
        type: "multichoice",
        scaffoldLevel: 0,
        topic: "vocab",
        count: 10,
        language,
        profileContext: profileCtx,
      });
      const batch = await callOpenAI(prompt, getMaxTokens("multichoice", 10));
      tokensBefore.input  += batch._usage?.inputTokens  || 0;
      tokensBefore.output += batch._usage?.outputTokens || 0;
      logAiUsage(userId, "checkpoint", batch._usage).catch(() => {});
      delete batch._usage;
      exercises.push(...(Array.isArray(batch) ? batch : [batch]));
    }

    // Call 2: 10 grammar gap-fill items
    {
      const prompt = composePrompt({
        level: nextLevel,
        type: "gap_fill",
        scaffoldLevel: 0,
        topic: "grammar",
        count: 10,
        language,
        profileContext: profileCtx,
      });
      const batch = await callOpenAI(prompt, getMaxTokens("gap_fill", 10));
      tokensBefore.input  += batch._usage?.inputTokens  || 0;
      tokensBefore.output += batch._usage?.outputTokens || 0;
      logAiUsage(userId, "checkpoint", batch._usage).catch(() => {});
      delete batch._usage;
      exercises.push(...(Array.isArray(batch) ? batch : [batch]));
    }

    console.log(`[checkpoint] user=${userId} level=${nextLevel} items=${exercises.length} tokens=in:${tokensBefore.input}/out:${tokensBefore.output}`);

    res.json({
      exercises: exercises.slice(0, 20),
      targetLevel: nextLevel,
      currentLevel: levelData.current_level,
      passThreshold: 80,
    });
  } catch (err) {
    console.error("Checkpoint start error:", err.message);
    res.status(500).json({ error: err.message || "Failed to start checkpoint" });
  }
});

router.post("/checkpoint/submit", requireAuth, async (req, res) => {
  const { correct, total } = req.body;

  if (typeof correct !== "number" || typeof total !== "number" || total <= 0) {
    return res.status(400).json({ error: "Virheelliset pisteet" });
  }

  try {
    const userId = req.user.userId;
    const result = await processCheckpointResult(userId, correct, total);

    res.json(result);
  } catch (err) {
    console.error("Checkpoint submit error:", err.message);
    res.status(500).json({ error: "Failed to process checkpoint" });
  }
});

// ─── Focus session: topic-targeted exercises based on past mistakes ────────

router.post("/focus-session", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { topic, count = 10, language = "spanish" } = req.body;

  if (!topic || !VALID_TOPICS.has(topic)) {
    return res.status(400).json({ error: "Virheellinen aihe" });
  }
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  const clampedCount = Math.max(5, Math.min(15, Number(count) || 10));

  try {
    const userId = req.user.userId;
    const levelData = await getUserLevel(userId);
    const level = levelData.current_level;

    // Fetch past mistakes for this topic (last 14 days) to use as examples
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: pastMistakes } = await supabase
      .from("user_mistakes")
      .select("question, wrong_answer, correct_answer")
      .eq("user_id", userId)
      .contains("topics", [topic])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5);

    const mistakeExamples = (pastMistakes || []).map(m =>
      `- Kysymys: "${m.question}" | Väärä vastaus: "${m.wrong_answer}" | Oikea: "${m.correct_answer}"`
    ).join("\n");

    const lang = LANGUAGE_META[language] || LANGUAGE_META.spanish;
    const topicLbl = topicLabel(topic);
    const profileCtx = await getUserProfileContext(userId);

    const prompt = `Generate ${clampedCount} FOCUSED ${lang.name} exercises targeting ONLY this grammar/vocab topic: ${topicLbl} (key: ${topic}).
${profileCtx}
LEVEL: ${level}

IMPORTANT: Every single exercise MUST test ${topicLbl}. Mix up exercise types for variety:
- Multiple choice (multichoice)
- Gap-fill (gap_fill)
- Reorder (reorder)
- Mini translation (translate_mini)

${pastMistakes?.length ? `
USER HAS ALREADY FAILED ON THESE (generate similar but DIFFERENT exercises that test the same concept):
${mistakeExamples}

Create exercises with the same underlying rule but varied contexts and examples.
` : ""}

Each exercise MUST have "topics" field with ["${topic}"] as the primary topic tag.

Return ONLY JSON array of ${clampedCount} exercises. Mix the types. Example:
[
  {
    "id": 1,
    "type": "gap_fill",
    "topics": ["${topic}"],
    "sentence": "...",
    "hint": "...",
    "correctAnswer": "...",
    "alternativeAnswers": ["..."],
    "explanation": "..."
  },
  {
    "id": 2,
    "type": "multichoice",
    "topics": ["${topic}"],
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": "A",
    "explanation": "..."
  }
]`;

    const exercises = await callOpenAI(prompt, Math.min(clampedCount * 250, 3500));
    logAiUsage(userId, "focus-session", exercises._usage).catch(() => {});
    delete exercises._usage;

    // Ensure all exercises have the topic tag
    const tagged = (Array.isArray(exercises) ? exercises : [exercises]).map(ex => ({
      ...ex,
      topics: Array.isArray(ex.topics) && ex.topics.length ? ex.topics : [topic],
    }));

    res.json({
      exercises: tagged,
      topic,
      topicLabel: topicLbl,
      level,
      pastMistakesUsed: pastMistakes?.length || 0,
    });
  } catch (err) {
    console.error("Focus session error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate focus session" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LEARNING PATH — sequential topic progression with mastery tests
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/learning-path", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const path = await getUserPath(userId);

    const masteredCount = path.filter(t => t.status === "mastered").length;
    const currentIdx = path.findIndex(t => t.status === "available" || t.status === "in_progress");

    res.json({
      path,
      totalTopics: path.length,
      masteredCount,
      currentIndex: currentIdx >= 0 ? currentIdx : masteredCount,
    });
  } catch (err) {
    console.error("Learning path error:", err.message);
    res.status(500).json({ error: "Failed to load learning path" });
  }
});

router.post("/mastery-test/start", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { topicKey, language = "spanish" } = req.body;
  const topic = getTopicByKey(topicKey);
  if (!topic) return res.status(400).json({ error: "Virheellinen aihe" });

  try {
    const userId = req.user.userId;
    const path = await getUserPath(userId);
    const topicState = path.find(t => t.key === topicKey);

    if (!topicState || topicState.status === "locked") {
      return res.status(403).json({ error: "Aihe ei ole vielä auki" });
    }

    const profileCtx = await getUserProfileContext(userId);
    const lang = LANGUAGE_META[language] || LANGUAGE_META.spanish;

    // Generate 20 mastery questions targeting this topic
    const prompt = `Generate ${MASTERY_TEST_SIZE} mastery-test exercises for a Finnish student (yo-koe lyhyt oppimäärä) on this specific topic:

TOPIC: ${topic.label}
FOCUS: ${topic.promptFocus}
LEVEL: ${topic.level}
${profileCtx}

This is a MASTERY TEST — all ${MASTERY_TEST_SIZE} exercises MUST test this exact grammar point. The student needs 80% correct (16/20) to prove mastery.

Mix exercise types:
- multichoice (8-10): traditional question with 4 options
- gap_fill (6-8): sentence with blank + hint (infinitive form)
- reorder (2-3): scrambled words to arrange
- translate_mini (1-2): short Finnish → ${lang.name} sentence

Difficulty: test the rule thoroughly — include edge cases, common mistakes, near-minimal pairs.

Return ONLY a JSON array:
[
  {
    "id": 1,
    "type": "multichoice",
    "topics": ["${topicKey}"],
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": "A",
    "explanation": "Lyhyt selitys suomeksi"
  },
  {
    "id": 2,
    "type": "gap_fill",
    "topics": ["${topicKey}"],
    "sentence": "... ___ ...",
    "hint": "(infinitive, form)",
    "correctAnswer": "...",
    "alternativeAnswers": ["..."],
    "explanation": "..."
  }
]`;

    const exercises = await callOpenAI(prompt, 4000);
    logAiUsage(userId, "mastery-test", exercises._usage).catch(() => {});
    delete exercises._usage;

    const arr = Array.isArray(exercises) ? exercises : [exercises];

    res.json({
      exercises: arr.slice(0, MASTERY_TEST_SIZE),
      topic: topicKey,
      topicLabel: topic.label,
      total: MASTERY_TEST_SIZE,
      passThreshold: 80,
    });
  } catch (err) {
    console.error("Mastery test start error:", err.message);
    res.status(500).json({ error: err.message || "Failed to start mastery test" });
  }
});

router.post("/mastery-test/submit", requireAuth, async (req, res) => {
  const { topicKey, correct, total } = req.body;
  if (!topicKey || typeof correct !== "number" || typeof total !== "number") {
    return res.status(400).json({ error: "Virheelliset parametrit" });
  }

  try {
    const userId = req.user.userId;
    const result = await recordMasteryAttempt(userId, topicKey, correct, total);

    // If newly mastered, add the next topic info
    let nextTopicLabel = null;
    if (result.unlockedNext) {
      const next = getTopicByKey(result.unlockedNext);
      nextTopicLabel = next?.label || null;
    }

    res.json({ ...result, nextTopicLabel });
  } catch (err) {
    console.error("Mastery test submit error:", err.message);
    res.status(500).json({ error: "Failed to submit mastery test" });
  }
});

// Mixed review of all mastered topics
router.post("/mixed-review", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { count = 15, language = "spanish" } = req.body;

  try {
    const userId = req.user.userId;
    const mastered = await getMasteredTopics(userId);

    if (mastered.length === 0) {
      return res.status(400).json({ error: "Ei vielä osattuja aiheita. Suorita ensin polku-aiheita." });
    }

    const clampedCount = Math.max(5, Math.min(20, Number(count) || 15));
    const topicDetails = mastered
      .map(k => getTopicByKey(k))
      .filter(Boolean)
      .map(t => `- ${t.label}: ${t.promptFocus}`)
      .join("\n");

    const lang = LANGUAGE_META[language] || LANGUAGE_META.spanish;
    const profileCtx = await getUserProfileContext(userId);

    const prompt = `Generate ${clampedCount} MIXED review exercises combining these mastered topics:
${topicDetails}
${profileCtx}

Distribute exercises across ALL listed topics roughly equally.
Mix exercise types: multichoice, gap_fill, reorder, translate_mini.

Each exercise MUST have "topics" field with the topic key(s) tested.

Return ONLY JSON array of ${clampedCount} exercises.`;

    const exercises = await callOpenAI(prompt, 3500);
    logAiUsage(userId, "mixed-review", exercises._usage).catch(() => {});
    delete exercises._usage;

    const arr = Array.isArray(exercises) ? exercises : [exercises];

    res.json({
      exercises: arr.slice(0, clampedCount),
      masteredTopics: mastered,
    });
  } catch (err) {
    console.error("Mixed review error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate mixed review" });
  }
});

export default router;
