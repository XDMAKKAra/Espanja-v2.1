import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./supabase.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── Auth middleware ──────────────────────────────────────────────────────────

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !user) return res.status(401).json({ error: "Invalid token" });
  req.user = { userId: user.id, email: user.email };
  next();
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: "Sähköposti ja salasana (min 6 merkkiä) vaaditaan" });
  }
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
  });
  if (createErr) {
    if (createErr.message.toLowerCase().includes("already")) {
      return res.status(400).json({ error: "Sähköposti on jo käytössä" });
    }
    return res.status(500).json({ error: "Rekisteröinti epäonnistui" });
  }
  const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  if (signInErr) return res.status(500).json({ error: "Kirjautuminen epäonnistui rekisteröinnin jälkeen" });
  res.json({ token: session.session.access_token, email: created.user.email });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Täytä kaikki kentät" });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  if (error) return res.status(401).json({ error: "Väärä sähköposti tai salasana" });
  res.json({ token: data.session.access_token, email: data.user.email });
});

// ─── Progress endpoints ───────────────────────────────────────────────────────

app.post("/api/progress", requireAuth, async (req, res) => {
  const { mode, level, scoreCorrect, scoreTotal, ytlGrade } = req.body;
  const { error } = await supabase.from("exercise_logs").insert({
    user_id: req.user.userId,
    mode,
    level: level ?? null,
    score_correct: scoreCorrect ?? null,
    score_total: scoreTotal ?? null,
    ytl_grade: ytlGrade ?? null,
  });
  if (error) return res.status(500).json({ error: "Failed to save progress" });
  res.json({ ok: true });
});

const GRADE_ORDER = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };

app.get("/api/dashboard", requireAuth, async (req, res) => {
  const userId = req.user.userId;

  const { data: logs, error } = await supabase
    .from("exercise_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to load dashboard" });

  const totalSessions = logs.length;

  // Per-mode stats
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

  // Chart data: last 60 sessions in chronological order (oldest → newest)
  const chartData = logs.slice(0, 60).reverse().map((l) => ({
    mode: l.mode,
    ytlGrade: l.ytl_grade,
    pct: l.score_total > 0 ? Math.round((l.score_correct / l.score_total) * 100) : null,
  }));

  // Estimated current level: rolling average of last 5 graded sessions
  const gradeNames = ["I", "A", "B", "C", "M", "E", "L"];
  const recentGraded = logs.filter(
    (l) => l.ytl_grade && GRADE_ORDER[l.ytl_grade] !== undefined
  ).slice(0, 5);
  let estLevel = null;
  if (recentGraded.length > 0) {
    const avgIdx = Math.round(
      recentGraded.reduce((s, l) => s + GRADE_ORDER[l.ytl_grade], 0) / recentGraded.length
    );
    estLevel = gradeNames[Math.max(0, Math.min(6, avgIdx))];
  }

  // Streak: consecutive calendar days with at least one session
  const daySet = new Set(logs.map((l) => l.created_at.slice(0, 10)));
  const sortedDays = [...daySet].sort().reverse();
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = 0;
  if (sortedDays.length > 0 && (sortedDays[0] === todayStr || sortedDays[0] === yesterdayStr)) {
    streak = 1;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const diff = (new Date(sortedDays[i]) - new Date(sortedDays[i + 1])) / 86400000;
      if (diff === 1) { streak++; } else { break; }
    }
  }

  // Weekly session counts
  const nowMs = Date.now();
  const weekMs = 7 * 24 * 3600000;
  const weekSessions = logs.filter(
    (l) => nowMs - new Date(l.created_at).getTime() < weekMs
  ).length;
  const prevWeekSessions = logs.filter((l) => {
    const age = nowMs - new Date(l.created_at).getTime();
    return age >= weekMs && age < 2 * weekMs;
  }).length;

  // Suggested vocab starting level (avg of recent vocab peak levels)
  const recentVocab = logs.filter((l) => l.mode === "vocab" && l.level).slice(0, 5);
  let suggestedLevel = "B";
  if (recentVocab.length > 0) {
    const idxs = recentVocab.map((l) => Math.max(0, gradeNames.indexOf(l.level)));
    const avg = idxs.reduce((a, b) => a + b, 0) / idxs.length;
    suggestedLevel = gradeNames[Math.min(6, Math.round(avg))];
  }

  // Days since last practice per mode (for "due" indicators)
  const modeDaysAgo = {};
  for (const mode of ["vocab", "grammar", "reading", "writing"]) {
    const last = logs.find((l) => l.mode === mode);
    modeDaysAgo[mode] = last
      ? Math.floor((nowMs - new Date(last.created_at + "Z").getTime()) / 86400000)
      : null;
  }

  res.json({
    totalSessions, modeStats, recent, chartData, estLevel,
    streak, weekSessions, prevWeekSessions, suggestedLevel, modeDaysAgo,
  });
});

const OPENAI_API = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

// Maps yo-koe levels to what they actually mean in Finnish lukio context
const LEVEL_DESCRIPTIONS = {
  I: "improbatur — barely any Spanish. Student cannot form basic sentences. Test only the most fundamental words: casa, familia, libro, amigo, comer, ir. Distractors should be plausible but clearly different in meaning.",
  A: "approbatur — weak pass. Knows basic vocabulary but makes fundamental errors. Can handle present tense only. Test elementary everyday words: ropa, tienda, hablar, trabajar, ciudad. Student at this level confuses very basic words.",
  B: "lubenter approbatur — adequate pass. Understands everyday vocabulary, still makes frequent grammar errors. Test vocabulary related to travel, food, school, work, health. Distractors should be semantically close (e.g. confusing similar concepts).",
  C: "cum laude approbatur — above average. Decent vocabulary range. Test intermediate vocabulary: less common nouns, phrasal structures, words from authentic texts about society and culture. Distractors should require real knowledge to distinguish.",
  M: "magna cum laude approbatur — good. Solid vocabulary, can handle complex topics. Test nuanced vocabulary, idiomatic expressions, words used in journalism and everyday authentic texts. Focus on register and connotation.",
  E: "eximia cum laude approbatur — excellent, top ~15%. Strong vocabulary. Test sophisticated vocabulary, less common expressions, words requiring cultural knowledge about Spain and Latin America. Distractors are very close in meaning.",
  L: "laudatur — top 5%. Near-native comprehension. Test advanced vocabulary, idioms, regional differences, words from high-quality authentic texts. Distractors require deep knowledge to eliminate.",
};

// Real yo-koe topic areas (from YTL exam history)
const TOPIC_CONTEXT = {
  "general vocabulary": "general everyday Spanish vocabulary appropriate for the level",
  "society and politics": "societal topics: discrimination, equality, environment, democracy, protests, social media influence",
  "environment and nature": "ecological topics: recycling, climate, biodiversity, sustainable living, nature conservation",
  "health and body": "health topics: exercise, diet, mental health, sports, medical appointments, body image",
  "travel and transport": "travel: airports, delays, directions, accommodation, public transport, tourism",
  "culture and arts": "culture: music, art, theatre, ballet, cinema, festivals, Latin American culture, Spanish traditions",
  "work and economy": "work: jobs, salaries, internships, unemployment, economy, entrepreneurship",
};

// --- ENDPOINT: Generate vocabulary/structure exercises ---
app.post("/api/generate", async (req, res) => {
  const { level, topic, count = 4 } = req.body;
  const levelDesc = LEVEL_DESCRIPTIONS[level] || LEVEL_DESCRIPTIONS["B"];
  const topicContext = TOPIC_CONTEXT[topic] || topic;

  const prompt = `You are generating vocabulary questions for Finnish high school students taking the Spanish "lyhyt oppimäärä" yo-koe (matriculation exam). Students have studied Spanish for about 3 years in lukio.

TARGET LEVEL: ${level} = ${levelDesc}

TOPIC: ${topicContext}

Generate ${count} multiple choice vocabulary questions. Each question tests ONE Spanish word or short phrase by asking what it means, OR tests the right word to use in context.

Question formats to mix:
- "¿Qué significa '[word]'?" (what does X mean)
- "¿Cómo se dice '[Finnish or English concept]' en español?" (how do you say X)
- Short sentence with a gap: "Ayer fui al _____ para comprar pan." [options: mercado/museo/hospital/aeropuerto]

Rules:
- Questions in Spanish
- Options in Finnish (preferred for this Finnish audience) or English, labeled A) B) C) D)
- Difficulty MUST match the level description exactly — this is used for adaptive learning
- For level B-C: include words that appear in real yo-koe reading texts (daily life, travel, culture)
- For level E-L: include words that distinguish excellent students (nuanced vocabulary, near-synonyms that differ in register)
- Explanations brief and useful: give both the Spanish meaning AND the Finnish translation

Return ONLY a JSON array, no markdown:
[
  {
    "id": 1,
    "question": "¿Qué significa 'el ayuntamiento'?",
    "options": ["A) kaupungintalo", "B) sairaala", "C) koulu", "D) tori"],
    "correct": "A",
    "explanation": "el ayuntamiento = kaupungintalo (city hall). Verbi: el municipio = kunta"
  }
]`;

  try {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const exercises = JSON.parse(clean);
    res.json({ exercises });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate exercises" });
  }
});

// --- ENDPOINT: Generate a writing task ---
app.post("/api/writing-task", async (req, res) => {
  const { taskType, topic } = req.body;
  // taskType: "short" (160-240 chars, 33p) or "long" (300-450 chars, 66p)

  const isShort = taskType === "short";
  const charRange = isShort ? "160–240" : "300–450";
  const points = isShort ? 33 : 66;

  const prompt = `Generate ONE realistic Spanish yo-koe writing task for Finnish students (lyhyt oppimäärä, 3 years of Spanish).

Task type: ${isShort ? "SHORT task (lyhyt kirjoitustehtävä)" : "LONG task (laajempi kirjoitustehtävä)"}
Character limit: ${charRange} characters (spaces and line breaks NOT counted)
Max points: ${points}
Topic area: ${topic || "general"}

${isShort ? `SHORT TASK RULES:
- Should be a SHORT practical message/text: email to a stranger, message to a neighbor, short note, social media message, apology, congratulations
- Must have a clear SITUATION and RECIPIENT
- Give 2-3 specific things to mention in the response
- Example topics from real yo-koe: finding a lost diary in a fitting room and writing to the owner; new neighbor moved in from Mexico, introduce yourself; you missed a farewell party, apologize` : `LONG TASK RULES:
- Should be a LONGER text: forum comment, TripAdvisor review, opinion piece, letter with explanation
- Must require taking a STANCE or sharing multiple perspectives
- Give 2-3 angles to explore
- Example topics from real yo-koe: comment on small environmental acts (#pequeñosactos); recommend a place to visit in your city (TripAdvisor style); discuss best way to live (alone/with parents/with roommates); free activities for an exchange student`}

Return ONLY JSON:
{
  "taskType": "${taskType}",
  "points": ${points},
  "charMin": ${isShort ? 160 : 300},
  "charMax": ${isShort ? 240 : 450},
  "situation": "Brief Finnish context sentence explaining the situation (1-2 sentences in Finnish)",
  "prompt": "The actual task instruction in Spanish (what they must write)",
  "requirements": ["requirement 1 in Finnish", "requirement 2 in Finnish", "requirement 3 in Finnish"],
  "textType": "e.g. sähköpostiviesti / foorumikommentti / TripAdvisor-arvio"
}`;

  try {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const task = JSON.parse(clean);
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate writing task" });
  }
});

// --- ENDPOINT: Grade a writing submission ---
app.post("/api/grade-writing", async (req, res) => {
  const { task, studentText } = req.body;
  const isShort = task.taskType === "short";
  const maxScore = task.points;

  // Valid score steps
  const shortSteps = [0, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33];
  const longSteps = [0, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66];
  const validSteps = isShort ? shortSteps : longSteps;

  const charCount = studentText.replace(/\s/g, "").length;
  const overLimit = charCount > task.charMax;
  const penalty = overLimit ? (isShort ? 3 : 6) : 0;

  const prompt = `You are grading a Finnish high school student's Spanish writing for the yo-koe exam (lyhyt oppimäärä).

TASK:
${task.situation}
Instructions: ${task.prompt}
Requirements: ${task.requirements.join(", ")}
Task type: ${isShort ? "Short task (max 33 points)" : "Long task (max 66 points)"}

STUDENT'S TEXT (${charCount} chars without spaces):
"""
${studentText}
"""

${overLimit ? `⚠️ OVER CHARACTER LIMIT: Student wrote ${charCount} chars, limit is ${task.charMax}. Deduct ${penalty} points from final score.` : ""}

GRADE using YTL (Ylioppilastutkintolautakunta) criteria in this EXACT order of importance:

1. VIESTINNÄLLISYYS (most important — decisive factor):
   - Does the message come through clearly, naturally, and fluently on first read?
   - Is it easy to understand who is writing, to whom, and why?
   - Is the register consistent throughout?

2. TEHTÄVÄNANTO JA AIHEEN KÄSITTELY:
   - Are ALL requirements of the task addressed?
   - Is the topic treated with depth, not just listing facts?
   - Does it go beyond the surface — multiple angles, details?

3. KIELELLISET RESURSSIT JA OIKEAKIELISYYS:
   - Vocabulary range and appropriateness
   - Grammar accuracy (especially: ser/estar, hay vs estar, ojala+subjuntivo, conditional, preterite vs imperfect)
   - Connector words (además, sin embargo, por otro lado, aunque, así que)
   - Spelling and accents

COMMON ERRORS TO SPECIFICALLY CHECK:
- ser/estar confusion (¿Eres triste? → ¿Estás triste? / es bastante limpio → está bastante limpio)
- hay + article (hay las gaviotas → hay gaviotas)
- ojala + indicative (Ojalá que te gustará → Ojalá que te guste)
- Wrong conditional (me quería → me gustaría)
- Anglicisms (introducir for "esitellä" → presentar)
- Gender agreement errors (bienvenido to a girl → bienvenida)
- Missing relative pronouns (sitios tienes que visitar → sitios que tienes que visitar)
- Article with country names (la España → España)
- Missing verbs (yo importante tiempo → yo pasé tiempo importante)
- Tense inconsistency (mixing perfecto/pretérito without time markers)

VALID SCORE STEPS for ${isShort ? "short (33p)" : "long (66p)"} task:
${validSteps.join(" — ")}
${penalty > 0 ? `After deducting ${penalty}p for over-limit: choose the closest valid step below the adjusted score.` : ""}

Return ONLY this JSON (no markdown):
{
  "rawScore": <score before any penalty, must be a valid step>,
  "penalty": ${penalty},
  "finalScore": <rawScore - penalty, rounded down to nearest valid step>,
  "maxScore": ${maxScore},
  "ytlGrade": "<one of: I / A / B / C / M / E / L based on quality>",
  "criteria": {
    "viestinnallisyys": { "rating": "<heikko/kohtalainen/hyvä/erinomainen>", "comment": "<1-2 sentences in Finnish>" },
    "tehtavananto": { "rating": "<heikko/kohtalainen/hyvä/erinomainen>", "comment": "<1-2 sentences in Finnish>" },
    "kielioppi": { "rating": "<heikko/kohtalainen/hyvä/erinomainen>", "comment": "<1-2 sentences in Finnish>" }
  },
  "errors": [
    { "original": "<the erroneous phrase>", "correct": "<correct form>", "type": "<error type>", "explanation": "<brief Finnish explanation>" }
  ],
  "positives": ["<thing done well 1>", "<thing done well 2>"],
  "overallFeedback": "<2-3 sentences in Finnish — what to focus on to improve>"
}`;

  try {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(clean);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to grade writing" });
  }
});

// --- ENDPOINT: Grade a completed vocabulary session ---
app.post("/api/grade", async (req, res) => {
  const { correct, total, level } = req.body;
  const pct = Math.round((correct / total) * 100);

  // Map percentage + level to yo-koe grade
  // At higher levels, same percentage = lower grade (harder questions)
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

  // Apply level bonus for reaching higher levels
  const grades = ["I", "A", "B", "C", "M", "E", "L"];
  const idx = grades.indexOf(grade);
  const adjusted = grades[Math.max(0, Math.min(6, idx + bonus))];

  res.json({ grade: adjusted, pct, correct, total });
});

// --- ENDPOINT: Grammar drill exercises ---
const GRAMMAR_TOPIC_DESCS = {
  mixed: "a mix of ALL these (at least 3 different types per set): ser/estar, hay/estar, ojalá+subjunctive, conditional vs imperfect, preterite vs imperfect, relative pronouns, article mistakes",
  ser_estar: "ONLY ser vs estar. ser = permanent (identity, origin, nationality, profession, material, time). estar = temporary (location, feelings/states, condition, progressive). Key pairs to test: ¿Eres/Estás triste?, es/está cansado, La sopa es/está fría, ¿Dónde estás/eres?",
  hay_estar: "ONLY hay vs estar/haber. hay = existence (impersonal, there is/are). estar = location of specific known thing. CRITICAL RULE: hay NEVER takes a definite article. hay una mesa ✓, hay la mesa ✗, hay gaviotas ✓, hay las gaviotas ✗",
  subjunctive: "ONLY subjunctive mood. ojalá ALWAYS requires subjunctive, NEVER indicative. Also: para que, querer que, esperar que, es importante que. Test: Ojalá te guste (✓) vs Ojalá te gustará (✗), Para que puedas venir (✓)",
  conditional: "ONLY conditional tense. me gustaría (I would like) ≠ me quería (I wanted/imperfect). podría, sería, tendría. Polite requests: ¿Podrías ayudarme? Wishes: Me gustaría vivir en España. Test the imperfect vs conditional confusion",
  preterite_imperfect: "ONLY preterite vs imperfect. Preterite = completed action (ayer, anteayer, el lunes, de repente). Imperfect = background/habit/state (siempre, todos los días, cuando era niño, antes). Classic: Estaba en casa cuando llegó",
  pronouns: "ONLY pronouns. Relative: que (things+people), quien after prepositions (people), donde (places). Object pronoun order: indirect before direct (te lo doy, me lo ha dado). NEVER omit que: sitios que tienes que visitar ✓, sitios tienes que visitar ✗"
};

app.post("/api/grammar-drill", async (req, res) => {
  const { topic = "mixed", level = "C", count = 6 } = req.body;
  const topicDesc = GRAMMAR_TOPIC_DESCS[topic] || GRAMMAR_TOPIC_DESCS.mixed;

  const prompt = `You are generating Spanish grammar exercises for Finnish high school students (yo-koe, lyhyt oppimäärä, 3 years of Spanish).

GRAMMAR FOCUS: ${topicDesc}
LEVEL: ${level} — appropriate difficulty for this yo-koe level
COUNT: ${count} exercises

Generate ${count} exercises mixing these types:
- "gap": Sentence with ___ — choose the correct Spanish form
- "correction": "Korjaa virhe:" + erroneous sentence — choose the corrected version

REQUIREMENTS:
- Sentences must look like real yo-koe essay sentences (messages, opinions, descriptions, personal experiences)
- Distractors must be plausible near-misses students actually make
- Explanations in Finnish, SHORT and memorable — state the RULE
- "rule" field: short label like "ser/estar", "ojalá+subj.", "konditioanaali", "pretériti/imperfekti", "hay+artikkeli", "relatiivi"

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
  }
]`;

  try {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const exercises = JSON.parse(clean);
    res.json({ exercises });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate grammar exercises" });
  }
});

// --- ENDPOINT: Reading comprehension ---
const READING_LEVEL_DESCS = {
  B: "A2 level: short simple sentences, present/past tense only, very common everyday vocabulary. ~180-200 words.",
  C: "B1- level: some subordinate clauses, moderate vocabulary, variety of tenses. ~210-250 words.",
  M: "B1 level: authentic-feeling prose, varied vocabulary, complex sentences occasionally. ~250-290 words.",
  E: "B2- level: sophisticated vocabulary, complex structures, cultural references. ~290-330 words.",
  L: "B2 level: near-authentic journalism/blog style, rich idiomatic vocabulary. ~330-380 words.",
};
const READING_TOPIC_CONTEXTS = {
  "animals and nature": "animals, wildlife, pets, nature, animal rescue or rehabilitation centre",
  "travel and places": "tourism, a city or neighbourhood, hotels, transport, travel experiences",
  "culture and history": "historical figure or monument, cultural heritage, art, music, traditions",
  "social media and technology": "social media influencer, blogger, TikTok creator, digital life",
  "health and sports": "exercise, diet, mental health, a sport, outdoor activity",
  "environment": "recycling, climate change, sustainability, circular economy app or initiative",
};

app.post("/api/reading-task", async (req, res) => {
  const { level = "C", topic = "animals and nature" } = req.body;
  const levelDesc = READING_LEVEL_DESCS[level] || READING_LEVEL_DESCS.C;
  const topicContext = READING_TOPIC_CONTEXTS[topic] || topic;

  const prompt = `Generate a reading comprehension exercise for Finnish students taking the Spanish yo-koe (lyhyt oppimäärä, 3 years of Spanish).

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

  try {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const reading = JSON.parse(clean);
    res.json({ reading });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate reading task" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
