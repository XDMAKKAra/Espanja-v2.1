// L-V410 Vaihe 1 (CAPTURE) — adaptive data flywheel.
//
// Takes the graded answers from a main-runner lesson and writes them into the
// two existing adaptive primitives:
//   - user_mistakes : one row per wrong answer (drives weak-topics / resurface)
//   - sr_cards      : one SM-2 card per distinct item (drives the review queue)
//
// No new table — the brief mandates deriving from sr_cards + user_mistakes.
// This mirrors routes/sr.js + routes/progress.js POST /mistake exactly so the
// review queue (Vaihe 2) reads cards written here identically to the legacy
// vocab.js path. Gating to the kurssi (mestari) tier happens at the call site.

import { sm2 } from "./scheduler.js";
import { normalizeTopics, inferTopics } from "./mistakeTaxonomy.js";

// Correct answer = successful retrieval (testing effect → expand interval).
// Wrong answer = failed retrieval (<3 resets repetitions in SM-2).
const QUALITY_CORRECT = 4;
const QUALITY_WRONG = 1;

/**
 * Derive up to 3 canonical topic keys for one graded item.
 * Order: explicit topics → keyword inference (grammar lessons) → coarse fallback
 * so weak-topics always has something to bin on.
 */
function deriveTopics(item) {
  const explicit = normalizeTopics(item.topics);
  if (explicit.length) return explicit;
  const inferred = inferTopics({ question: item.question, explanation: item.explanation });
  if (inferred.length) return inferred;
  return [item.exerciseType || item.itemType || "general"];
}

function srKey(item) {
  return String(item.question || "").trim().slice(0, 300);
}

/**
 * Clamp/normalise the gradedItems payload from the client.
 */
export function sanitiseGradedItems(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((g) => g && typeof g === "object")
    .slice(0, 80)
    .map((g) => ({
      itemType: String(g.itemType || "").slice(0, 40) || "unknown",
      correct: !!g.correct,
      question: String(g.question || "").slice(0, 300),
      studentAnswer: String(g.studentAnswer || "").slice(0, 200),
      correctAnswer: String(g.correctAnswer || "").slice(0, 200),
      explanation: String(g.explanation || "").slice(0, 300),
      phaseType: String(g.phaseType || "").slice(0, 60),
      topics: Array.isArray(g.topics) ? g.topics.slice(0, 3) : [],
    }))
    .filter((g) => g.question);
}

/**
 * Write the adaptive signals for a completed lesson.
 *
 * @param {object} db        RLS-scoped supabase client (req.supabase)
 * @param {string} userId
 * @param {string} language  full form ("spanish"|"german"|"french")
 * @param {Array}  gradedItems  sanitised graded answers
 * @param {Date}   [now]      injectable clock for tests
 * @returns {Promise<{srUpserted:number, mistakesInserted:number}>}
 */
export async function captureAdaptiveSignals(db, userId, language, gradedItems, now = new Date()) {
  const nowIso = now.toISOString();

  // ── SR cards ────────────────────────────────────────────────────────────
  // Fold every attempt of the same word through SM-2 in order so a word that
  // appears in two phases (recognition + recall) counts as two reviews and we
  // still emit a single upsert row (duplicate onConflict keys in one batch
  // would error). Group preserves first-seen order; per-word attempts stay in
  // array order.
  const byWord = new Map();
  for (const it of gradedItems) {
    const word = srKey(it);
    if (!word) continue;
    if (!byWord.has(word)) byWord.set(word, []);
    byWord.get(word).push(it);
  }
  const words = [...byWord.keys()];

  const existingByWord = new Map();
  if (words.length) {
    const { data: existing, error } = await db
      .from("sr_cards")
      .select("*")
      .eq("user_id", userId)
      .eq("language", language)
      .in("word", words);
    if (error) throw new Error("sr_cards read: " + error.message);
    for (const c of existing || []) existingByWord.set(c.word, c);
  }

  const srPayloads = [];
  for (const [word, attempts] of byWord) {
    let card = existingByWord.get(word) || {
      ease_factor: 2.5, interval_days: 0, repetitions: 0,
      reviews_total: 0, reviews_correct: 0,
    };
    let reviewsTotal = card.reviews_total || 0;
    let reviewsCorrect = card.reviews_correct || 0;
    const firstReviewedAt = card.first_reviewed_at || nowIso;
    let masteredAt = card.mastered_at || null;
    let lapsedAt = card.lapsed_at || null;
    let topic = card.topic || null;
    let updated = null;

    for (const at of attempts) {
      const quality = at.correct ? QUALITY_CORRECT : QUALITY_WRONG;
      updated = sm2(card, quality, now);
      reviewsTotal += 1;
      if (quality >= 3) reviewsCorrect += 1;
      if (updated.state === "mastered" && !masteredAt) masteredAt = nowIso;
      if (updated.state === "lapsed") lapsedAt = nowIso;
      const t = deriveTopics(at)[0];
      if (t && t !== "general") topic = t;
      card = { ...card, ...updated };
    }

    const payload = {
      user_id: userId,
      word,
      question: word,
      language,
      ...updated,
      last_band: null,
      reviews_total: reviewsTotal,
      reviews_correct: reviewsCorrect,
      first_reviewed_at: firstReviewedAt,
      updated_at: nowIso,
    };
    if (topic) payload.topic = topic;
    if (masteredAt) payload.mastered_at = masteredAt;
    if (lapsedAt) payload.lapsed_at = lapsedAt;
    srPayloads.push(payload);
  }

  // ── user_mistakes: one row per wrong attempt ─────────────────────────────
  const mistakeRows = [];
  for (const it of gradedItems) {
    if (it.correct) continue;
    const word = srKey(it);
    if (!word) continue;
    mistakeRows.push({
      user_id: userId,
      topics: deriveTopics(it),
      language,
      exercise_type: it.itemType || null,
      level: null,
      question: word.slice(0, 500),
      wrong_answer: it.studentAnswer ? String(it.studentAnswer).slice(0, 200) : null,
      correct_answer: it.correctAnswer ? String(it.correctAnswer).slice(0, 200) : null,
      explanation: it.explanation ? String(it.explanation).slice(0, 500) : null,
    });
  }

  const result = { srUpserted: 0, mistakesInserted: 0 };
  if (srPayloads.length) {
    const { error } = await db
      .from("sr_cards")
      .upsert(srPayloads, { onConflict: "user_id,word,language" });
    if (error) throw new Error("sr_cards upsert: " + error.message);
    result.srUpserted = srPayloads.length;
  }
  if (mistakeRows.length) {
    const { error } = await db.from("user_mistakes").insert(mistakeRows);
    if (error) throw new Error("user_mistakes insert: " + error.message);
    result.mistakesInserted = mistakeRows.length;
  }
  return result;
}
