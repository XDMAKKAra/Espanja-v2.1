import { describe, it, expect } from "vitest";
import { captureAdaptiveSignals, sanitiseGradedItems } from "../lib/adaptiveCapture.js";

// Minimal chainable supabase mock. Records upsert/insert payloads; the select
// chain (.select().eq().eq().in()) resolves to the seeded existing cards.
function makeDb({ existing = [] } = {}) {
  const calls = { upserts: [], inserts: [], reads: [] };
  const api = {
    from(table) {
      const builder = {
        select() { return builder; },
        eq() { return builder; },
        in(_col, words) {
          calls.reads.push({ table, words });
          return Promise.resolve({ data: existing, error: null });
        },
        upsert(rows, opts) {
          calls.upserts.push({ table, rows, opts });
          return Promise.resolve({ error: null });
        },
        insert(rows) {
          calls.inserts.push({ table, rows });
          return Promise.resolve({ error: null });
        },
      };
      return builder;
    },
  };
  return { api, calls };
}

const NOW = new Date("2026-06-08T10:00:00Z");

describe("sanitiseGradedItems", () => {
  it("drops non-objects, items without a question, and caps at 80", () => {
    const raw = [
      null,
      { itemType: "mc", correct: true, question: "madre" },
      { itemType: "typed", correct: false }, // no question → dropped
      ...Array.from({ length: 100 }, (_, i) => ({ itemType: "mc", correct: true, question: `w${i}` })),
    ];
    const out = sanitiseGradedItems(raw);
    // Cap (80) applies before the question-filter, so the one question-less
    // item that falls inside the first 80 is then dropped → 79.
    expect(out.length).toBe(79);
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out[0]).toMatchObject({ itemType: "mc", correct: true, question: "madre" });
  });

  it("coerces correct to boolean and clamps string lengths", () => {
    const out = sanitiseGradedItems([{ correct: 1, question: "x".repeat(500) }]);
    expect(out[0].correct).toBe(true);
    expect(out[0].question.length).toBe(300);
    expect(out[0].itemType).toBe("unknown");
  });
});

describe("captureAdaptiveSignals", () => {
  it("writes one SR card per distinct word and one mistake row per wrong answer", async () => {
    const { api, calls } = makeDb();
    const items = sanitiseGradedItems([
      { itemType: "mc", correct: true, question: "madre", studentAnswer: "äiti", correctAnswer: "äiti" },
      { itemType: "typed", correct: false, question: "hermana", studentAnswer: "veli", correctAnswer: "sisko" },
      { itemType: "gap_fill", correct: false, question: "el _ es alto", correctAnswer: "niño" },
    ]);

    const res = await captureAdaptiveSignals(api, "user-1", "spanish", items, NOW);

    expect(res).toEqual({ srUpserted: 3, mistakesInserted: 2 });

    const sr = calls.upserts.find((u) => u.table === "sr_cards");
    expect(sr.opts).toEqual({ onConflict: "user_id,word,language" });
    expect(sr.rows).toHaveLength(3);
    for (const row of sr.rows) {
      expect(row.user_id).toBe("user-1");
      expect(row.language).toBe("spanish");
      expect(row.reviews_total).toBe(1);
      expect(typeof row.next_review).toBe("string");
    }
    // Correct answer → successful retrieval → repetitions advance to 1.
    expect(sr.rows.find((r) => r.word === "madre").repetitions).toBe(1);
    expect(sr.rows.find((r) => r.word === "madre").reviews_correct).toBe(1);
    // Wrong answer → failed retrieval → SM-2 resets repetitions, interval 1.
    const wrongCard = sr.rows.find((r) => r.word === "hermana");
    expect(wrongCard.repetitions).toBe(0);
    expect(wrongCard.interval_days).toBe(1);
    expect(wrongCard.reviews_correct).toBe(0);

    const mistakes = calls.inserts.find((i) => i.table === "user_mistakes");
    expect(mistakes.rows).toHaveLength(2);
    const hermana = mistakes.rows.find((m) => m.question === "hermana");
    expect(hermana).toMatchObject({
      user_id: "user-1",
      language: "spanish",
      wrong_answer: "veli",
      correct_answer: "sisko",
      exercise_type: "typed",
    });
    expect(Array.isArray(hermana.topics)).toBe(true);
    expect(hermana.topics.length).toBeGreaterThan(0);
  });

  it("folds repeated attempts of the same word into a single card (no duplicate onConflict key)", async () => {
    const { api, calls } = makeDb();
    const items = sanitiseGradedItems([
      { itemType: "mc", correct: false, question: "ser", correctAnswer: "olla (pysyvä)", explanation: "ser vs estar" },
      { itemType: "typed", correct: true, question: "ser", studentAnswer: "olla", correctAnswer: "olla" },
    ]);

    const res = await captureAdaptiveSignals(api, "user-2", "spanish", items, NOW);

    const sr = calls.upserts.find((u) => u.table === "sr_cards");
    expect(sr.rows).toHaveLength(1); // one upsert row, not two
    expect(sr.rows[0].reviews_total).toBe(2); // both attempts counted
    expect(sr.rows[0].reviews_correct).toBe(1);
    // Only the wrong attempt becomes a mistake row.
    expect(res.mistakesInserted).toBe(1);
    // Grammar explanation drives a canonical topic, not the coarse fallback.
    const mistakes = calls.inserts.find((i) => i.table === "user_mistakes");
    expect(mistakes.rows[0].topics).toContain("ser_estar");
  });

  it("scopes writes to the given language and merges onto existing cards", async () => {
    const existing = [{
      word: "Haus", language: "german", ease_factor: 2.5, interval_days: 6,
      repetitions: 2, reviews_total: 3, reviews_correct: 3, first_reviewed_at: "2026-06-01T00:00:00Z",
    }];
    const { api, calls } = makeDb({ existing });
    const items = sanitiseGradedItems([
      { itemType: "mc", correct: true, question: "Haus", studentAnswer: "talo", correctAnswer: "talo" },
    ]);

    await captureAdaptiveSignals(api, "user-3", "german", items, NOW);

    expect(calls.reads[0]).toMatchObject({ table: "sr_cards", words: ["Haus"] });
    const sr = calls.upserts.find((u) => u.table === "sr_cards");
    expect(sr.rows[0].language).toBe("german");
    expect(sr.rows[0].reviews_total).toBe(4); // 3 existing + 1
    expect(sr.rows[0].repetitions).toBe(3);   // advanced from 2
  });

  it("does nothing when there are no graded items", async () => {
    const { api, calls } = makeDb();
    const res = await captureAdaptiveSignals(api, "user-4", "spanish", [], NOW);
    expect(res).toEqual({ srUpserted: 0, mistakesInserted: 0 });
    expect(calls.upserts).toHaveLength(0);
    expect(calls.inserts).toHaveLength(0);
  });
});
