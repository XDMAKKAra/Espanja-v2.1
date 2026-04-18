/**
 * Learning path — sequential topics that unlock progressively.
 *
 * Each topic has: key, label (Finnish), description, difficulty,
 * promptFocus (what the AI should focus on when generating exercises).
 *
 * Unlock rule: topic[n] unlocks when topic[n-1] is mastered (>=80% on 20Q test).
 * First topic always starts in "available" state.
 */

import supabase from "../supabase.js";

export const MASTERY_THRESHOLD = 0.80;  // 80% to master
export const MASTERY_TEST_SIZE = 20;

export const LEARNING_PATH = [
  {
    key: "present_regular",
    label: "Preesens — säännölliset verbit",
    short: "Preesens reg.",
    description: "-ar, -er, -ir verbien taivutus preesensissä.",
    level: "A",
    promptFocus: "Regular present tense conjugation of -ar, -er, -ir verbs (hablar, comer, vivir). Focus on all 6 persons.",
  },
  {
    key: "present_irregular",
    label: "Preesens — epäsäännölliset verbit",
    short: "Preesens epäs.",
    description: "Ser, estar, tener, ir, hacer ja muut yleisimmät epäsäännölliset.",
    level: "A",
    promptFocus: "Irregular present tense: ser, estar, tener, ir, hacer, venir, poder, querer, decir, poner, salir, traer. Include stem-changers (e→ie, o→ue).",
  },
  {
    key: "preterite",
    label: "Preteriti",
    short: "Preteriti",
    description: "Yksinkertainen mennyt aika: yksittäiset tapahtumat.",
    level: "B",
    promptFocus: "Preterite tense (pretérito indefinido): hablé, comiste, vivió. Include common irregulars (ser/ir, tener, estar, hacer, ver, dar). Use time markers like ayer, anoche, el año pasado.",
  },
  {
    key: "imperfect",
    label: "Imperfekti",
    short: "Imperfekti",
    description: "Kuvaava mennyt aika: toistuvat teot, taustat.",
    level: "B",
    promptFocus: "Imperfect tense: hablaba, comía, vivía. Only 3 irregulars: ser (era), ir (iba), ver (veía). Use markers like siempre, todos los días, cuando era pequeño.",
  },
  {
    key: "preterite_vs_imperfect",
    label: "Preteriti vs. imperfekti",
    short: "Pret. vs imperf.",
    description: "Milloin kumpaa? — Yo-kokeen klassikko.",
    level: "C",
    promptFocus: "Distinguishing preterite vs imperfect. Mix both tenses in same contexts. Test: completed actions vs descriptions, interrupted actions (estaba + cuando), habitual vs specific events.",
  },
  {
    key: "future",
    label: "Futuuri",
    short: "Futuuri",
    description: "Tulevat tapahtumat: -aré, -erás...",
    level: "C",
    promptFocus: "Future tense: hablaré, comerás, vivirá. Include common irregulars (tendré, pondré, haré, diré, querré, sabré). Also futuro próximo (ir a + inf) as alternative.",
  },
  {
    key: "conditional",
    label: "Konditionaali",
    short: "Konditionaali",
    description: "Haluaisin, voisin... — kohteliaisuus ja ehdot.",
    level: "C",
    promptFocus: "Conditional: hablaría, comerías, vivirían. Same irregulars as future. Use: polite requests (me gustaría, querría), hypothetical (si tuviera), future-in-past.",
  },
  {
    key: "subjunctive_present",
    label: "Subjunktiivi — preesens",
    short: "Subjunktiivi",
    description: "Ojalá, es importante que, no creo que...",
    level: "M",
    promptFocus: "Present subjunctive: hable, coma, viva. Trigger expressions: ojalá, es importante/bueno/necesario que, no creer que, dudar que, para que, antes de que, cuando (future), quiero que.",
  },
  {
    key: "pluscuamperfecto",
    label: "Pluskvamperfekti",
    short: "Pluskvamp.",
    description: "Había hablado — 'olin tehnyt' ennen toista menneisyyttä.",
    level: "M",
    promptFocus: "Pluperfect (pluscuamperfecto): había + past participle. Use for actions completed before another past action. Mix with preterite/imperfect in complex sentences.",
  },
  {
    key: "subjunctive_imperfect",
    label: "Subjunktiivi — imperfekti",
    short: "Subj. imperf.",
    description: "Si tuviera... — epätodelliset ehtolauseet.",
    level: "E",
    promptFocus: "Imperfect subjunctive (-ra or -se forms): hablara/hablase. Use: unreal conditionals (si tuviera, haría), polite expressions (quisiera), sequence of tenses (quería que + imperfect subjunctive).",
  },
];

const TOPIC_KEYS = LEARNING_PATH.map(t => t.key);

export function getTopicByKey(key) {
  return LEARNING_PATH.find(t => t.key === key) || null;
}

export function getNextTopicKey(currentKey) {
  const idx = TOPIC_KEYS.indexOf(currentKey);
  if (idx < 0 || idx >= TOPIC_KEYS.length - 1) return null;
  return TOPIC_KEYS[idx + 1];
}

/**
 * Get user's full path with current status per topic.
 * Guarantees first topic is at least "available".
 */
export async function getUserPath(userId) {
  const { data: rows, error } = await supabase
    .from("user_mastery")
    .select("*")
    .eq("user_id", userId);

  const byKey = {};
  for (const r of rows || []) byKey[r.topic_key] = r;

  // Build path state: first topic always available, rest locked until prev mastered
  let prevMastered = true; // first topic is always unlocked
  const path = LEARNING_PATH.map((topic, i) => {
    const row = byKey[topic.key];
    let status;
    if (row) {
      status = row.status;
    } else if (prevMastered) {
      status = "available";
    } else {
      status = "locked";
    }

    const result = {
      ...topic,
      index: i,
      status,
      bestScore: row?.best_score || 0,
      bestPct: row?.best_pct || 0,
      attempts: row?.attempts || 0,
      masteredAt: row?.mastered_at || null,
    };

    // Next iteration's prevMastered
    prevMastered = status === "mastered";

    return result;
  });

  return path;
}

/**
 * Mark a topic as attempted with a score. If >=80%, mark mastered and unlock next.
 */
export async function recordMasteryAttempt(userId, topicKey, correct, total) {
  const topic = getTopicByKey(topicKey);
  if (!topic) throw new Error("Invalid topic");

  const pct = total > 0 ? correct / total : 0;
  const passed = pct >= MASTERY_THRESHOLD;

  // Fetch existing row
  const { data: existing } = await supabase
    .from("user_mastery")
    .select("*")
    .eq("user_id", userId)
    .eq("topic_key", topicKey)
    .single();

  const prevBest = existing?.best_pct || 0;
  const newBest = Math.max(prevBest, pct);
  const wasMastered = existing?.status === "mastered";

  const row = {
    user_id: userId,
    topic_key: topicKey,
    status: passed || wasMastered ? "mastered" : "in_progress",
    best_score: newBest === pct ? correct : (existing?.best_score || 0),
    best_pct: newBest,
    attempts: (existing?.attempts || 0) + 1,
    mastered_at: passed && !wasMastered ? new Date().toISOString() : (existing?.mastered_at || null),
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from("user_mastery")
    .upsert(row, { onConflict: "user_id,topic_key" });

  // If newly mastered, unlock next topic
  let unlockedNext = null;
  if (passed && !wasMastered) {
    const nextKey = getNextTopicKey(topicKey);
    if (nextKey) {
      await supabase
        .from("user_mastery")
        .upsert({
          user_id: userId,
          topic_key: nextKey,
          status: "available",
          unlocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,topic_key", ignoreDuplicates: false });
      unlockedNext = nextKey;
    }
  }

  return {
    passed,
    pct: Math.round(pct * 100),
    correct,
    total,
    newlyMastered: passed && !wasMastered,
    unlockedNext,
    bestPct: Math.round(newBest * 100),
  };
}

/**
 * Get all mastered topics for mixed review generation.
 */
export async function getMasteredTopics(userId) {
  const { data, error } = await supabase
    .from("user_mastery")
    .select("topic_key")
    .eq("user_id", userId)
    .eq("status", "mastered");

  if (error || !data) return [];
  return data.map(r => r.topic_key);
}
