// L-V411 Vaihe C — review queue selector (the loop-closer).
//
// Pure-ish, deterministic given the DB rows. Reads the two adaptive primitives
// (user_mistakes -> weak concepts, sr_cards -> due cards + per-concept strength)
// and picks renderable items from the build-time item bank (Vaihe A). ZERO AI.
//
// "Näytä enemmän subjunktiiveja": a concept the student keeps getting wrong, or
// whose SR cards are due, resurfaces with bank items calibrated to their grip on
// it (weaker -> easier + more repetition; stronger -> harder + fewer). Items come
// back in the same shape as a lesson-phase item, so lessonRunner renders them
// with no new item type.
//
// Language: the DB stores the full form (spanish/german/french); the bank uses
// the short code (es/de/fr). We map between them here.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readLessonFile } from "./curriculum.js";
import { normalizeLang } from "./openai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_DIR = path.resolve(__dirname, "..", "data", "item-bank");

const FULL_TO_SHORT = { spanish: "es", german: "de", french: "fr" };
const DAY_MS = 24 * 60 * 60 * 1000;

// ── caches (process-lifetime; bank + lessons are static assets) ─────────────
const _bankCache = new Map();
function loadBank(shortLang) {
  if (_bankCache.has(shortLang)) return _bankCache.get(shortLang);
  let bank = null;
  try {
    bank = JSON.parse(fs.readFileSync(path.join(BANK_DIR, `${shortLang}.json`), "utf8"));
  } catch (err) {
    console.warn(`[reviewQueue] bank load ${shortLang} failed:`, err.message);
  }
  _bankCache.set(shortLang, bank);
  return bank;
}

const _lessonCache = new Map();
async function resolveItem(ref, shortLang) {
  const courseKey = String(ref.kurssiKey || "").replace(/^[a-z]{2}_/, "");
  if (!courseKey || ref.lessonIndex == null) return null;
  const cacheKey = `${shortLang}|${courseKey}|${ref.lessonIndex}`;
  let lesson = _lessonCache.get(cacheKey);
  if (lesson === undefined) {
    lesson = await readLessonFile(courseKey, ref.lessonIndex, shortLang);
    _lessonCache.set(cacheKey, lesson);
  }
  if (!lesson || lesson.available === false) return null;
  const phase = (lesson.phases || []).find((p) => p.phase_id === ref.phaseId);
  if (!phase) return null;
  return (phase.items || [])[ref.itemIndex] || null;
}

// ── difficulty calibration from a concept's SR strength ─────────────────────
// strength = reviews_correct / reviews_total across the concept's cards.
// Weaker grip -> more items, biased easy; stronger -> fewer, biased hard.
function planForStrength(strength) {
  if (strength == null) return { count: 3, prefer: ["easy", "medium", "hard"] }; // never reviewed
  if (strength < 0.5) return { count: 3, prefer: ["easy", "medium", "hard"] };
  if (strength < 0.75) return { count: 2, prefer: ["medium", "easy", "hard"] };
  return { count: 1, prefer: ["hard", "medium", "easy"] }; // strong: keep it sharp, don't over-drill
}

// Order a concept's bank entries by the preferred difficulty ladder, stable.
function orderByPreference(entries, prefer) {
  const rank = (d) => {
    const i = prefer.indexOf(d);
    return i === -1 ? prefer.length : i;
  };
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => rank(a.e.difficulty) - rank(b.e.difficulty) || a.i - b.i)
    .map((x) => x.e);
}

function dedupKey(item) {
  return String(item.stem || item.prompt || item.sentence_template || item.source || "")
    .trim().toLowerCase().slice(0, 120);
}

/**
 * Build a calibrated review queue for one learner + language.
 *
 * @param {object}  opts
 * @param {string}  opts.userId
 * @param {string}  opts.lang        es|de|fr|spanish|german|french
 * @param {object}  opts.db          RLS-scoped supabase client (req.supabase)
 * @param {number}  [opts.limit=12]  max items in the session (cognitive-load cap)
 * @param {number}  [opts.mistakeDays=14]
 * @param {Date}    [opts.now]
 * @returns {Promise<{items:Array, concepts:Array, dueCount:number}>}
 */
export async function buildReviewQueue({ userId, lang, db, limit = 12, mistakeDays = 14, now = new Date() }) {
  const fullLang = normalizeLang(lang);
  const shortLang = FULL_TO_SHORT[fullLang] || "es";
  const bank = loadBank(shortLang);
  const empty = { items: [], concepts: [], dueCount: 0 };
  if (!bank || !db) return empty;

  const todayStr = now.toISOString().slice(0, 10);
  const since = new Date(now.getTime() - mistakeDays * DAY_MS).toISOString();

  // ── weak concepts from recent mistakes ────────────────────────────────────
  const mistakeCount = new Map();
  try {
    const { data, error } = await db
      .from("user_mistakes")
      .select("topics, created_at, language")
      .eq("user_id", userId)
      .eq("language", fullLang)
      .gte("created_at", since);
    if (!error) {
      for (const m of data || []) {
        for (const t of m.topics || []) mistakeCount.set(t, (mistakeCount.get(t) || 0) + 1);
      }
    }
  } catch (err) {
    console.warn("[reviewQueue] mistakes read:", err.message);
  }

  // ── due SR cards (their topics are high-priority concepts) ────────────────
  let dueCount = 0;
  const dueTopics = new Map();
  try {
    const { data, error } = await db
      .from("sr_cards")
      .select("topic, next_review")
      .eq("user_id", userId)
      .eq("language", fullLang)
      .lte("next_review", todayStr);
    if (!error) {
      dueCount = (data || []).length;
      for (const c of data || []) {
        if (c.topic) dueTopics.set(c.topic, (dueTopics.get(c.topic) || 0) + 1);
      }
    }
  } catch (err) {
    console.warn("[reviewQueue] due read:", err.message);
  }

  // Merge: a due-card topic is a strong signal, so it gets a weight boost on top
  // of its mistake count.
  const priority = new Map();
  for (const [t, n] of mistakeCount) priority.set(t, (priority.get(t) || 0) + n);
  for (const [t, n] of dueTopics) priority.set(t, (priority.get(t) || 0) + n * 2);

  // Keep only concepts that actually exist in the bank.
  const rankedConcepts = [...priority.entries()]
    .filter(([t]) => Array.isArray(bank[t]) && bank[t].length)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  if (!rankedConcepts.length) return { ...empty, dueCount };

  // ── per-concept strength from sr_cards ────────────────────────────────────
  const strength = new Map();
  try {
    const { data, error } = await db
      .from("sr_cards")
      .select("topic, reviews_total, reviews_correct")
      .eq("user_id", userId)
      .eq("language", fullLang)
      .in("topic", rankedConcepts);
    if (!error) {
      const agg = new Map();
      for (const c of data || []) {
        if (!c.topic) continue;
        const a = agg.get(c.topic) || { tot: 0, ok: 0 };
        a.tot += c.reviews_total || 0;
        a.ok += c.reviews_correct || 0;
        agg.set(c.topic, a);
      }
      for (const [t, a] of agg) strength.set(t, a.tot > 0 ? a.ok / a.tot : null);
    }
  } catch (err) {
    console.warn("[reviewQueue] strength read:", err.message);
  }

  // ── pick + resolve items, interleaved across concepts ─────────────────────
  const perConceptItems = []; // [{ concept, items:[resolved...] }]
  for (const concept of rankedConcepts) {
    const plan = planForStrength(strength.has(concept) ? strength.get(concept) : null);
    const ordered = orderByPreference(bank[concept], plan.prefer);
    const picked = [];
    for (const entry of ordered) {
      if (picked.length >= plan.count) break;
      const item = await resolveItem(entry.ref, shortLang);
      if (!item) continue;
      picked.push({ item, concept, difficulty: entry.difficulty });
    }
    if (picked.length) perConceptItems.push({ concept, items: picked });
  }

  // Round-robin interleave so the session mixes concepts (interleaving effect),
  // dedup, and cap at the cognitive-load limit.
  const seen = new Set();
  const queue = [];
  let added = true;
  let round = 0;
  while (added && queue.length < limit) {
    added = false;
    for (const bucket of perConceptItems) {
      if (queue.length >= limit) break;
      const next = bucket.items[round];
      if (!next) continue;
      added = true;
      const key = dedupKey(next.item);
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      queue.push({ ...next.item, _concept: next.concept, _difficulty: next.difficulty });
    }
    round++;
  }

  const conceptsOut = rankedConcepts
    .filter((c) => perConceptItems.some((b) => b.concept === c))
    .map((c) => ({ topic: c, count: priority.get(c) || 0 }));

  return { items: queue, concepts: conceptsOut, dueCount };
}

// Test seam: lets unit tests reset the static caches between cases.
export function _resetReviewCaches() {
  _bankCache.clear();
  _lessonCache.clear();
}
