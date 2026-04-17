import { Router } from "express";
import supabase from "../supabase.js";
import {
  callOpenAI,
  LEVEL_DESCRIPTIONS, TOPIC_CONTEXT, LANGUAGE_META,
  GRAMMAR_TOPIC_DESCS, READING_LEVEL_DESCS, READING_TOPIC_CONTEXTS,
  GRADES, GRADE_ORDER,
  VALID_LEVELS, VALID_VOCAB_TOPICS, VALID_GRAMMAR_TOPICS,
  VALID_READING_TOPICS, VALID_READING_LEVELS, VALID_LANGUAGES,
} from "../lib/openai.js";
import { requireAuth, softProGate } from "../middleware/auth.js";
import { aiLimiter, aiStrictLimiter } from "../middleware/rateLimit.js";

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

router.post("/generate", aiLimiter, async (req, res) => {
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

    const prompt = `You are generating vocabulary exercises for Finnish high school students taking the ${lang.name} "lyhyt oppimäärä" yo-koe (matriculation exam). Students have studied ${lang.name} for about ${lang.yearsStudied}.

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

    const exercises = await callOpenAI(prompt, 2000);

    // Save to bank (fire-and-forget)
    saveToBankBulk("vocab", level, topic, language, exercises).catch(() => {});

    res.json({ exercises });
  } catch (err) {
    console.error("Generate exercises error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate exercises" });
  }
});

// ─── Grade ─────────────────────────────────────────────────────────────────

router.post("/grade", async (req, res) => {
  const { correct, total, level } = req.body;

  if (typeof correct !== "number" || typeof total !== "number" || total <= 0) {
    return res.status(400).json({ error: "Virheelliset pisteet" });
  }

  const pct = Math.round((correct / total) * 100);

  const levelBonus = { I: 2, A: 1, B: 0, C: 0, M: -1, E: -1, L: -2 };
  const bonus = levelBonus[level] || 0;

  let grade;
  if (pct >= 92) grade = bonus >= 0 ? "L" : "E";
  else if (pct >= 80) grade = bonus >= 0 ? "E" : "M";
  else if (pct >= 67) grade = "M";
  else if (pct >= 53) grade = "C";
  else if (pct >= 38) grade = "B";
  else if (pct >= 22) grade = "A";
  else grade = "I";

  const idx = GRADES.indexOf(grade);
  const adjusted = GRADES[Math.max(0, Math.min(6, idx + bonus))];

  res.json({ grade: adjusted, pct, correct, total });
});

// ─── Grammar exercises ─────────────────────────────────────────────────────

router.post("/grammar-drill", aiLimiter, async (req, res) => {
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

    const prompt = `You are generating ${lang.name} grammar exercises for Finnish high school students (yo-koe, lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).

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
    saveToBankBulk("grammar", level, topic, language, exercises).catch(() => {});
    res.json({ exercises });
  } catch (err) {
    console.error("Grammar drill error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate grammar exercises" });
  }
});

// ─── Reading exercises ─────────────────────────────────────────────────────

router.post("/reading-task", aiStrictLimiter, softProGate, async (req, res) => {
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

    const prompt = `Generate a reading comprehension exercise for Finnish students taking the ${lang.name} yo-koe (lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).

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
    saveToBankBulk("reading", level, topic, language, reading).catch(() => {});
    res.json({ reading });
  } catch (err) {
    console.error("Reading task error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate reading task" });
  }
});

// ─── Report exercise ───────────────────────────────────────────────────────

router.post("/report-exercise", async (req, res) => {
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

export default router;
