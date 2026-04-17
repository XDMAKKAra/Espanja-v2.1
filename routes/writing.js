import { Router } from "express";
import { callOpenAI, LANGUAGE_META, VALID_LANGUAGES } from "../lib/openai.js";
import { buildGradingPrompt, processGradingResult, SHORT_MAX, LONG_MAX } from "../lib/writingGrading.js";
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
  const maxPoints = isShort ? SHORT_MAX : LONG_MAX;
  const charRange = isShort ? "160–240" : "300–450";

  const prompt = `Generate ONE realistic ${lang.name} yo-koe writing task for Finnish students (lyhyt oppimäärä, ${lang.yearsStudied} of ${lang.name}).

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
  const charCount = studentText.replace(/\s/g, "").length;

  const prompt = buildGradingPrompt(task, studentText, isShort);

  try {
    const aiResult = await callOpenAI(prompt, 2000);
    const result = processGradingResult(aiResult, charCount, task.charMin, isShort);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to grade writing" });
  }
});

export default router;
