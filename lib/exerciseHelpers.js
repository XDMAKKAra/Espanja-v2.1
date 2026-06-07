// L-V399 Vaihe C2 — pure exercise helpers extracted from routes/exercises.js
// to start shrinking the largest backend god-file. Behavior-preserving: these
// are pure deterministic transforms (no req/res, no DB, no OpenAI, no module
// state), moved verbatim. Only the public callers are exported; routes import
// them back. SR/adaptive endpoints stay in exercises.js — they are mounted at
// /api (not /api/sr), so moving them would change the public URL.
import { getLessonLabel } from "./lessonLabels.js";

// L-PLAN-7 — tag exercises with is_review / review_source /
// review_source_label based on topic_key. The AI sets topic_key per the
// curriculumFocusInstruction prompt; we map it to the resolved review
// topic, falling back to the main focus on miss. Idempotent: safe to
// call when ctx.reviewTopics is empty (returns the array unchanged).
export function annotateReviewTags(exercises, ctx) {
  if (!Array.isArray(exercises)) return exercises;
  const reviews = (ctx?.reviewTopics || []);
  if (reviews.length === 0) {
    // No review topics — clear any AI-emitted is_review noise so the UI
    // never renders a stray badge on a non-curriculum-or-non-review run.
    return exercises.map((ex) => {
      if (!ex || typeof ex !== "object") return ex;
      const { is_review: _ir, review_source: _rs, review_source_label: _rl, topic_key, ...rest } = ex;
      return topic_key ? { ...rest, topic_key } : rest;
    });
  }
  const mainFocus = ctx?.lesson?.focus || "";
  return exercises.map((ex) => {
    if (!ex || typeof ex !== "object") return ex;
    const tk = String(ex.topic_key || "").trim();
    const match = reviews.find((r) => r.focus && tk && r.focus === tk);
    if (match) {
      return {
        ...ex,
        topic_key: match.focus,
        is_review: true,
        review_source: match.source,
        review_source_label: match.label || getLessonLabel(match.source),
      };
    }
    // No match → main focus item.
    return {
      ...ex,
      topic_key: tk || mainFocus,
      is_review: false,
    };
  });
}

export function validateVocabBatch(exercises) {
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
