import { describe, it, expect } from "vitest";
import { seedBank, seedCounts, getSeedItemById, pickFromSeed } from "../lib/seedBank.js";

const VALID_CEFR = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

// Minimums mirror lib/seedBank.js MINIMUMS — tighter guard that CI catches drift.
const EXPECTED_MINS = {
  aukkotehtava: 400,
  matching: 400,
  translation: 200,
  sentenceConstruction: 200,
  readingPassages: 50,
  writingPrompts: 20,
  correction: 40,
};

describe("seedBank boot & counts", () => {
  it("loads every declared collection", () => {
    for (const key of Object.keys(EXPECTED_MINS)) {
      expect(Array.isArray(seedBank[key])).toBe(true);
    }
  });

  it("each collection meets its minimum size", () => {
    for (const [key, min] of Object.entries(EXPECTED_MINS)) {
      expect(seedBank[key].length, `${key} below minimum`).toBeGreaterThanOrEqual(min);
    }
  });

  it("seedCounts reflects actual collection sizes", () => {
    for (const [k, v] of Object.entries(seedCounts)) {
      expect(v).toBe(seedBank[k].length);
    }
  });

  it("all ids are globally unique across collections", () => {
    const seen = new Map();
    for (const [col, items] of Object.entries(seedBank)) {
      for (const item of items) {
        if (seen.has(item.id)) {
          throw new Error(`duplicate id ${item.id} in ${col} and ${seen.get(item.id)}`);
        }
        seen.set(item.id, col);
      }
    }
  });
});

describe("seed shape invariants", () => {
  it("aukkotehtava items have required fields and a blank marker", () => {
    for (const x of seedBank.aukkotehtava) {
      expect(typeof x.id).toBe("string");
      expect(typeof x.topic).toBe("string");
      expect(VALID_CEFR.has(x.cefr)).toBe(true);
      expect(x.sentence).toMatch(/___/);
      expect(typeof x.answer).toBe("string");
      expect(x.answer.length).toBeGreaterThan(0);
      expect(Array.isArray(x.alt_answers)).toBe(true);
      expect(typeof x.explanation_fi).toBe("string");
    }
  });

  it("matching items have es + fi strings", () => {
    for (const x of seedBank.matching) {
      expect(typeof x.es).toBe("string");
      expect(typeof x.fi).toBe("string");
      expect(x.es.length).toBeGreaterThan(0);
      expect(x.fi.length).toBeGreaterThan(0);
      expect(VALID_CEFR.has(x.cefr)).toBe(true);
    }
  });

  it("translation items have prompt_fi + answer", () => {
    for (const x of seedBank.translation) {
      expect(typeof x.prompt_fi).toBe("string");
      expect(typeof x.answer).toBe("string");
      expect(Array.isArray(x.alt_answers)).toBe(true);
    }
  });

  it("sentenceConstruction items have required_words array + sample_answer", () => {
    for (const x of seedBank.sentenceConstruction) {
      expect(Array.isArray(x.required_words)).toBe(true);
      expect(x.required_words.length).toBeGreaterThan(0);
      expect(typeof x.sample_answer).toBe("string");
      expect(typeof x.prompt_fi).toBe("string");
    }
  });

  it("readingPassages have body + questions array", () => {
    for (const x of seedBank.readingPassages) {
      expect(typeof x.body).toBe("string");
      expect(x.body.length).toBeGreaterThan(50);
      expect(Array.isArray(x.questions)).toBe(true);
      expect(x.questions.length).toBeGreaterThan(0);
    }
  });

  it("writingPrompts have prompt_fi + word_target + genre", () => {
    for (const x of seedBank.writingPrompts) {
      expect(typeof x.prompt_fi).toBe("string");
      expect(typeof x.word_target).toBe("number");
      expect(x.word_target).toBeGreaterThan(0);
      expect(typeof x.genre).toBe("string");
    }
  });

  it("correction items have error + correct sentences and errors array", () => {
    for (const x of seedBank.correction) {
      expect(typeof x.erroneous_sentence).toBe("string");
      expect(typeof x.correct_sentence).toBe("string");
      expect(x.erroneous_sentence).not.toBe(x.correct_sentence);
      expect(Array.isArray(x.errors)).toBe(true);
    }
  });
});

describe("getSeedItemById", () => {
  it("finds an item by id within a specified collection", () => {
    const first = seedBank.aukkotehtava[0];
    expect(getSeedItemById(first.id, "aukkotehtava")).toBe(first);
  });

  it("returns undefined for unknown id", () => {
    expect(getSeedItemById("no_such_id_12345")).toBeUndefined();
  });

  it("searches across collections when none specified", () => {
    const m = seedBank.matching[0];
    expect(getSeedItemById(m.id)).toBe(m);
  });

  it("returns undefined when id exists but wrong collection is specified", () => {
    const m = seedBank.matching[0];
    expect(getSeedItemById(m.id, "aukkotehtava")).toBeUndefined();
  });
});

describe("pickFromSeed", () => {
  it("returns requested count when pool is large", () => {
    const out = pickFromSeed("aukkotehtava", { count: 5 });
    expect(out.length).toBe(5);
  });

  it("respects excludeIds", () => {
    const first = seedBank.aukkotehtava[0];
    const out = pickFromSeed("aukkotehtava", { count: 50, excludeIds: [first.id] });
    expect(out.find(x => x.id === first.id)).toBeUndefined();
  });

  it("filters by topic+cefr when present", () => {
    const sample = seedBank.aukkotehtava[0];
    const out = pickFromSeed("aukkotehtava", { topic: sample.topic, cefr: sample.cefr, count: 3 });
    for (const x of out) {
      expect(x.topic).toBe(sample.topic);
      expect(x.cefr).toBe(sample.cefr);
    }
  });

  it("relaxes cefr when topic+cefr yields nothing", () => {
    // topic exists but with impossible cefr — falls back to topic-only
    const sample = seedBank.aukkotehtava[0];
    const out = pickFromSeed("aukkotehtava", { topic: sample.topic, cefr: "C2", count: 3 });
    for (const x of out) {
      expect(x.topic).toBe(sample.topic);
    }
    expect(out.length).toBeGreaterThan(0);
  });

  it("relaxes topic when neither topic nor cefr match", () => {
    const out = pickFromSeed("aukkotehtava", { topic: "no_such_topic", cefr: "C2", count: 3 });
    expect(out.length).toBe(3);
  });

  it("returns empty array for unknown collection", () => {
    const out = pickFromSeed("nope", { count: 5 });
    expect(out).toEqual([]);
  });

  it("defaults count to 1", () => {
    const out = pickFromSeed("aukkotehtava", {});
    expect(out.length).toBe(1);
  });
});
