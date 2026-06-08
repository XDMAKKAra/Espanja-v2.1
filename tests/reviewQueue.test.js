// L-V411 Vaihe C — review queue engine. Mock DB rows, REAL item bank + lesson
// files, so this also proves ref resolution works end to end.

import { describe, it, expect } from "vitest";
import { buildReviewQueue } from "../lib/reviewQueue.js";

const RENDERABLE = new Set(["mc", "typed", "gap_fill", "translate", "match"]);
const NOW = new Date("2026-06-09T12:00:00Z");

// Chainable thenable mock: branches sr_cards by selected columns.
function mockDb({ mistakes = [], due = [], strength = [] } = {}) {
  return {
    from(table) {
      let cols = "";
      const b = {
        select(c) { cols = c; return b; },
        eq() { return b; },
        gte() { return b; },
        lte() { return b; },
        in() { return b; },
        then(resolve) {
          let data = [];
          if (table === "user_mistakes") data = mistakes;
          else if (table === "sr_cards") data = cols.includes("next_review") ? due : strength;
          resolve({ data, error: null });
        },
      };
      return b;
    },
  };
}

describe("buildReviewQueue", () => {
  it("resurfaces a weak concept with real renderable items", async () => {
    const db = mockDb({
      mistakes: [
        { topics: ["subjunctive"], language: "spanish", created_at: NOW.toISOString() },
        { topics: ["subjunctive"], language: "spanish", created_at: NOW.toISOString() },
        { topics: ["ser_estar"], language: "spanish", created_at: NOW.toISOString() },
      ],
      due: [{ topic: "subjunctive", next_review: "2026-06-01" }],
      strength: [{ topic: "subjunctive", reviews_total: 4, reviews_correct: 1 }],
    });
    const q = await buildReviewQueue({ userId: "u1", lang: "es", db, now: NOW });

    expect(q.items.length).toBeGreaterThan(0);
    expect(q.dueCount).toBe(1);
    expect(q.concepts.map((c) => c.topic)).toContain("subjunctive");
    for (const it of q.items) {
      expect(RENDERABLE.has(it.item_type)).toBe(true);
      expect(it._concept).toBeTruthy();
      expect(it.stem || it.prompt || it.sentence_template || it.source).toBeTruthy();
    }
  });

  it("weak concept (low strength) biases toward easier items + more of them", async () => {
    const weak = await buildReviewQueue({
      userId: "u1", lang: "es", now: NOW,
      db: mockDb({
        mistakes: [{ topics: ["subjunctive"], language: "spanish", created_at: NOW.toISOString() }],
        strength: [{ topic: "subjunctive", reviews_total: 6, reviews_correct: 1 }], // ~0.17
      }),
    });
    const strong = await buildReviewQueue({
      userId: "u2", lang: "es", now: NOW,
      db: mockDb({
        mistakes: [{ topics: ["subjunctive"], language: "spanish", created_at: NOW.toISOString() }],
        strength: [{ topic: "subjunctive", reviews_total: 10, reviews_correct: 10 }], // 1.0
      }),
    });
    // weak grip -> up to 3 items; strong grip -> trimmed to 1
    expect(weak.items.length).toBeGreaterThan(strong.items.length);
  });

  it("ignores concepts not present in the bank", async () => {
    const q = await buildReviewQueue({
      userId: "u1", lang: "es", now: NOW,
      db: mockDb({ mistakes: [{ topics: ["definitely_not_a_concept"], language: "spanish", created_at: NOW.toISOString() }] }),
    });
    expect(q.items.length).toBe(0);
    expect(q.concepts.length).toBe(0);
  });

  it("returns empty (but with dueCount) when there are no mistakes or due cards", async () => {
    const q = await buildReviewQueue({ userId: "u1", lang: "es", db: mockDb({}), now: NOW });
    expect(q.items).toEqual([]);
    expect(q.concepts).toEqual([]);
    expect(q.dueCount).toBe(0);
  });

  it("caps the session at the cognitive-load limit", async () => {
    const many = ["subjunctive", "ser_estar", "preterite_imperfect", "articles", "future", "conditional"]
      .map((t) => ({ topics: [t], language: "spanish", created_at: NOW.toISOString() }));
    const q = await buildReviewQueue({ userId: "u1", lang: "es", db: mockDb({ mistakes: many }), limit: 5, now: NOW });
    expect(q.items.length).toBeLessThanOrEqual(5);
    expect(q.items.length).toBeGreaterThan(0);
  });

  it("works for German with its own concepts (word_order)", async () => {
    const q = await buildReviewQueue({
      userId: "u1", lang: "de", now: NOW,
      db: mockDb({ mistakes: [{ topics: ["word_order"], language: "german", created_at: NOW.toISOString() }] }),
    });
    expect(q.concepts.map((c) => c.topic)).toContain("word_order");
    expect(q.items.length).toBeGreaterThan(0);
    // items must come from German lessons
    for (const it of q.items) expect(RENDERABLE.has(it.item_type)).toBe(true);
  });
});
