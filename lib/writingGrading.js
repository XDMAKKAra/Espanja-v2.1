// YTL writing grading utilities — pure functions

// Short essay: max 35p (content 0-15, vocabulary 0-10, grammar 0-10)
// Long essay: max 99p (content 0-33, vocabulary 0-33, grammar 0-33)

export const SHORT_MAX = 35;
export const LONG_MAX = 99;

export const SHORT_CRITERIA = { content: 15, vocabulary: 10, grammar: 10 };
export const LONG_CRITERIA = { content: 33, vocabulary: 33, grammar: 33 };

// Penalty: -X points per 10 chars below minimum (no over-length penalty)
export function calculatePenalty(charCount, charMin) {
  if (charCount >= charMin) return 0;
  const deficit = charMin - charCount;
  return Math.ceil(deficit / 10);
}

// Sum criteria scores
export function sumScores(criteria) {
  return (criteria.content?.score || 0) +
         (criteria.vocabulary?.score || 0) +
         (criteria.grammar?.score || 0);
}

// Apply penalty and clamp to 0
export function applyPenalty(rawScore, penalty) {
  return Math.max(0, rawScore - penalty);
}

// YTL grade from total points
// Based on proportional thresholds of max score
export function pointsToGrade(points, maxScore) {
  const pct = (points / maxScore) * 100;
  if (pct >= 90) return "L";
  if (pct >= 77) return "E";
  if (pct >= 63) return "M";
  if (pct >= 49) return "C";
  if (pct >= 35) return "B";
  if (pct >= 20) return "A";
  return "I";
}

// Build the OpenAI grading prompt
export function buildGradingPrompt(task, studentText, isShort) {
  const maxScore = isShort ? SHORT_MAX : LONG_MAX;
  const criteria = isShort ? SHORT_CRITERIA : LONG_CRITERIA;
  const charCount = studentText.replace(/\s/g, "").length;
  const penalty = calculatePenalty(charCount, task.charMin);

  return `You are grading a Finnish high school student's Spanish writing for the yo-koe exam (lyhyt oppimäärä).

TASK:
${task.situation}
Instructions: ${task.prompt}
Requirements: ${(task.requirements || []).join(", ")}
Task type: ${isShort ? "Lyhyt kirjoitelma (max " + maxScore + "p)" : "Pitkä kirjoitelma (max " + maxScore + "p)"}

STUDENT'S TEXT (${charCount} chars without spaces, min required: ${task.charMin}):
"""
${studentText}
"""

${penalty > 0 ? `⚠️ UNDER MINIMUM LENGTH: ${charCount} chars, minimum is ${task.charMin}. Penalty: -${penalty} points (1 per 10 chars under minimum). Apply this AFTER scoring.` : ""}

GRADE using these EXACT YTL criteria:

1. SISÄLTÖ JA YMMÄRRETTÄVYYS (content & comprehensibility, max ${criteria.content}p):
   - Does the message come through clearly and naturally?
   - Are ALL task requirements addressed?
   - Is the register appropriate (tú/usted, formal/informal)?
   - Depth of treatment — goes beyond surface listing

2. KIELELLINEN LAAJUUS (vocabulary range, max ${criteria.vocabulary}p):
   - Vocabulary range and appropriateness
   - Use of connectors (además, sin embargo, por otro lado, aunque, por eso)
   - Varied sentence structures (not just SVO)
   - Idiomatic expressions and collocations

3. KIELELLINEN OIKEELLISUUS (grammatical accuracy, max ${criteria.grammar}p):
   - Grammar accuracy (ser/estar, hay/estar, subjunctive, tenses)
   - Spelling and accents (año, ñ, ú, é)
   - Agreement (gender, number)
   - Verb conjugation accuracy

ERRORS TO FIND (be thorough — list ALL errors):
- ser/estar confusion
- hay + definite article (hay las → hay)
- ojalá + indicative (should be subjunctive)
- Wrong conditional vs imperfect
- Missing relative pronouns
- Gender/number agreement
- Spelling and accent errors
- Register inconsistency

ALSO identify 2-4 POSITIVE HIGHLIGHTS: exact excerpts from the student's text that are particularly well-written (good vocabulary choice, correct subjunctive, nice connector, varied structure). These will be displayed with green highlights and a comment.

CRITICAL for "excerpt" fields: use the EXACT text from the student's writing, character-by-character. Do not paraphrase. Keep excerpts short (3-8 words usually) so they can be found and highlighted inline in the text.

CORRECTED TEXT: provide the student's text with ONLY actual errors fixed (grammar, agreement, conjugation, accents, wrong word). Preserve content, style, sentence count, and any deliberate choices. Do NOT rewrite for elegance. If the original is already correct Spanish, return the original UNCHANGED and "errors": [] (no invented mistakes).
LENGTH CAP: "correctedText" MUST NOT exceed ${Math.floor(charCount * 1.5)} characters — roughly 1.5× the student's input (${charCount} chars).
ERROR CAP: "errors" MUST NOT contain more than 10 entries. Pick the most impactful errors if you find more.

Return ONLY this JSON (no markdown):
{
  "criteria": {
    "content": { "score": <0-${criteria.content}>, "max": ${criteria.content}, "feedback": "<2-3 sentences in Finnish>" },
    "vocabulary": { "score": <0-${criteria.vocabulary}>, "max": ${criteria.vocabulary}, "feedback": "<2-3 sentences in Finnish>" },
    "grammar": { "score": <0-${criteria.grammar}>, "max": ${criteria.grammar}, "feedback": "<2-3 sentences in Finnish>" }
  },
  "correctedText": "<student's text with ONLY real errors fixed, OR the original verbatim if no errors>",
  "errors": [
    { "excerpt": "<EXACT text from student, 3-8 words>", "corrected": "<corrected version>", "category": "<grammar|vocabulary|spelling|register>", "explanation": "<brief Finnish explanation>" }
  ],
  "annotations": [
    { "excerpt": "<EXACT text from student, 3-8 words>", "comment": "<brief Finnish comment: why this is good>", "type": "positive" }
  ],
  "positives": ["<strength 1 in Finnish>", "<strength 2>"],
  "overallFeedback": "<2-3 sentences in Finnish — what to focus on to improve>"
}`;
}

// Guardrails (Commit 6):
//  - errors[] capped at 10 entries
//  - correctedText truncated at 1.5× input length
// Both are enforced in the prompt AND server-side here — trust but verify.
export const MAX_ERRORS = 10;
export const CORRECTED_LENGTH_FACTOR = 1.5;

export function enforceGuardrails(aiResult, studentText) {
  const out = { ...aiResult };
  // errors[] cap
  if (Array.isArray(out.errors) && out.errors.length > MAX_ERRORS) {
    out.errors = out.errors.slice(0, MAX_ERRORS);
    out._truncatedErrors = true;
  }
  // correctedText length cap
  if (typeof out.correctedText === "string" && studentText) {
    const maxLen = Math.floor(studentText.length * CORRECTED_LENGTH_FACTOR);
    if (out.correctedText.length > maxLen) {
      out.correctedText = out.correctedText.slice(0, maxLen);
      out._truncatedCorrectedText = true;
    }
  }
  return out;
}

// Process the AI response into final result
export function processGradingResult(aiResult, charCount, charMin, isShort, studentText) {
  const maxScore = isShort ? SHORT_MAX : LONG_MAX;
  const penalty = calculatePenalty(charCount, charMin);
  const rawScore = sumScores(aiResult.criteria);
  const finalScore = applyPenalty(rawScore, penalty);
  const ytlGrade = pointsToGrade(finalScore, maxScore);
  const guarded = enforceGuardrails(aiResult, studentText || "");

  return {
    rawScore,
    penalty,
    finalScore,
    maxScore,
    ytlGrade,
    criteria: guarded.criteria,
    correctedText: guarded.correctedText || studentText || "",
    errors: guarded.errors || [],
    annotations: guarded.annotations || [],
    positives: guarded.positives || [],
    overallFeedback: guarded.overallFeedback || "",
    _meta: {
      truncatedErrors: !!guarded._truncatedErrors,
      truncatedCorrectedText: !!guarded._truncatedCorrectedText,
    },
  };
}
