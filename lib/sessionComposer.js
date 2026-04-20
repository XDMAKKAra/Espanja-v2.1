// Session composer — builds ordered SlotDef[] for each practice session.
// Pure helpers (buildSessionSlots, pickAdjacencyTopic, isColdStart) are
// synchronous so they can be unit-tested without a DB.

import supabase from "../supabase.js";
import { LEARNING_PATH } from "./learningPath.js";
import { SESSION_BUDGETS } from "./scheduler.js";

// ─── Topic adjacency graph ─────────────────────────────────────────────────
// 9 grammar edges + 5 grammar-vocab edges (from pedagogy/INTERLEAVING.md §3)

export const TOPIC_ADJACENCY = {
  ser_estar:            ["preterite_imperfect", "hay_estar", "conditional", "pronouns"],
  hay_estar:            ["ser_estar", "pronouns"],
  preterite_imperfect:  ["ser_estar", "conditional", "subjunctive"],
  subjunctive:          ["preterite_imperfect", "conditional", "pronouns"],
  conditional:          ["ser_estar", "preterite_imperfect", "subjunctive"],
  pronouns:             ["ser_estar", "subjunctive", "hay_estar"],
  "health and body":    ["ser_estar"],
  "travel and transport": ["preterite_imperfect"],
  "work and economy":   ["conditional"],
  "society and politics": ["subjunctive"],
  "culture and arts":   ["pronouns"],
};

// ─── Constants ─────────────────────────────────────────────────────────────

export const COLD_START_MIN_TOPICS = 2;
export const COLD_START_MIN_MASTERED = 40;

const VOCAB_TOPICS = new Set([
  "health and body", "travel and transport", "work and economy",
  "society and politics", "culture and arts", "family", "food", "hobbies",
]);

const GRAMMAR_COLLECTIONS = ["aukkotehtava", "matching"];
const VOCAB_COLLECTIONS   = ["translation", "matching"];

// ─── Pure helpers ──────────────────────────────────────────────────────────

export function isColdStart(masteredTopics, masteredItemCount) {
  return masteredTopics.length < COLD_START_MIN_TOPICS
      || masteredItemCount < COLD_START_MIN_MASTERED;
}

function seedCollectionForTopic(topic, slotIndex = 0) {
  const pool = VOCAB_TOPICS.has(topic) ? VOCAB_COLLECTIONS : GRAMMAR_COLLECTIONS;
  return pool[slotIndex % pool.length];
}

export function pickAdjacencyTopic(availableTopics, lastTopic) {
  if (lastTopic && TOPIC_ADJACENCY[lastTopic]) {
    const neighbors = TOPIC_ADJACENCY[lastTopic].filter(t => availableTopics.includes(t));
    if (neighbors.length) return neighbors[Math.floor(Math.random() * neighbors.length)];
  }
  return availableTopics[Math.floor(Math.random() * availableTopics.length)];
}

/**
 * Build session slots from pre-fetched data — pure, no I/O.
 *
 * @param {object[]} dueCards     - SR cards due today, each with { id, word, topic, daysOverdue }
 * @param {string[]} masteredTopics
 * @param {number}   masteredItemCount
 * @param {{ reviews: number, newCards: number }} budget
 * @param {{ forceTopic?: string, coldStartPath?: string[] }} opts
 * @returns {SlotDef[]}
 */
export function buildSessionSlots(dueCards, masteredTopics, masteredItemCount, budget, opts = {}) {
  const { forceTopic, coldStartPath = [] } = opts;
  const coldStart = isColdStart(masteredTopics, masteredItemCount);
  const slots = [];

  // ── Reviews ──────────────────────────────────────────────────────────────
  // Sort by urgency (most overdue first), then round-robin topics to keep spread.
  const sorted = [...dueCards].sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0));
  const reviewCount = Math.min(sorted.length, budget.reviews);

  // Group by topic
  const byTopic = {};
  for (const card of sorted.slice(0, budget.reviews)) {
    const t = card.topic || "vocab";
    (byTopic[t] = byTopic[t] || []).push(card);
  }
  const topicKeys = Object.keys(byTopic);

  let lastTopic = null;
  let consecutive = 0;
  let topicCursor = 0;

  for (let i = 0; i < reviewCount; i++) {
    // Round-robin with max-2-consecutive cap
    let chosen = null;
    for (let attempt = 0; attempt < topicKeys.length; attempt++) {
      const t = topicKeys[(topicCursor + attempt) % topicKeys.length];
      if (!byTopic[t]?.length) continue;
      if (t === lastTopic && consecutive >= 2) continue;
      chosen = t;
      topicCursor = (topicKeys.indexOf(t) + 1) % topicKeys.length;
      break;
    }
    if (!chosen) break;

    const card = byTopic[chosen].shift();
    consecutive = chosen === lastTopic ? consecutive + 1 : 1;
    lastTopic = chosen;

    slots.push({
      type: "review",
      topic: chosen,
      seedCollection: seedCollectionForTopic(chosen, i),
      srCardId: card.id,
      word: card.word,
    });
  }

  // ── New items ─────────────────────────────────────────────────────────────
  // Cold-start: walk LEARNING_PATH. Warm: adjacency-weighted from mastered topics.
  const newCount = budget.newCards;
  const allTopics = masteredTopics.length
    ? masteredTopics
    : coldStartPath.length ? coldStartPath : ["ser_estar"];

  for (let i = 0; i < newCount; i++) {
    let topic;
    if (forceTopic) {
      topic = forceTopic;
    } else if (coldStart) {
      topic = coldStartPath[0] || allTopics[0];
    } else {
      // Enforce max-2-consecutive across all slots by avoiding lastTopic if needed
      const candidate = pickAdjacencyTopic(allTopics, lastTopic);
      if (candidate === lastTopic && consecutive >= 2 && allTopics.length > 1) {
        const others = allTopics.filter(t => t !== lastTopic);
        topic = others[Math.floor(Math.random() * others.length)];
      } else {
        topic = candidate;
      }
    }

    consecutive = topic === lastTopic ? consecutive + 1 : 1;
    // Every 5th grammar slot becomes a correction exercise
    const isGrammarTopic = !VOCAB_TOPICS.has(topic);
    const useCorrection  = isGrammarTopic && (i % 5 === 4);

    slots.push({
      type: "new",
      topic,
      seedCollection: useCorrection ? "correction" : seedCollectionForTopic(topic, i),
      srCardId: null,
      word: null,
    });
    lastTopic = topic;
  }

  return slots;
}

// ─── Async entrypoint ──────────────────────────────────────────────────────

/**
 * Compose a full session for a user.
 *
 * @param {{ userId: string, mode?: string, forceTopic?: string }} params
 * @returns {Promise<{ slots: SlotDef[], coldStart: boolean, budget: object }>}
 */
export async function composeSession({ userId, mode = "normaali", forceTopic }) {
  const budget = SESSION_BUDGETS[mode] || SESSION_BUDGETS.normaali;
  const today = new Date().toISOString().slice(0, 10);

  // 1. SR-due cards
  const { data: dueRaw } = await supabase
    .from("sr_cards")
    .select("id, word, topic, next_review, interval_days")
    .eq("user_id", userId)
    .lte("next_review", today)
    .order("next_review", { ascending: true })
    .limit(budget.reviews * 2);

  const dueCards = (dueRaw || []).map(c => ({
    ...c,
    daysOverdue: Math.max(0, Math.floor(
      (Date.now() - new Date(c.next_review).getTime()) / 86400000
    )),
  }));

  // 2. Mastery data
  const { data: masteryRows } = await supabase
    .from("user_mastery")
    .select("topic, status, best_pct")
    .eq("user_id", userId);

  const masteredTopics = (masteryRows || [])
    .filter(r => r.status === "mastered")
    .map(r => r.topic);

  // Approximate mastered item count from sr_cards mastered state
  const { count: masteredItemCount } = await supabase
    .from("sr_cards")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("state", "mastered");

  // 3. Cold-start path
  const coldStart = isColdStart(masteredTopics, masteredItemCount || 0);
  const coldStartPath = coldStart
    ? LEARNING_PATH
        .filter(t => !masteredTopics.includes(t.key))
        .map(t => t.key)
        .slice(0, 3)
    : [];

  const slots = buildSessionSlots(
    dueCards,
    masteredTopics,
    masteredItemCount || 0,
    budget,
    { forceTopic, coldStartPath }
  );

  return { slots, coldStart, budget };
}
