import { Router } from "express";
import { callOpenAI, LANGUAGE_META, VALID_LANGUAGES } from "../lib/openai.js";
import { softProGate } from "../middleware/auth.js";
import { aiStrictLimiter } from "../middleware/rateLimit.js";

const router = Router();

const VALID_TASK_TYPES = new Set(["short", "long"]);

router.post("/writing-task", aiStrictLimiter, softProGate, async (req, res) => {
  const { taskType = "short", topic = "general", language = "spanish" } = req.body;

  if (!VALID_TASK_TYPES.has(taskType)) return res.status(400).json({ error: "Virheellinen tehtävätyyppi (short/long)" });
  if (!VALID_LANGUAGES.has(language)) return res.status(400).json({ error: "Virheellinen kieli" });

  const lang = LANGUAGE_META[language];

  const isShort = taskType === "short";
  const charRange = isShort ? "160–240" : "300–450";
  const points = isShort ? 33 : 66;

  const prompt = `Generate ONE realistic ${lang.name} yo-koe writing task for Finnish students (lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).

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
    const task = await callOpenAI(prompt, 1000);
    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate writing task" });
  }
});

router.post("/grade-writing", aiStrictLimiter, softProGate, async (req, res) => {
  const { task, studentText } = req.body;

  if (!task || !studentText || typeof studentText !== "string" || studentText.trim().length === 0) {
    return res.status(400).json({ error: "Tehtävä ja vastaus vaaditaan" });
  }
  if (!task.taskType || !task.charMin || !task.charMax || !task.points) {
    return res.status(400).json({ error: "Virheellinen tehtävädata" });
  }

  const isShort = task.taskType === "short";
  const maxScore = task.points;

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
    const result = await callOpenAI(prompt, 2000);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to grade writing" });
  }
});

export default router;
