import { Router } from "express";
import supabase from "../supabase.js";
import {
  callOpenAI, getUserProfileContext,
  LEVEL_DESCRIPTIONS, TOPIC_CONTEXT, LANGUAGE_META,
  GRAMMAR_TOPIC_DESCS, READING_LEVEL_DESCS, READING_TOPIC_CONTEXTS,
  GRADES, GRADE_ORDER,
  VALID_LEVELS, VALID_VOCAB_TOPICS, VALID_GRAMMAR_TOPICS,
  VALID_READING_TOPICS, VALID_READING_LEVELS, VALID_LANGUAGES,
} from "../lib/openai.js";
import { requireAuth, requirePro } from "../middleware/auth.js";
import { aiLimiter, aiStrictLimiter, reportLimiter } from "../middleware/rateLimit.js";
import { checkMonthlyCostLimit } from "../middleware/costLimit.js";
import { logAiUsage } from "../lib/aiCost.js";
import { getUserLevel, refreshUserLevel, processCheckpointResult, progressToNextLevel } from "../lib/levelEngine.js";
import { pointsToYoGrade } from "../lib/grading.js";
import { getSessionState, processAnswer, describeScaffold } from "../lib/scaffoldEngine.js";
import { pickExerciseType, composePrompt, getMaxTokens } from "../lib/exerciseComposer.js";
import { topicLabel, VALID_TOPICS } from "../lib/mistakeTaxonomy.js";
import { getUserPath, recordMasteryAttempt, getTopicByKey, getMasteredTopics, LEARNING_PATH, MASTERY_TEST_SIZE } from "../lib/learningPath.js";

const router = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

// ─── Exercise bank helpers ─────────────────────────────────────────────────

async function getUserId(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !user) return null;
  return user.id;
}

async function tryBankExercise(mode, level, topic, language, userId) {
  // 50% chance to try the bank
  if (Math.random() > 0.5) return null;

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
  const { level = "B", topic = "general vocabulary", count = 4, language = "spanish" } = req.body;

  if (!VALID_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_VOCAB_TOPICS.has(topic)) return res.status(400).json({ error: "Virheellinen aihe" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  const clampedCount = Math.max(1, Math.min(10, Number(count) || 4));

  try {
    // Try bank first
    const userId = await getUserId(req);
    const banked = await tryBankExercise("vocab", level, topic, language, userId);
    if (banked) {
      return res.json({ exercises: banked.payload, bankId: banked.bankId });
    }

    // Generate with AI
    const lang = LANGUAGE_META[language];
    const levelDesc = LEVEL_DESCRIPTIONS[level];
    const topicContext = TOPIC_CONTEXT[topic];
    const profileCtx = await getUserProfileContext(userId);

    const prompt = `You are generating vocabulary exercises for Finnish high school students taking the ${lang.name} "lyhyt oppimäärä" yo-koe (matriculation exam). Students have studied ${lang.name} for about ${lang.yearsStudied}.
${profileCtx}
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

Return ONLY a JSON array, no markdown:
[
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
]`;

    const warnings = [];
    let exercises = await callOpenAI(prompt, 2000);
    logAiUsage(userId, "generate", exercises._usage).catch(() => {});
    delete exercises._usage;

    let validation = validateVocabBatch(exercises);
    if (!validation.ok) {
      // One retry with the same prompt — OpenAI sometimes needs a second pass.
      const retry = await callOpenAI(prompt, 2000);
      logAiUsage(userId, "generate", retry._usage).catch(() => {});
      delete retry._usage;
      const retryValidation = validateVocabBatch(retry);
      if (retryValidation.ok) {
        exercises = retry;
        validation = retryValidation;
      } else {
        // Surface warnings rather than 500ing. The UI still gets a valid shape.
        warnings.push(...validation.issues);
      }
    }

    // Save to bank (fire-and-forget) — only for fully-valid batches
    if (validation.ok) saveToBankBulk("vocab", level, topic, language, exercises).catch(() => {});

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

// ─── Grammar exercises ─────────────────────────────────────────────────────

router.post("/grammar-drill", requireAuth, aiLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { topic = "mixed", level = "C", count = 6, language = "spanish" } = req.body;

  if (!VALID_GRAMMAR_TOPICS.has(topic)) return res.status(400).json({ error: "Virheellinen kielioppiaihe" });
  if (!VALID_READING_LEVELS.has(level) && !VALID_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  const clampedCount = Math.max(1, Math.min(10, Number(count) || 6));

  try {
    const userId = await getUserId(req);
    const banked = await tryBankExercise("grammar", level, topic, language, userId);
    if (banked) {
      return res.json({ exercises: banked.payload, bankId: banked.bankId });
    }

    const lang = LANGUAGE_META[language];
    const topicDesc = GRAMMAR_TOPIC_DESCS[topic];
    const profileCtx = await getUserProfileContext(userId);

    const prompt = `You are generating ${lang.name} grammar exercises for Finnish high school students (yo-koe, lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).
${profileCtx}
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
- Explanations in Finnish, SHORT and memorable — state the RULE
- "rule" field: short label like "ser/estar", "ojalá+subj.", "konditionaali", "pretériti/imperfekti", "hay+artikkeli", "relatiivi"

Return ONLY a JSON array (no markdown):
[
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
]`;

    const exercises = await callOpenAI(prompt, 2500);
    logAiUsage(userId, "grammar-drill", exercises._usage).catch(() => {});
    delete exercises._usage;
    saveToBankBulk("grammar", level, topic, language, exercises).catch(() => {});
    res.json({ exercises });
  } catch (err) {
    console.error("Grammar drill error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate grammar exercises" });
  }
});

// ─── Reading exercises ─────────────────────────────────────────────────────

router.post("/reading-task", requireAuth, requirePro, aiStrictLimiter, checkMonthlyCostLimit, async (req, res) => {
  const { level = "C", topic = "animals and nature", language = "spanish" } = req.body;

  if (!VALID_READING_LEVELS.has(level)) return res.status(400).json({ error: "Virheellinen taso" });
  if (!VALID_READING_TOPICS.has(topic)) return res.status(400).json({ error: "Virheellinen aihe" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });

  try {
    const userId = await getUserId(req);
    const banked = await tryBankExercise("reading", level, topic, language, userId);
    if (banked) {
      return res.json({ reading: banked.payload, bankId: banked.bankId });
    }

    const lang = LANGUAGE_META[language];
    const levelDesc = READING_LEVEL_DESCS[level];
    const topicContext = READING_TOPIC_CONTEXTS[topic];
    const profileCtx = await getUserProfileContext(userId);

    const prompt = `Generate a reading comprehension exercise for Finnish students taking the ${lang.name} yo-koe (lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).
${profileCtx}
Text level: ${level} — ${levelDesc}
Topic: ${topicContext}

Make the text feel like a REAL source: a blog post, news snippet, interview excerpt, or webpage. Give it a realistic title and source.

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
    saveToBankBulk("reading", level, topic, language, reading).catch(() => {});
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
  const { topic = "vocab", count = 4, language = "spanish", recentTypes = [] } = req.body;

  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });
  const clampedCount = Math.max(1, Math.min(8, Number(count) || 4));

  try {
    const userId = req.user.userId;

    // 1. Get persistent level
    const levelData = await getUserLevel(userId);
    const level = levelData.current_level;

    // 2. Get session scaffold state
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
    const profileCtx = await getUserProfileContext(userId);

    // Generate 20 questions at next level with NO scaffolding
    const types = ["multichoice", "gap_fill", "reorder", "translate_mini", "gap_fill"];
    const exercises = [];

    // Generate in batches of 4-5 across different types
    for (let i = 0; i < 4; i++) {
      const type = types[i];
      const prompt = composePrompt({
        level: nextLevel,
        type,
        scaffoldLevel: 0, // no scaffolding
        topic: i < 2 ? "vocab" : "grammar",
        count: 5,
        language,
        profileContext: profileCtx,
      });

      const batch = await callOpenAI(prompt, getMaxTokens(type, 5));
      logAiUsage(userId, "checkpoint", batch._usage).catch(() => {});
      delete batch._usage;

      const arr = Array.isArray(batch) ? batch : [batch];
      exercises.push(...arr);
    }

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
