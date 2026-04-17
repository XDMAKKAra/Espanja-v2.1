import { Router } from "express";
import supabase from "../supabase.js";
import { callOpenAI, LANGUAGE_META, READING_LEVEL_DESCS, READING_TOPIC_CONTEXTS } from "../lib/openai.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";

const router = Router();

const MAX_POINTS = 199; // 60 reading + 40 structure + 33 short + 66 long

const GRADE_THRESHOLDS = [
  { min: Math.round(MAX_POINTS * 0.80), grade: "L" },  // 80%+
  { min: Math.round(MAX_POINTS * 0.65), grade: "E" },  // 65-79%
  { min: Math.round(MAX_POINTS * 0.50), grade: "M" },  // 50-64%
  { min: Math.round(MAX_POINTS * 0.35), grade: "C" },  // 35-49%
  { min: Math.round(MAX_POINTS * 0.20), grade: "B" },  // 20-34%
  { min: Math.round(MAX_POINTS * 0.10), grade: "A" },  // 10-19%
  { min: 0, grade: "I" },
];

function pointsToGrade(points) {
  for (const t of GRADE_THRESHOLDS) {
    if (points >= t.min) return t.grade;
  }
  return "I";
}

const lang = LANGUAGE_META.spanish;

// ─── Generate Part 1: Reading Comprehension (60p) ──────────────────────────

async function generateReading() {
  const levels = [
    { level: "C", desc: READING_LEVEL_DESCS["C"], topic: "travel and places" },
    { level: "M", desc: READING_LEVEL_DESCS["M"], topic: "culture and history" },
    { level: "E", desc: READING_LEVEL_DESCS["E"], topic: "environment" },
  ];

  const texts = [];
  for (const l of levels) {
    const prompt = `Generate a reading comprehension exercise for Finnish students taking the ${lang.name} yo-koe (lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).

Text level: ${l.level} — ${l.desc}
Topic: ${READING_TOPIC_CONTEXTS[l.topic]}

Make the text feel like a REAL source: a blog post, news snippet, interview excerpt, or webpage.

Generate EXACTLY 5 questions after the text:
1-3. Multiple choice (monivalinta) — 4 options, 1 correct
4. True/false (oikein/väärin) — a statement to evaluate
5. Short factual answer in Finnish (1-5 word answer)

Return ONLY this JSON (no markdown):
{
  "title": "Title in Spanish",
  "text": "Full text in Spanish...",
  "source": "Fictitious source",
  "level": "${l.level}",
  "questions": [
    { "id": 1, "type": "multiple_choice", "question": "Kysymys suomeksi?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": "A", "explanation": "Selitys suomeksi" },
    { "id": 2, "type": "multiple_choice", "question": "?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": "B", "explanation": "Selitys" },
    { "id": 3, "type": "multiple_choice", "question": "?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": "C", "explanation": "Selitys" },
    { "id": 4, "type": "true_false", "statement": "Väite suomeksi", "correct": true, "explanation": "Selitys" },
    { "id": 5, "type": "short_answer", "question": "Faktakysymys?", "acceptedAnswers": ["vastaus", "alt"], "explanation": "Selitys" }
  ]
}`;

    const reading = await callOpenAI(prompt, 3000);
    texts.push(reading);
  }

  return { type: "reading", texts, maxPoints: 60 };
}

// ─── Generate Part 2: Structure & Vocabulary (40p) ─────────────────────────

async function generateStructure() {
  const prompt = `You are generating Spanish grammar and vocabulary exercises for Finnish high school students (yo-koe, lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).

Generate EXACTLY 20 gap-fill / grammar / vocabulary questions. Mix these types:
- "gap": Sentence with ___ blank — choose the correct Spanish form
- "correction": Sentence WITH an error — choose the corrected version
- "vocab_gap": Sentence with ___ blank — choose the correct vocabulary word

Mix grammar topics: ser/estar, hay/estar, subjunctive, conditional, preterite/imperfect, pronouns, articles.
Mix difficulty: 8 questions at B1 level, 7 at B1+, 5 at B2.

Each question has 4 options (A-D), one correct.

Return ONLY a JSON array of 20 objects (no markdown):
[
  {
    "id": 1,
    "type": "gap",
    "instruction": "Täydennä aukko oikealla muodolla.",
    "sentence": "Cuando era pequeño, siempre ___ al parque con mis amigos.",
    "options": ["A) iba", "B) fui", "C) voy", "D) iré"],
    "correct": "A",
    "explanation": "iba = imperfekti. Siempre + toistuva menneisyys → imperfekti."
  }
]`;

  const exercises = await callOpenAI(prompt, 4000);
  return { type: "structure", exercises, maxPoints: 40 };
}

// ─── Generate Part 3: Short Writing (33p) ──────────────────────────────────

async function generateShortWriting() {
  const prompt = `Generate ONE realistic ${lang.name} yo-koe writing task for Finnish students (lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).

Task type: SHORT task (lyhyt kirjoitustehtävä)
Character limit: 160–240 characters (spaces NOT counted)
Max points: 33

SHORT TASK RULES:
- A SHORT practical message: email, message to a neighbor, short note, social media message
- Must have a clear SITUATION and RECIPIENT
- Give 2-3 specific things to mention

Return ONLY JSON:
{
  "taskType": "short", "points": 33, "charMin": 160, "charMax": 240,
  "situation": "Finnish context sentence",
  "prompt": "Task instruction in Spanish",
  "requirements": ["req 1 in Finnish", "req 2", "req 3"],
  "textType": "e.g. sähköpostiviesti"
}`;

  const task = await callOpenAI(prompt, 1000);
  return { type: "shortWriting", task, maxPoints: 33 };
}

// ─── Generate Part 4: Long Writing (66p) ───────────────────────────────────

async function generateLongWriting() {
  const prompt = `Generate ONE realistic ${lang.name} yo-koe writing task for Finnish students (lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).

Task type: LONG task (laajempi kirjoitustehtävä)
Character limit: 300–450 characters (spaces NOT counted)
Max points: 66

LONG TASK RULES:
- A LONGER text: forum comment, TripAdvisor review, opinion piece, letter
- Must require taking a STANCE or sharing multiple perspectives
- Give 2-3 angles to explore

Return ONLY JSON:
{
  "taskType": "long", "points": 66, "charMin": 300, "charMax": 450,
  "situation": "Finnish context sentence",
  "prompt": "Task instruction in Spanish",
  "requirements": ["req 1 in Finnish", "req 2", "req 3"],
  "textType": "e.g. foorumikommentti"
}`;

  const task = await callOpenAI(prompt, 1000);
  return { type: "longWriting", task, maxPoints: 66 };
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

async function gradeWriting(task, studentText, isShort) {
  const maxScore = isShort ? 33 : 66;
  const charCount = studentText.replace(/\s/g, "").length;
  const overLimit = charCount > task.charMax;
  const penalty = overLimit ? (isShort ? 3 : 6) : 0;

  const shortSteps = [0, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33];
  const longSteps = [0, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66];
  const validSteps = isShort ? shortSteps : longSteps;

  if (!studentText || studentText.trim().length < 5) {
    return { finalScore: 0, maxScore, ytlGrade: "I", overallFeedback: "Vastausta ei annettu tai se oli liian lyhyt." };
  }

  const prompt = `You are grading a Finnish high school student's Spanish writing for the yo-koe exam (lyhyt oppimäärä).

TASK:
${task.situation}
Instructions: ${task.prompt}
Requirements: ${(task.requirements || []).join(", ")}
Task type: ${isShort ? "Short task (max 33 points)" : "Long task (max 66 points)"}

STUDENT'S TEXT (${charCount} chars without spaces):
"""
${studentText}
"""

${overLimit ? `OVER CHARACTER LIMIT: ${charCount} chars, limit ${task.charMax}. Deduct ${penalty} points.` : ""}

VALID SCORE STEPS: ${validSteps.join(" — ")}

Grade using YTL criteria: viestinnällisyys, tehtävänanto, kielelliset resurssit.

Return ONLY JSON:
{
  "rawScore": <valid step>,
  "penalty": ${penalty},
  "finalScore": <rawScore - penalty, nearest valid step>,
  "maxScore": ${maxScore},
  "ytlGrade": "<I/A/B/C/M/E/L>",
  "overallFeedback": "<2-3 sentences in Finnish>"
}`;

  try {
    return await callOpenAI(prompt, 1000);
  } catch {
    const ratio = Math.min(charCount / task.charMax, 1);
    const est = Math.round(ratio * maxScore * 0.5);
    const closest = validSteps.reduce((prev, curr) => Math.abs(curr - est) < Math.abs(prev - est) ? curr : prev);
    return { finalScore: closest, maxScore, ytlGrade: "C", overallFeedback: "Arviointi epäonnistui, tulos on arvio." };
  }
}

// ─── POST /api/exam/start ──────────────────────────────────────────────────

router.post("/start", requireAuth, aiLimiter, async (req, res) => {
  const { durationMode = "demo" } = req.body;
  const userId = req.user.userId;

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

    // Generate 4 parts (no listening/kuullun ymmärtäminen)
    const parts = [];
    parts.push(await generateReading());
    parts.push(await generateStructure());
    parts.push(await generateShortWriting());
    parts.push(await generateLongWriting());

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
    const shortResult = await gradeWriting(partsData[2].task, shortText, true);

    const longText = finalAnswers["4_writing"] || "";
    const longResult = await gradeWriting(partsData[3].task, longText, false);

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

    res.json({ totalPoints, maxPoints: MAX_POINTS, finalGrade, partScores });
  } catch (err) {
    console.error("Exam submit error:", err.message);
    res.status(500).json({ error: err.message || "Arviointi epäonnistui" });
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
