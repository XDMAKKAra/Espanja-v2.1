// L-V411 Vaihe A — item bank acceptance.
// Locks: all three language banks exist, every indexed concept has a usable
// pool (>= MIN items), items are renderable + carry the ref/difficulty/level/
// source metadata the runtime needs, and de/fr are neither empty nor es clones.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { VALID_TOPICS } from "../lib/mistakeTaxonomy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_DIR = path.resolve(__dirname, "..", "data", "item-bank");
const LANGS = ["es", "de", "fr"];
const MIN_ITEMS = 3;
const RENDERABLE = new Set(["mc", "typed", "gap_fill", "translate", "match"]);

function loadBank(lang) {
  return JSON.parse(fs.readFileSync(path.join(BANK_DIR, `${lang}.json`), "utf8"));
}

describe("item bank — files exist for all three languages", () => {
  for (const lang of LANGS) {
    it(`${lang}.json exists and parses`, () => {
      const p = path.join(BANK_DIR, `${lang}.json`);
      expect(fs.existsSync(p)).toBe(true);
      const bank = loadBank(lang);
      expect(Object.keys(bank).length).toBeGreaterThan(10);
    });
  }
});

describe("item bank — structure and coverage", () => {
  for (const lang of LANGS) {
    const bank = loadBank(lang);
    it(`${lang}: every concept is a valid taxonomy key with >= ${MIN_ITEMS} renderable items`, () => {
      for (const [concept, items] of Object.entries(bank)) {
        expect(VALID_TOPICS.has(concept), `unknown concept "${concept}"`).toBe(true);
        expect(items.length, `${concept} thin`).toBeGreaterThanOrEqual(MIN_ITEMS);
        for (const e of items) {
          expect(RENDERABLE.has(e.item_type), `${concept} bad type ${e.item_type}`).toBe(true);
          expect(["easy", "medium", "hard"]).toContain(e.difficulty);
          expect(["authored", "generated"]).toContain(e.source);
          if (e.source === "authored") {
            // ref-only: payload resolved at runtime from the lesson JSON
            expect(e.ref).toBeTruthy();
            expect(e.ref.kurssiKey.startsWith(lang + "_")).toBe(true);
            expect(typeof e.ref.lessonIndex === "number" || e.ref.lessonIndex === null).toBe(true);
            expect(typeof e.ref.itemIndex).toBe("number");
            expect(e.item).toBeUndefined();
          } else {
            // generated items carry their own payload (no lesson file)
            expect(e.item).toBeTruthy();
          }
        }
      }
    });
  }
});

describe("item bank — es subjunctive pool is varied and renderable", () => {
  const es = loadBank("es");
  it("has a subjunctive concept with >= 2 distinct item_types", () => {
    expect(es.subjunctive).toBeTruthy();
    expect(es.subjunctive.length).toBeGreaterThanOrEqual(MIN_ITEMS);
    const types = new Set(es.subjunctive.map((e) => e.item_type));
    expect(types.size).toBeGreaterThanOrEqual(2);
  });
});

describe("item bank — de/fr are real, not empty, not es clones", () => {
  const es = loadBank("es");
  const de = loadBank("de");
  const fr = loadBank("fr");

  it("de and fr have their own non-trivial concept sets", () => {
    expect(Object.keys(de).length).toBeGreaterThan(10);
    expect(Object.keys(fr).length).toBeGreaterThan(10);
  });

  it("de items reference de courses, fr items reference fr courses (not copied from es)", () => {
    const sample = (bank) => Object.values(bank).flat().slice(0, 50);
    for (const e of sample(de)) expect(e.ref.kurssiKey.startsWith("de_")).toBe(true);
    for (const e of sample(fr)) expect(e.ref.kurssiKey.startsWith("fr_")).toBe(true);
  });

  it("de/fr concept pools differ from es in content (German/French has different grammar)", () => {
    // word_order is a core DE concept (V2/subordinate clauses) but barely exists in es
    expect((de.word_order || []).length).toBeGreaterThan((es.word_order || []).length);
    // relative pronouns dont/où give fr a large relative_pronouns pool
    expect((fr.relative_pronouns || []).length).toBeGreaterThan(50);
  });
});
