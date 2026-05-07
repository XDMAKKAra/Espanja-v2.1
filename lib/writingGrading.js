// YTL writing grading utilities — pure functions
// 4-dimension rubric: viestinnallisyys, kielen_rakenteet, sanasto, kokonaisuus
// Each 0–5, total 0–20. Band thresholds are YTL lyhyt oppimäärä absolute values
// (80/65/50/35/20/10 on 100-scale) linearly mapped to 20 (divide by 5, floor).

import { LANG_LABEL } from "./openai.js";

export const RUBRIC_MAX = 20;

// Both short and long tasks now use the 0–20 rubric scale.
// These exports keep routes/writing.js import-compatible.
export const SHORT_MAX = 20;
export const LONG_MAX  = 20;

// Under-length penalty: 1pt per 40 chars below minimum.
// Rescaled from the old 1pt/10chars on a 99-scale so the penalty keeps the
// same real weight on the new 20-scale.
export function calculatePenalty(charCount, charMin) {
  if (charCount >= charMin) return 0;
  const deficit = charMin - charCount;
  return Math.ceil(deficit / 40);
}

// Sum the four rubric dimension scores.
export function sumScores(dims) {
  return (dims.viestinnallisyys?.score || 0) +
         (dims.kielen_rakenteet?.score  || 0) +
         (dims.sanasto?.score           || 0) +
         (dims.kokonaisuus?.score       || 0);
}

export function applyPenalty(rawScore, penalty) {
  return Math.max(0, rawScore - penalty);
}

// Absolute threshold table — YTL lyhyt oppimäärä 100-scale (80/65/50/35/20/10)
// mapped to 0–20 (divide by 5, floor). M anchor: 10/20 = "score 3 on every dim".
export function pointsToGrade(total) {
  if (total >= 16) return "L";
  if (total >= 13) return "E";
  if (total >= 10) return "M";
  if (total >=  7) return "C";
  if (total >=  4) return "B";
  if (total >=  2) return "A";
  return "I";
}

// Build the OpenAI grading prompt — YTL-aligned 4-dimension rubric (RUBRIC.md §4).
// lang: ISO-639-1 code ('es' | 'de' | 'fr'). Defaults to 'es' for back-compat.
export function buildGradingPrompt(task, studentText, isShort, lang = "es") {
  const charCount = studentText.replace(/\s/g, "").length;
  const label = LANG_LABEL[lang] || LANG_LABEL.es;
  const langEn = label.en; // e.g. "Spanish" | "German" | "French"

  return `You are a YTL (Finnish matriculation board) examiner grading a ${langEn} writing sample from a Finnish high school student taking the ${langEn} lyhyt oppimäärä (short syllabus) yo-koe. Target level is B1. Apply YTL lyhyt oppimäärä standards, NOT CEFR-generic or university standards.

TASK CONTEXT:
Situation: ${task.situation}
Instruction (in ${langEn}): ${task.prompt}
Requirements: ${(task.requirements || []).join(" | ")}
Task type: ${isShort ? "SHORT task (lyhyt kirjoitelma, 160–240 chars)" : "LONG task (pitkä kirjoitelma, 300–450 chars)"}
Min chars (no spaces): ${task.charMin}
Actual chars (no spaces): ${charCount}

STUDENT'S TEXT:
"""
${studentText}
"""

GRADING PHILOSOPHY — READ CAREFULLY:
- This is lyhyt oppimäärä, not pitkä. A B1 student with noticeable errors that do NOT block meaning can legitimately score M (50 / 100 in YTL terms, 10–12 / 20 here).
- Do NOT grade against a native-speaker ceiling. Do NOT grade against a pitkä-oppimäärä ceiling.
- Score the text that was written, not the text you wish had been written. Absence of advanced structures is not a fault at this level.
- Errors are expected. Penalise errors only to the extent that they (a) block meaning, (b) cluster so densely that the reader loses the thread, or (c) are on structures a B1 short-syllabus student is clearly expected to control (present tense, basic agreement, everyday word choice).

SCORE EACH OF FOUR YTL DIMENSIONS ON A 0–5 INTEGER SCALE:

1) VIESTINNÄLLISYYS (communicative effectiveness): task completion, clarity, register (tú/usted, formality), text-type conventions.
   - 3 = M anchor: most requirements met, message clear with occasional ambiguity, register mostly right.
   - 4 = all requirements met, clear first-read, register consistent, format respected.
   - 5 = nuanced communication, text-type conventions fully observed, effortless to read.
   - 2 = partial completion, reader re-reads, register inconsistent.
   - 1 = one requirement partly met, register wrong, reader must guess.
   - 0 = task ignored or text unintelligible.

${lang === "es" ? `2) KIELEN RAKENTEET (grammatical structures): accuracy AND range of B1 structures — present, pretérito indefinido/perfecto, imperfecto, ser/estar, gustar-type, basic subjunctive in fixed expressions, agreement, pronouns.
   - 3 = M anchor: present + one past tense mostly correct, agreement errors present but not dominant, ser/estar right in common cases, some subordination.
   - 4 = multiple tenses mostly correct, subjunctive attempted in fixed expressions, varied structures.
   - 5 = range of B1 structures accurate, few errors, none block meaning.
   - 2 = present mostly OK, past tense errors frequent, agreement shaky, mostly SVO.
   - 1 = only present tense partially works, pervasive agreement errors, ser/estar random.
   - 0 = grammar so broken most sentences fail.` : `2) KIELEN RAKENTEET (grammatical structures): accuracy AND range of B1 structures appropriate for ${langEn} — present and past tenses, basic modal/conditional structures, agreement, pronoun use.
   - 3 = M anchor: present + one past tense mostly correct, agreement errors present but not dominant, some subordination.
   - 4 = multiple tenses mostly correct, varied structures.
   - 5 = range of B1 structures accurate, few errors, none block meaning.
   - 2 = present mostly OK, past tense errors frequent, agreement shaky, mostly SVO.
   - 1 = only present tense partially works, pervasive agreement errors.
   - 0 = grammar so broken most sentences fail.`}

${lang === "es" ? `3) SANASTO (vocabulary): range and precision of word choice appropriate to the topic and level.
   - 3 = M anchor: everyday vocabulary correct, 1–2 topic-specific words attempted, some wrong-word errors (saber/conocer, pedir/preguntar) but meaning recoverable.
   - 4 = topic-specific vocabulary mostly correct, some idiomatic collocations, little repetition.
   - 5 = precise word choice, idiomatic collocations used naturally, topic-specific vocabulary handled with confidence.
   - 2 = everyday vocabulary mostly correct, noticeable repetition, anglicisms/fennicisms when topic words are needed.
   - 1 = only basic words repeated, wrong-word errors cause meaning failure.
   - 0 = vocabulary absent or non-Spanish.` : `3) SANASTO (vocabulary): range and precision of word choice appropriate to the topic and level.
   - 3 = M anchor: everyday vocabulary correct, 1–2 topic-specific words attempted, some wrong-word errors but meaning recoverable.
   - 4 = topic-specific vocabulary mostly correct, some idiomatic collocations, little repetition.
   - 5 = precise word choice, idiomatic collocations used naturally, topic-specific vocabulary handled with confidence.
   - 2 = everyday vocabulary mostly correct, noticeable repetition, anglicisms/fennicisms when topic words are needed.
   - 1 = only basic words repeated, wrong-word errors cause meaning failure.
   - 0 = vocabulary absent or not in ${langEn}.`}

${lang === "es" ? `4) KOKONAISUUS (overall / cohesion): connectors, flow, text-type formatting (greeting+closing for email/letter, stance for forum post), paragraph structure for long tasks.
   - 3 = M anchor: 2–4 connectors used, opening + closing both present where required, text reads as a text with minor flow issues.
   - 4 = range of connectors (además, sin embargo, por eso, aunque), clear progression, format well observed.
   - 5 = varied connectors used correctly, reference chains, formatting fully conforms to text type.
   - 2 = some connectors (y, pero, porque), either greeting OR closing missing, flow interrupted.
   - 1 = disconnected sentences, no connectors, no greeting/closing where required.
   - 0 = not a connected text (fragments, bullet list, copied prompt).` : `4) KOKONAISUUS (overall / cohesion): connectors, flow, text-type formatting (greeting+closing for email/letter, stance for forum post), paragraph structure for long tasks.
   - 3 = M anchor: 2–4 connectors used, opening + closing both present where required, text reads as a text with minor flow issues.
   - 4 = range of connectors appropriate for ${langEn}, clear progression, format well observed.
   - 5 = varied connectors used correctly, reference chains, formatting fully conforms to text type.
   - 2 = some basic connectors, either greeting OR closing missing, flow interrupted.
   - 1 = disconnected sentences, no connectors, no greeting/closing where required.
   - 0 = not a connected text (fragments, bullet list, copied prompt).`}

Total = V + R + S + K (0–20).
Band mapping (apply strictly): 16+ L, 13–15 E, 10–12 M, 7–9 C, 4–6 B, 2–3 A, 0–1 I.

ALSO RETURN:
- \`corrected_text\`: the student's text with ONLY real errors fixed (grammar, agreement, conjugation, accents, wrong word). Preserve content, style, sentence count, AND the student's voice — do NOT rewrite "good enough" sentences into more advanced ones. If the original is already correct ${langEn}, return it unchanged. Max length: ${Math.floor(charCount * 1.5)} characters.
- \`errors\`: up to 10 most impactful errors. Each: {excerpt (the SHORTEST exact span from the student's text that contains the error — typically 1–6 words, never include words that are not part of the mistake), corrected, category (grammar|vocabulary|spelling|register), explanation_fi (Finnish — must explain WHY the original is wrong, not just what to change. Reference the rule.)}.
- \`annotations\`: 2–4 positive highlights. Each: {excerpt (exact from student), comment_fi (briefly say WHAT works — connector use, idiomatic phrasing, register match), type:"positive"}.
- \`next_action_fi\`: ONE concrete next step (Finnish, ≤ 18 words). Anchor to the lowest-scoring dimension. Be specific — NOT generic: "Kirjoita lisää."

EDGE CASES — handle these BEFORE scoring:
- If \`studentText\` is empty, < 30 characters, or only whitespace: return all dimension scores 0, total 0, band "I", overall_feedback_fi explaining "Vastaus oli liian lyhyt arvioitavaksi.", next_action_fi pointing at minimum length.
- If the text is clearly not ${langEn} (mostly English / Finnish / other language): return all dimension scores 0, total 0, band "I", overall_feedback_fi explaining "Vastaus ei ole ${label.fi}ksi — kirjoita ${label.fi}ksi.", errors=[], annotations=[], corrected_text=studentText.
- If the text is clearly off-topic (does not address ANY of the requirements at all — e.g. requirements ask about ympäristönsuojelu and the student writes about their dog): score viestinnallisyys=0, score the other dimensions normally for any ${langEn} that IS present, overall_feedback_fi explains the off-topic problem in Finnish.

OUTPUT: return ONLY this JSON, no markdown, no prose outside the JSON:

{
  "viestinnallisyys": { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "kielen_rakenteet": { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "sanasto":          { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "kokonaisuus":      { "score": <0-5 integer>, "feedback_fi": "<1–2 sentences in Finnish>" },
  "total": <0-20 integer>,
  "band": "<one of: L, E, M, C, B, A, I>",
  "overall_feedback_fi": "<2–3 Finnish sentences: what to focus on to improve, anchored to the weakest dimension>",
  "corrected_text": "<student's text with only real errors fixed>",
  "errors": [
    { "excerpt": "<exact 3–8 words>", "corrected": "<fix>", "category": "grammar|vocabulary|spelling|register", "explanation_fi": "<brief Finnish>" }
  ],
  "annotations": [
    { "excerpt": "<exact from student>", "comment_fi": "<why this is good>", "type": "positive" }
  ],
  "next_action_fi": "<one concrete Finnish next step, ≤ 18 words, anchored to the weakest dimension>"
}

Self-check before emitting:
- total MUST equal the sum of the four dimension scores.
- band MUST follow the table above given total.
- Every \`excerpt\` MUST be a character-exact substring of the student's text.
- If the text is already correct ${langEn}, \`errors\` MUST be [] — do NOT invent errors.
- next_action_fi must address the dimension with the LOWEST score. Tie → kielen_rakenteet.`;
}

export const MAX_ERRORS = 10;
export const CORRECTED_LENGTH_FACTOR = 1.5;

export function enforceGuardrails(aiResult, studentText) {
  const out = { ...aiResult };
  if (Array.isArray(out.errors) && out.errors.length > MAX_ERRORS) {
    out.errors = out.errors.slice(0, MAX_ERRORS);
    out._truncatedErrors = true;
  }
  if (typeof out.corrected_text === "string" && studentText) {
    const maxLen = Math.floor(studentText.length * CORRECTED_LENGTH_FACTOR);
    if (out.corrected_text.length > maxLen) {
      out.corrected_text = out.corrected_text.slice(0, maxLen);
      out._truncatedCorrectedText = true;
    }
  }
  return out;
}

// Process the AI response into the final grading result.
// total and band are recomputed server-side — the model's values are ignored.
export function processGradingResult(aiResult, charCount, charMin, _isShort, studentText) {
  const penalty   = calculatePenalty(charCount, charMin);
  const rawScore  = sumScores(aiResult);
  const finalScore = applyPenalty(rawScore, penalty);
  const ytlGrade  = pointsToGrade(finalScore);
  const guarded   = enforceGuardrails(aiResult, studentText || "");

  return {
    rawScore,
    penalty,
    finalScore,
    maxScore: RUBRIC_MAX,
    ytlGrade,
    viestinnallisyys:    guarded.viestinnallisyys    || { score: 0, feedback_fi: "" },
    kielen_rakenteet:    guarded.kielen_rakenteet     || { score: 0, feedback_fi: "" },
    sanasto:             guarded.sanasto              || { score: 0, feedback_fi: "" },
    kokonaisuus:         guarded.kokonaisuus          || { score: 0, feedback_fi: "" },
    corrected_text:      guarded.corrected_text       || studentText || "",
    errors:              guarded.errors               || [],
    annotations:         guarded.annotations          || [],
    overall_feedback_fi: guarded.overall_feedback_fi  || "",
    next_action_fi:      guarded.next_action_fi       || "",
    _meta: {
      truncatedErrors:        !!guarded._truncatedErrors,
      truncatedCorrectedText: !!guarded._truncatedCorrectedText,
    },
  };
}
